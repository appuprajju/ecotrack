import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, CarbonLog, Goal, Challenge, UserChallenge, LearningContent, Notification, AuditLog } from '@prisma/client';
import { 
  IUserRepository, 
  ITokenRepository, 
  ICarbonLogRepository, 
  IEmissionFactorRepository, 
  IGoalRepository, 
  IChallengeRepository, 
  ILearningContentRepository, 
  INotificationRepository, 
  IAuditLogRepository 
} from './ports';
import { CarbonCategory, CarbonDomainService, UserStats } from '../domain/carbon';
import { CarbonIntelligenceEngine, ForecastResult, RecommendationAction, GoalSuccessPrediction } from '../infrastructure/ai-engine';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'eco_track_access_secret_key_987654321';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'eco_track_refresh_secret_key_123456789';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class ApplicationAuthService {
  constructor(
    private userRepo: IUserRepository,
    private tokenRepo: ITokenRepository,
    private auditRepo: IAuditLogRepository
  ) {}

  async register(email: string, passwordPlain: string, firstName: string, lastName: string, country?: string): Promise<User> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const user = await this.userRepo.create({
      email,
      passwordHash,
      firstName,
      lastName,
      country
    });

    await this.auditRepo.create({
      userId: user.id,
      action: 'USER_REGISTERED',
      details: JSON.stringify({ email: user.email })
    });

    return user;
  }

  async login(email: string, passwordPlain: string, ip?: string, ua?: string): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const tokens = await this.generateTokenPair(user);

    await this.auditRepo.create({
      userId: user.id,
      action: 'USER_LOGIN',
      ipAddress: ip,
      userAgent: ua
    });

    return { user, tokens };
  }

  async refresh(tokenString: string): Promise<TokenPair> {
    const storedToken = await this.tokenRepo.findByToken(tokenString);
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token.');
    }

    const user = await this.userRepo.findById(storedToken.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Revoke old token and issue a new pair
    await this.tokenRepo.revoke(storedToken.id);
    return this.generateTokenPair(user);
  }

  async logout(userId: string): Promise<void> {
    await this.tokenRepo.revokeAllForUser(userId);
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token to db
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    await this.tokenRepo.create(user.id, refreshToken, expiry);

    return { accessToken, refreshToken };
  }
}

export class ApplicationCarbonService {
  constructor(
    private logRepo: ICarbonLogRepository,
    private factorRepo: IEmissionFactorRepository,
    private notificationRepo: INotificationRepository
  ) {}

  async logEmissions(userId: string, category: CarbonCategory, subCategory: string, value: number): Promise<CarbonLog> {
    const factorData = await this.factorRepo.findBySubCategory(subCategory);
    if (!factorData) {
      throw new Error(`Emission factor not found for sub-category: ${subCategory}`);
    }

    const co2EquivalentKg = CarbonDomainService.calculateCO2(value, factorData.factor);
    const log = await this.logRepo.create({
      userId,
      category,
      subCategory,
      value,
      unit: factorData.unit,
      co2EquivalentKg
    });

    // Alert if dynamic logging has a very high value
    if (co2EquivalentKg > 100) {
      await this.notificationRepo.create(
        userId,
        'High Carbon Logging Alert',
        `You logged a footprint of ${co2EquivalentKg.toFixed(1)}kg CO2 in ${category}. Consider actions to lower this!`,
        'alert'
      );
    }

    return log;
  }

  async deleteLog(userId: string, logId: string): Promise<boolean> {
    const log = await this.logRepo.findById(logId);
    if (!log || log.userId !== userId) {
      throw new Error('Carbon log not found or unauthorized.');
    }
    return this.logRepo.delete(logId);
  }

  async getUserLogs(userId: string, startDate?: Date, endDate?: Date): Promise<CarbonLog[]> {
    return this.logRepo.findByUser(userId, { startDate, endDate });
  }
}

