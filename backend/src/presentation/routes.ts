import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  authMiddleware, 
  roleGuard, 
  AuthenticatedRequest 
} from './middlewares';
import { 
  PrismaUserRepository, 
  PrismaTokenRepository, 
  PrismaCarbonLogRepository, 
  PrismaEmissionFactorRepository, 
  PrismaGoalRepository, 
  PrismaChallengeRepository, 
  PrismaLearningContentRepository, 
  PrismaNotificationRepository, 
  PrismaAuditLogRepository 
} from '../infrastructure/repositories';
import { 
  ApplicationAuthService, 
  ApplicationCarbonService, 
  ApplicationAnalyticsService, 
  ApplicationGoalService, 
  ApplicationChallengeService, 
  ApplicationRecommendationService 
} from '../application/services';
import { CarbonCategory } from '../domain/carbon';

export const apiRouter = Router();

// 1. Initialize Prisma & Dependencies
const prisma = new PrismaClient();

const userRepo = new PrismaUserRepository(prisma);
const tokenRepo = new PrismaTokenRepository(prisma);
const logRepo = new PrismaCarbonLogRepository(prisma);
const factorRepo = new PrismaEmissionFactorRepository(prisma);
const goalRepo = new PrismaGoalRepository(prisma);
const challengeRepo = new PrismaChallengeRepository(prisma);
const contentRepo = new PrismaLearningContentRepository(prisma);
const notificationRepo = new PrismaNotificationRepository(prisma);
const auditRepo = new PrismaAuditLogRepository(prisma);

const authService = new ApplicationAuthService(userRepo, tokenRepo, auditRepo);
const carbonService = new ApplicationCarbonService(logRepo, factorRepo, notificationRepo);
const analyticsService = new ApplicationAnalyticsService(logRepo, goalRepo, challengeRepo, userRepo);
const goalService = new ApplicationGoalService(goalRepo, logRepo, notificationRepo);
const challengeService = new ApplicationChallengeService(challengeRepo, notificationRepo, auditRepo);
const recService = new ApplicationRecommendationService(logRepo, userRepo);

// Helper error wrapper for async express handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// 2. Authentication Router
// ==========================================

apiRouter.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, country } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing registration details.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
  }

  try {
    const user = await authService.register(email, password, firstName, lastName, country);
    return res.status(201).json({
      message: 'User registered successfully.',
      user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role }
    });
  } catch (err: any) {
    if (err.message === 'User with this email already exists.') {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}));

apiRouter.post('/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const ip = req.ip;
  const ua = req.headers['user-agent'];
  
  try {
    const { user, tokens } = await authService.login(email, password, ip, ua);
    return res.status(200).json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, country: user.country },
      tokens
    });
  } catch (err: any) {
    if (err.message === 'Invalid email or password.') {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}));

apiRouter.post('/auth/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }
  const tokens = await authService.refresh(refreshToken);
  return res.status(200).json(tokens);
}));

apiRouter.post('/auth/logout', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  await authService.logout(userId);
  return res.status(200).json({ message: 'Logged out successfully.' });
}));

apiRouter.get('/auth/me', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await userRepo.findById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.status(200).json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    country: user.country
  });
}));

// ==========================================
// 3. Carbon Logging Router
// ==========================================

apiRouter.post('/carbon/log', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { category, subCategory, value } = req.body;

  if (!category || !subCategory || value === undefined) {
    return res.status(400).json({ error: 'Missing details: category, subCategory, and value are required.' });
  }

  const numericValue = parseFloat(value);
  if (isNaN(numericValue) || numericValue < 0) {
    return res.status(400).json({ error: 'Value must be a positive number.' });
  }

  const log = await carbonService.logEmissions(userId, category as CarbonCategory, subCategory, numericValue);
  
  await auditRepo.create({
    userId,
    action: 'CARBON_LOGGED',
    details: JSON.stringify({ category, subCategory, value, co2EquivalentKg: log.co2EquivalentKg })
  });

  return res.status(201).json(log);
}));

apiRouter.get('/carbon/logs', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const logs = await carbonService.getUserLogs(userId);
  return res.status(200).json(logs);
}));

