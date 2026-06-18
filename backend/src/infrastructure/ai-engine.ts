import { CarbonLog, Goal } from '@prisma/client';
import { CarbonCategory, CarbonDomainService, UserStats } from '../domain/carbon';

export interface ForecastResult {
  projection30DaysKg: number;
  projection90DaysKg: number;
  projection365DaysKg: number;
  confidenceInterval: { min: number; max: number };
  trendSlope: number; // kg per day change
}

export interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  category: CarbonCategory;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCo2ReductionKg: number;
  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  costSavingsEst: number; // in USD or relative credits
}

export interface GoalSuccessPrediction {
  goalId: string;
  projectedEndEmissionsKg: number;
  successProbability: number; // 0 to 1
  recommendation: string;
}

export class CarbonIntelligenceEngine {
  /**
   * Predicts future emissions based on historical logs using simple linear regression.
   */
  public static forecastEmissions(logs: CarbonLog[]): ForecastResult {
    if (logs.length < 3) {
      // Fallback: If minimal data exists, compute daily average and project linearly
      const total = logs.reduce((acc, log) => acc + log.co2EquivalentKg, 0);
      const days = logs.length || 1;
      const dailyAverage = total / days;

      return {
        projection30DaysKg: parseFloat((dailyAverage * 30).toFixed(2)),
        projection90DaysKg: parseFloat((dailyAverage * 90).toFixed(2)),
        projection365DaysKg: parseFloat((dailyAverage * 365).toFixed(2)),
        confidenceInterval: { min: dailyAverage * 0.8 * 30, max: dailyAverage * 1.2 * 30 },
        trendSlope: 0
      };
    }

    // Sort logs chronologically
    const sorted = [...logs].sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());
    const firstTime = sorted[0].loggedAt.getTime();
    
