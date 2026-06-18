export type CarbonCategory = 'transportation' | 'energy' | 'food' | 'waste' | 'water';

export interface CarbonLogInput {
  userId: string;
  category: CarbonCategory;
  subCategory: string;
  value: number;
  unit: string;
  loggedAt?: Date;
}

export interface UserStats {
  userId: string;
  totalEmissionsKg: number;
  emissionsByCategory: Record<CarbonCategory, number>;
  goalCompletionRate: number; // 0 to 1
  activeChallengeCount: number;
  recyclingRate: number; // 0 to 1
  hasRenewableEnergy: boolean;
}

export class CarbonDomainService {
  /**
   * Calculates carbon footprint in kg CO2 equivalent based on standard conversion factors.
   */
  public static calculateCO2(value: number, factor: number): number {
    if (value < 0 || factor < 0) {
      throw new Error('Quantity and emission factor must be non-negative.');
    }
    return parseFloat((value * factor).toFixed(4));
  }

  /**
   * Computes a dynamic sustainability score between 0 and 100.
   * Based on:
   * - Daily average emissions relative to a baseline (e.g. 10 kg CO2 / day is average, lower is better)
   * - Recycling behavior
   * - Renewable energy adoption
   * - Goal success rate
   * - Active challenges
   */
  public static computeSustainabilityScore(stats: UserStats, daysTracked: number = 30): number {
    const baselineDailyKg = 12.0; // Standard average target baseline per person
    const dailyAverage = stats.totalEmissionsKg / Math.max(1, daysTracked);
    
    // 1. Emissions Score (up to 40 points)
    // If daily average is 0, they get 40. If it meets or exceeds baseline, it approaches 0.
    const emissionsRatio = Math.max(0, 1 - dailyAverage / (baselineDailyKg * 2));
    const emissionsScore = emissionsRatio * 40;

    // 2. Renewable Energy & Recycling Boosts (up to 20 points)
    const renewableScore = stats.hasRenewableEnergy ? 10 : 0;
    const recyclingScore = stats.recyclingRate * 10;
    const ecoPracticeScore = renewableScore + recyclingScore;

    // 3. Goal Completion Track Record (up to 25 points)
    const goalsScore = stats.goalCompletionRate * 25;

    // 4. Challenges Participation (up to 15 points)
    const challengesScore = Math.min(15, stats.activeChallengeCount * 5);

    const totalScore = emissionsScore + ecoPracticeScore + goalsScore + challengesScore;
    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  /**
   * Classify user behavior profiles based on emission breakdown.
   */
  public static identifyCarbonOutliers(categoryEmissions: Record<CarbonCategory, number>): {
    primaryDriver: CarbonCategory;
    recommendationTheme: string;
  } {
    let maxCategory: CarbonCategory = 'transportation';
    let maxVal = 0;

    for (const [cat, val] of Object.entries(categoryEmissions)) {
      if (val > maxVal) {
        maxVal = val;
        maxCategory = cat as CarbonCategory;
      }
    }

    let theme = 'general';
    switch (maxCategory) {
      case 'transportation':
        theme = 'Consider public transport, active commuting, and avoiding short flights.';
        break;
      case 'energy':
        theme = 'Focus on home isolation, unplugging standby devices, and transitioning to solar/renewables.';
        break;
      case 'food':
        theme = 'Integrate more vegan or vegetarian options, and reduce food waste.';
        break;
      case 'waste':
        theme = 'Audit plastic consumption, enhance compost recycling, and repair items.';
        break;
      case 'water':
        theme = 'Install low-flow faucets, harvest rainwater, and restrict shower times.';
        break;
    }

    return { primaryDriver: maxCategory, recommendationTheme: theme };
  }
}