export class ApplicationAnalyticsService {
  constructor(
    private logRepo: ICarbonLogRepository,
    private goalRepo: IGoalRepository,
    private challengeRepo: IChallengeRepository,
    private userRepo: IUserRepository
  ) {}

  async getDashboardAnalytics(userId: string): Promise<{
    sustainabilityScore: number;
    totalEmissionsKg: number;
    byCategory: Record<CarbonCategory, number>;
    recentLogs: CarbonLog[];
    weeklyTrend: { day: string; co2: number }[];
    historicalComparisons: { month: string; co2: number }[];
  }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('User not found');

    const logs = await this.logRepo.findByUser(userId);
    
    // Group categories
    const byCategory: Record<CarbonCategory, number> = {
      transportation: 0,
      energy: 0,
      food: 0,
      waste: 0,
      water: 0
    };

    let totalEmissionsKg = 0;
    logs.forEach(l => {
      const cat = l.category as CarbonCategory;
      if (byCategory[cat] !== undefined) {
        byCategory[cat] += l.co2EquivalentKg;
        totalEmissionsKg += l.co2EquivalentKg;
      }
    });

    // Calculate goals status
    const goals = await this.goalRepo.findByUser(userId);
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const goalCompletionRate = goals.length > 0 ? completedGoals / goals.length : 0.8; // default to 80% if brand new

    // Calculate challenges status
    const userChallenges = await this.challengeRepo.getUserChallenges(userId);
    const activeChallengesCount = userChallenges.filter(c => c.status === 'JOINED').length;

    // Compile user stats for sustainability score
    const hasRenewable = logs.some(l => l.subCategory === 'renewable');
    const wasteRecycled = logs.filter(l => l.category === 'waste' && l.subCategory === 'recyclable').length;
    const totalWasteLogs = logs.filter(l => l.category === 'waste').length;
    const recyclingRate = totalWasteLogs > 0 ? wasteRecycled / totalWasteLogs : 0.5;

    const stats: UserStats = {
      userId,
      totalEmissionsKg,
      emissionsByCategory: byCategory,
      goalCompletionRate,
      activeChallengeCount: activeChallengesCount,
      recyclingRate,
      hasRenewableEnergy: hasRenewable
    };

    // Calculate score (assume 30 days tracked)
    const trackedDays = Math.max(7, Math.ceil(
      logs.length > 0 
        ? (Date.now() - logs[logs.length - 1].loggedAt.getTime()) / (1000 * 60 * 60 * 24) 
        : 30
    ));
    const sustainabilityScore = CarbonDomainService.computeSustainabilityScore(stats, trackedDays);

    // Build Weekly Trend (last 7 days)
    const weeklyTrend: { day: string; co2: number }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = weekdays[d.getDay()];
      const dayStr = d.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(l => l.loggedAt.toISOString().split('T')[0] === dayStr);
      const sumCo2 = dayLogs.reduce((acc, l) => acc + l.co2EquivalentKg, 0);
      
      weeklyTrend.push({
        day: dayLabel,
        co2: parseFloat(sumCo2.toFixed(2))
      });
    }

    // Build Monthly Trend
    const monthlyMap = new Map<string, number>();
    logs.forEach(l => {
      const monthKey = l.loggedAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + l.co2EquivalentKg);
    });

    const historicalComparisons = Array.from(monthlyMap.entries())
      .slice(0, 6)
      .reverse()
      .map(([month, co2]) => ({
        month,
        co2: parseFloat(co2.toFixed(2))
      }));

    return {
      sustainabilityScore,
      totalEmissionsKg: parseFloat(totalEmissionsKg.toFixed(2)),
      byCategory,
      recentLogs: logs.slice(0, 10),
      weeklyTrend,
      historicalComparisons
    };
  }
}

export class ApplicationGoalService {
  constructor(
    private goalRepo: IGoalRepository,
    private logRepo: ICarbonLogRepository,
    private notificationRepo: INotificationRepository
  ) {}