    // Group logs by day to reduce noise
    const dailyMap = new Map<string, number>();
    sorted.forEach(log => {
      const dateStr = log.loggedAt.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + log.co2EquivalentKg);
    });

    const dailyData: { x: number; y: number }[] = [];
    let dayIndex = 0;
    const sortedDates = Array.from(dailyMap.keys()).sort();
    
    sortedDates.forEach(dateStr => {
      dailyData.push({
        x: dayIndex++,
        y: dailyMap.get(dateStr) || 0
      });
    });

    // Run Linear Regression: y = m*x + c
    const n = dailyData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    dailyData.forEach(d => {
      sumX += d.x;
      sumY += d.y;
      sumXY += d.x * d.y;
      sumXX += d.x * d.x;
    });

    const denominator = n * sumXX - sumX * sumX;
    let slope = 0;
    let intercept = sumY / n;

    if (denominator !== 0) {
      slope = (n * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / n;
    }

    // daily projection: y_hat = slope * day + intercept
    const projectTimePeriod = (days: number): number => {
      let projectedSum = 0;
      const currentDay = n;
      for (let i = 0; i < days; i++) {
        const value = slope * (currentDay + i) + intercept;
        projectedSum += Math.max(0.1, value); // Emissions cannot be negative
      }
      return parseFloat(projectedSum.toFixed(2));
    };

    const p30 = projectTimePeriod(30);
    const p90 = projectTimePeriod(90);
    const p365 = projectTimePeriod(365);

    // Dynamic error margins based on variance
    const mean = sumY / n;
    const variance = dailyData.reduce((acc, d) => acc + Math.pow(d.y - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const margin = stdDev * 1.96 * Math.sqrt(30); // 95% confidence bounds

    return {
      projection30DaysKg: p30,
      projection90DaysKg: p90,
      projection365DaysKg: p365,
      confidenceInterval: {
        min: parseFloat(Math.max(1, p30 - margin).toFixed(2)),
        max: parseFloat((p30 + margin).toFixed(2))
      },
      trendSlope: parseFloat(slope.toFixed(4))
    };
  }

  /**
   * Predicts goal success probability using a logistic curve.
   */
  public static predictGoalSuccess(goal: Goal, logs: CarbonLog[]): GoalSuccessPrediction {
    const now = new Date();
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    // Filter logs that fall within the goal period
    const goalLogs = logs.filter(log => log.loggedAt >= start && log.loggedAt <= now);
    const currentTotalCo2 = goalLogs.reduce((acc, log) => acc + log.co2EquivalentKg, 0);

    if (elapsed <= 0) {
      return {
        goalId: goal.id,
        projectedEndEmissionsKg: 0,
        successProbability: 0.5, // 50% neutral starting point
        recommendation: 'Goal has not started yet. Log carbon emissions regularly to get predictions.'
      };
    }

    // Projection calculation: target emissions vs actual linear rate
    const elapsedRatio = elapsed / totalDuration;
    const projectedEndEmissions = elapsedRatio >= 1 
      ? currentTotalCo2 
      : currentTotalCo2 / elapsedRatio;

    // Use logistic activation: P(Success) = 1 / (1 + e^(-k * x))
    // Let x = target - projected. If target > projected, success is likely (>0.5)
    const margin = goal.targetCo2Kg - projectedEndEmissions;
    
    // Normalize margin against target size
    const normalizedMargin = margin / Math.max(1, goal.targetCo2Kg);
    
    // k = 5 represents a steepness factor where 10% under-target gives ~62% success prob, 30% gives ~81%
    const k = 5;
    const successProbability = 1 / (1 + Math.exp(-k * normalizedMargin));

    let recommendation = 'You are on track to meet your sustainability target! Keep up the good work.';
    if (successProbability < 0.4) {
      recommendation = 'Alert: You are currently projected to exceed your emission limit. Try reducing energy use or switching to active transit.';
    } else if (successProbability < 0.7) {
      recommendation = 'You are very close to your limit. Small adjustments in your diet (like vegetarian meals) can secure success.';
    }

    return {
      goalId: goal.id,
      projectedEndEmissionsKg: parseFloat(projectedEndEmissions.toFixed(2)),
      successProbability: parseFloat(successProbability.toFixed(3)),
      recommendation
    };
  }

  /**
   * Returns tailored recommendation recommendations from a hardcoded base.
   * Matches recommendations based on the user's highest emitting categories.
   */
  public static generatePersonalizedRecommendations(
    categoryEmissions: Record<CarbonCategory, number>,
    userHasRenewables: boolean
  ): RecommendationAction[] {
    const actions: RecommendationAction[] = [
      {
        id: 'rec_1',
        title: 'Adopt Public Transit Commuting',
        description: 'Swap 3 drives a week for train or bus commuting to cut transportation footprint.',
        category: 'transportation',
        impactLevel: 'HIGH',
        estimatedCo2ReductionKg: 45.5,
        difficulty: 'MODERATE',
        costSavingsEst: 15.0
      },
      {
        id: 'rec_2',
        title: 'Meatless Mondays',
        description: 'Ditch meat for vegetarian or vegan meals every Monday.',
        category: 'food',
        impactLevel: 'MEDIUM',
        estimatedCo2ReductionKg: 12.0,
        difficulty: 'EASY',
        costSavingsEst: 8.0
      },
      {
        id: 'rec_3',
        title: 'Transition to LED Bulbs',
        description: 'Replace remaining incandescent bulbs with energy-efficient LED equivalents.',
        category: 'energy',
        impactLevel: 'LOW',
        estimatedCo2ReductionKg: 5.0,
        difficulty: 'EASY',
        costSavingsEst: 4.0
      },
      {
        id: 'rec_4',
        title: 'E-Waste Recycling Audits',
        description: 'Send old cell phones, batteries, and laptops to dedicated certified recycling drop-offs.',
        category: 'waste',
        impactLevel: 'LOW',
        estimatedCo2ReductionKg: 3.5,
        difficulty: 'MODERATE',
        costSavingsEst: 0
      },
      {
        id: 'rec_5',
        title: 'Optimize Shower Time',
        description: 'Restrict daily showers to 5 minutes to save hot water heating emissions.',
        category: 'water',
        impactLevel: 'MEDIUM',
        estimatedCo2ReductionKg: 10.0,
        difficulty: 'EASY',
        costSavingsEst: 6.0
      },
      {
        id: 'rec_6',
        title: 'Install Residential Solar Panels',
        description: 'Acquire grid solar panel cells to transition home electricity to renewable resource.',
        category: 'energy',
        impactLevel: 'HIGH',
        estimatedCo2ReductionKg: 180.0,
        difficulty: 'HARD',
        costSavingsEst: 45.0
      },
      {
        id: 'rec_7',
        title: 'Compost Organic Scraps',
        description: 'Compost kitchen vegetables and garden waste to prevent landfill methane generation.',
        category: 'waste',
        impactLevel: 'MEDIUM',
        estimatedCo2ReductionKg: 8.0,
        difficulty: 'MODERATE',
        costSavingsEst: 0
      }
    ];

    // Identify primary emitting category
    const { primaryDriver } = CarbonDomainService.identifyCarbonOutliers(categoryEmissions);

    // Filter out recommendations the user has already implemented (e.g. if they have solar, don't recommend solar)
    let filtered = actions;
    if (userHasRenewables) {
      filtered = filtered.filter(a => a.id !== 'rec_6');
    }

    // Sort: recommendations targeting their primary driver first, then sorted by impact level (HIGH -> MEDIUM -> LOW)
    return filtered.sort((a, b) => {
      const aIsDriver = a.category === primaryDriver ? 1 : 0;
      const bIsDriver = b.category === primaryDriver ? 1 : 0;

      if (aIsDriver !== bIsDriver) {
        return bIsDriver - aIsDriver; // Driver categories first
      }

      const impactWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return impactWeight[b.impactLevel] - impactWeight[a.impactLevel];
    });
  }
}