apiRouter.delete('/carbon/logs/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const logId = req.params.id;
  await carbonService.deleteLog(userId, logId);
  
  await auditRepo.create({
    userId,
    action: 'CARBON_LOG_DELETED',
    details: JSON.stringify({ logId })
  });

  return res.status(200).json({ message: 'Carbon log deleted successfully.' });
}));

// ==========================================
// 4. Analytics & AI Insight Router
// ==========================================

apiRouter.get('/analytics/dashboard', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const analytics = await analyticsService.getDashboardAnalytics(userId);
  return res.status(200).json(analytics);
}));

apiRouter.get('/recommendations', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const recommendations = await recService.getRecommendations(userId);
  return res.status(200).json(recommendations);
}));

// ==========================================
// 5. Goals Router
// ==========================================

apiRouter.post('/goals', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { title, category, targetCo2Kg, startDate, endDate } = req.body;

  if (!title || !category || !targetCo2Kg || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing parameters for goal creation.' });
  }

  const goal = await goalService.createGoal(
    userId,
    title,
    category,
    parseFloat(targetCo2Kg),
    new Date(startDate),
    new Date(endDate)
  );
  return res.status(201).json(goal);
}));

apiRouter.get('/goals', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const goals = await goalService.listUserGoals(userId);
  return res.status(200).json(goals);
}));

apiRouter.patch('/goals/:id/status', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const goalId = req.params.id;
  const { status } = req.body;

  if (!['ACTIVE', 'COMPLETED', 'FAILED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  const goal = await goalService.updateGoalStatus(userId, goalId, status);
  return res.status(200).json(goal);
}));

// ==========================================
// 6. Challenge Router
// ==========================================

apiRouter.get('/challenges', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const challenges = await challengeService.listChallenges();
  return res.status(200).json(challenges);
}));

apiRouter.post('/challenges/join', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { challengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'Challenge ID is required.' });

  const join = await challengeService.joinChallenge(userId, challengeId);
  return res.status(201).json(join);
}));

apiRouter.post('/challenges/complete', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { challengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'Challenge ID is required.' });

  const complete = await challengeService.completeChallenge(userId, challengeId);
  return res.status(200).json(complete);
}));

apiRouter.get('/challenges/user', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const list = await challengeService.getUserChallenges(userId);
  return res.status(200).json(list);
}));

// ==========================================
// 7. Notifications & Content
// ==========================================

apiRouter.get('/notifications', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const list = await notificationRepo.findByUser(userId);
  return res.status(200).json(list);
}));

apiRouter.patch('/notifications/:id/read', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notificationId = req.params.id;
  const updated = await notificationRepo.markAsRead(notificationId);
  return res.status(200).json(updated);
}));

apiRouter.get('/content', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const list = await contentRepo.listAll();
  return res.status(200).json(list);
}));

// ==========================================
// 8. Admin Console Router
// ==========================================

apiRouter.get('/admin/users', authMiddleware, roleGuard(['ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const users = await userRepo.listAll();
  return res.status(200).json(users);
}));

apiRouter.get('/admin/emission-factors', authMiddleware, roleGuard(['ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const factors = await factorRepo.listAll();
  return res.status(200).json(factors);
}));

apiRouter.patch('/admin/emission-factors/:subCategory', authMiddleware, roleGuard(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subCategory = req.params.subCategory;
  const { factor, unit, source } = req.body;

  if (factor === undefined || !unit || !source) {
    return res.status(400).json({ error: 'Missing parameter fields: factor, unit, source.' });
  }

  const updated = await factorRepo.update(subCategory, parseFloat(factor), unit, source);

  await auditRepo.create({
    userId: req.user!.userId,
    action: 'EMISSION_FACTOR_CHANGE',
    details: JSON.stringify({ subCategory, factor, unit, source })
  });

  return res.status(200).json(updated);
}));

apiRouter.get('/admin/audit-logs', authMiddleware, roleGuard(['ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const logs = await auditRepo.listAll();
  return res.status(200).json(logs);
}));