  async createGoal(userId: string, title: string, category: string, targetCo2Kg: number, startDate: Date, endDate: Date): Promise<Goal> {
    const goal = await this.goalRepo.create({
      userId,
      title,
      category,
      targetCo2Kg,
      startDate,
      endDate
    });

    await this.notificationRepo.create(
      userId,
      'Goal Started!',
      `You set a target of ${targetCo2Kg}kg CO2 for "${title}". Track your activities to achieve this!`,
      'goal'
    );

    return goal;
  }

  async listUserGoals(userId: string): Promise<(Goal & { prediction?: GoalSuccessPrediction })[]> {
    const goals = await this.goalRepo.findByUser(userId);
    const logs = await this.logRepo.findByUser(userId);

    return goals.map(goal => {
      if (goal.status === 'ACTIVE') {
        const prediction = CarbonIntelligenceEngine.predictGoalSuccess(goal, logs);
        return { ...goal, prediction };
      }
      return goal;
    });
  }

  async updateGoalStatus(userId: string, goalId: string, status: 'ACTIVE' | 'COMPLETED' | 'FAILED'): Promise<Goal> {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error('Goal not found or unauthorized.');
    }
    const updated = await this.goalRepo.updateStatus(goalId, status);
    
    await this.notificationRepo.create(
      userId,
      `Goal status updated: ${status}`,
      `Your sustainability target "${goal.title}" is marked as ${status}.`,
      'goal'
    );
    
    return updated;
  }
}

export class ApplicationChallengeService {
  constructor(
    private challengeRepo: IChallengeRepository,
    private notificationRepo: INotificationRepository,
    private auditRepo: IAuditLogRepository
  ) {}

  async listChallenges(): Promise<Challenge[]> {
    return this.challengeRepo.listAll();
  }

  async joinChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found.');
    }
    
    const userChallenge = await this.challengeRepo.joinChallenge(userId, challengeId);
    
    await this.notificationRepo.create(
      userId,
      'Joined Challenge!',
      `You joined the "${challenge.title}" challenge. Time to start saving emissions!`,
      'challenge'
    );

    await this.auditRepo.create({
      userId,
      action: 'CHALLENGE_JOINED',
      details: JSON.stringify({ challengeId, title: challenge.title })
    });

    return userChallenge;
  }

  async completeChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found.');
    }

    const updated = await this.challengeRepo.completeChallenge(userId, challengeId);

    await this.notificationRepo.create(
      userId,
      'Challenge Completed! 🎉',
      `Awesome! You completed "${challenge.title}" and saved an estimated ${challenge.co2SavingsEstKg}kg of CO2!`,
      'challenge'
    );

    await this.auditRepo.create({
      userId,
      action: 'CHALLENGE_COMPLETED',
      details: JSON.stringify({ challengeId, title: challenge.title })
    });

    return updated;
  }

  async getUserChallenges(userId: string): Promise<(UserChallenge & { challenge: Challenge })[]> {
    return this.challengeRepo.getUserChallenges(userId);
  }
}

export class ApplicationRecommendationService {
  constructor(
    private logRepo: ICarbonLogRepository,
    private userRepo: IUserRepository
  ) {}

  async getRecommendations(userId: string): Promise<RecommendationAction[]> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('User not found.');

    const logs = await this.logRepo.findByUser(userId);

    const categoryEmissions: Record<CarbonCategory, number> = {
      transportation: 0,
      energy: 0,
      food: 0,
      waste: 0,
      water: 0
    };

    logs.forEach(l => {
      const cat = l.category as CarbonCategory;
      if (categoryEmissions[cat] !== undefined) {
        categoryEmissions[cat] += l.co2EquivalentKg;
      }
    });

    const hasRenewable = logs.some(l => l.subCategory === 'renewable');

    return CarbonIntelligenceEngine.generatePersonalizedRecommendations(
      categoryEmissions,
      hasRenewable
    );
  }
}
