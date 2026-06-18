import { User, RefreshToken, CarbonLog, EmissionFactor, Goal, Challenge, UserChallenge, LearningContent, Notification, AuditLog } from '@prisma/client';
import { CarbonLogInput } from '../domain/carbon';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string; firstName: string; lastName: string; country?: string }): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>;
  delete(id: string): Promise<boolean>;
  listAll(): Promise<User[]>;
}

export interface ITokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revoke(tokenId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface ICarbonLogRepository {
  create(log: CarbonLogInput & { co2EquivalentKg: number }): Promise<CarbonLog>;
  delete(id: string): Promise<boolean>;
  findByUser(userId: string, options?: { startDate?: Date; endDate?: Date }): Promise<CarbonLog[]>;
  findById(id: string): Promise<CarbonLog | null>;
}

export interface IEmissionFactorRepository {
  findBySubCategory(subCategory: string): Promise<EmissionFactor | null>;
  listAll(): Promise<EmissionFactor[]>;
  update(subCategory: string, factor: number, unit: string, source: string): Promise<EmissionFactor>;
}

export interface IGoalRepository {
  create(data: { userId: string; title: string; category: string; targetCo2Kg: number; startDate: Date; endDate: Date }): Promise<Goal>;
  findById(id: string): Promise<Goal | null>;
  findByUser(userId: string): Promise<Goal[]>;
  updateStatus(id: string, status: 'ACTIVE' | 'COMPLETED' | 'FAILED'): Promise<Goal>;
}

export interface IChallengeRepository {
  create(data: { title: string; description: string; category: string; co2SavingsEstKg: number; points: number; startDate: Date; endDate: Date }): Promise<Challenge>;
  listAll(): Promise<Challenge[]>;
  findById(id: string): Promise<Challenge | null>;
  joinChallenge(userId: string, challengeId: string): Promise<UserChallenge>;
  completeChallenge(userId: string, challengeId: string): Promise<UserChallenge>;
  getUserChallenges(userId: string): Promise<(UserChallenge & { challenge: Challenge })[]>;
}

export interface ILearningContentRepository {
  create(data: { title: string; contentType: string; content: string; category: string }): Promise<LearningContent>;
  listAll(): Promise<LearningContent[]>;
  findByCategory(category: string): Promise<LearningContent[]>;
  delete(id: string): Promise<boolean>;
}

export interface INotificationRepository {
  create(userId: string, title: string, message: string, type: string): Promise<Notification>;
  findByUser(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification>;
}

export interface IAuditLogRepository {
  create(data: { userId?: string; action: string; ipAddress?: string; userAgent?: string; details?: string }): Promise<AuditLog>;
  listAll(options?: { limit?: number; offset?: number }): Promise<AuditLog[]>;
}
