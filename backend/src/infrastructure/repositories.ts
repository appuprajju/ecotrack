import { PrismaClient, User, RefreshToken, CarbonLog, EmissionFactor, Goal, Challenge, UserChallenge, LearningContent, Notification, AuditLog } from '@prisma/client';
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
} from '../application/ports';
import { CarbonLogInput } from '../domain/carbon';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string; country?: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async listAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

export class PrismaTokenRepository implements ITokenRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: { userId, token, expiresAt }
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  async revoke(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}

export class PrismaCarbonLogRepository implements ICarbonLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(log: CarbonLogInput & { co2EquivalentKg: number }): Promise<CarbonLog> {
    return this.prisma.carbonLog.create({
      data: {
        userId: log.userId,
        category: log.category,
        subCategory: log.subCategory,
        value: log.value,
        unit: log.unit,
        co2EquivalentKg: log.co2EquivalentKg,
        loggedAt: log.loggedAt || new Date()
      }
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.carbonLog.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findByUser(userId: string, options?: { startDate?: Date; endDate?: Date }): Promise<CarbonLog[]> {
    const where: any = { userId };
    if (options?.startDate || options?.endDate) {
      where.loggedAt = {};
      if (options.startDate) where.loggedAt.gte = options.startDate;
      if (options.endDate) where.loggedAt.lte = options.endDate;
    }
    return this.prisma.carbonLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' }
    });
  }

  async findById(id: string): Promise<CarbonLog | null> {
    return this.prisma.carbonLog.findUnique({ where: { id } });
  }
}

export class PrismaEmissionFactorRepository implements IEmissionFactorRepository {
  constructor(private prisma: PrismaClient) {}

  async findBySubCategory(subCategory: string): Promise<EmissionFactor | null> {
    return this.prisma.emissionFactor.findUnique({ where: { subCategory } });
  }

  async listAll(): Promise<EmissionFactor[]> {
    return this.prisma.emissionFactor.findMany({ orderBy: { category: 'asc' } });
  }

  async update(subCategory: string, factor: number, unit: string, source: string): Promise<EmissionFactor> {
    return this.prisma.emissionFactor.update({
      where: { subCategory },
      data: { factor, unit, source }
    });
  }
}

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: { userId: string; title: string; category: string; targetCo2Kg: number; startDate: Date; endDate: Date }): Promise<Goal> {
    return this.prisma.goal.create({ data });
  }

  async findById(id: string): Promise<Goal | null> {
    return this.prisma.goal.findUnique({ where: { id } });
  }

  async findByUser(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { endDate: 'asc' }
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'COMPLETED' | 'FAILED'): Promise<Goal> {
    return this.prisma.goal.update({
      where: { id },
      data: { status }
    });
  }
}

export class PrismaChallengeRepository implements IChallengeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: { title: string; description: string; category: string; co2SavingsEstKg: number; points: number; startDate: Date; endDate: Date }): Promise<Challenge> {
    return this.prisma.challenge.create({ data });
  }

  async listAll(): Promise<Challenge[]> {
    return this.prisma.challenge.findMany({ orderBy: { startDate: 'asc' } });
  }

  async findById(id: string): Promise<Challenge | null> {
    return this.prisma.challenge.findUnique({ where: { id } });
  }

  async joinChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    return this.prisma.userChallenge.create({
      data: { userId, challengeId, status: 'JOINED' }
    });
  }

  async completeChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    return this.prisma.userChallenge.update({
      where: {
        userId_challengeId: { userId, challengeId }
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  }

  async getUserChallenges(userId: string): Promise<(UserChallenge & { challenge: Challenge })[]> {
    return this.prisma.userChallenge.findMany({
      where: { userId },
      include: { challenge: true }
    });
  }
}

export class PrismaLearningContentRepository implements ILearningContentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: { title: string; contentType: string; content: string; category: string }): Promise<LearningContent> {
    return this.prisma.learningContent.create({ data });
  }

  async listAll(): Promise<LearningContent[]> {
    return this.prisma.learningContent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByCategory(category: string): Promise<LearningContent[]> {
    return this.prisma.learningContent.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.learningContent.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, title: string, message: string, type: string): Promise<Notification> {
    return this.prisma.notification.create({
      data: { userId, title, message, type }
    });
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true }
    });
  }
}

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: { userId?: string; action: string; ipAddress?: string; userAgent?: string; details?: string }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        details: data.details || null
      }
    });
  }

  async listAll(options?: { limit?: number; offset?: number }): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: { user: true }
    });
  }
}
