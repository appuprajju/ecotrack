import { CarbonDomainService, UserStats } from '../src/domain/carbon';
import { CarbonIntelligenceEngine } from '../src/infrastructure/ai-engine';
import { CarbonLog, Goal } from '@prisma/client';

describe('Carbon Footprint Calculation Suite', () => {
  test('should accurately calculate CO2 equivalent values', () => {
    // 10 km * 0.18 kg CO2/km
    const result = CarbonDomainService.calculateCO2(10, 0.18);
    expect(result).toBe(1.8);

    // 250 kWh * 0.45 kg CO2/kWh
    const energy = CarbonDomainService.calculateCO2(250, 0.45);
    expect(energy).toBe(112.5);
  });

  test('should throw error for negative values or factors', () => {
    expect(() => CarbonDomainService.calculateCO2(-5, 0.18)).toThrow();
    expect(() => CarbonDomainService.calculateCO2(10, -0.2)).toThrow();
  });
});

describe('Sustainability Scoring Suite', () => {
  test('should evaluate score based on carbon profiles', () => {
    const stats: UserStats = {
      userId: 'test_user_1',
      totalEmissionsKg: 150, // 5kg/day average over 30 days
      emissionsByCategory: {
        transportation: 50,
        energy: 60,
        food: 20,
        waste: 15,
        water: 5
      },
      goalCompletionRate: 0.8, // 80% completion rate (80% of 25 = 20 pts)
      activeChallengeCount: 2, // 2 active (2 * 5 = 10 pts)
      recyclingRate: 0.7, // 70% (70% of 10 = 7 pts)
      hasRenewableEnergy: true // true (10 pts)
    };

    const score = CarbonDomainService.computeSustainabilityScore(stats, 30);
    // Emissions daily average = 5kg/day. Baseline is 12.
    // emissionsRatio = 1 - 5 / 24 = 0.79. Score = 0.79 * 40 = ~31.6 pts
    // Total estimated points: 31.6 (emissions) + 10 (renewable) + 7 (recycling) + 20 (goals) + 10 (challenges) = ~78.6 pts
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should identify carbon outliers correctly', () => {
    const categories = {
      transportation: 250,
      energy: 80,
      food: 120,
      waste: 10,
      water: 5
    };
    
    const outlier = CarbonDomainService.identifyCarbonOutliers(categories);
    expect(outlier.primaryDriver).toBe('transportation');
    expect(outlier.recommendationTheme).toContain('public transport');
  });
});

describe('Carbon Intelligence AI Heuristics Suite', () => {
  test('should project carbon trends linearly with small datasets', () => {
    const mockLogs: CarbonLog[] = [
      { id: '1', userId: 'u1', category: 'energy', subCategory: 'electricity', value: 10, unit: 'kWh', co2EquivalentKg: 4.5, loggedAt: new Date(), createdAt: new Date() },
      { id: '2', userId: 'u1', category: 'energy', subCategory: 'electricity', value: 12, unit: 'kWh', co2EquivalentKg: 5.4, loggedAt: new Date(), createdAt: new Date() }
    ];

    const forecast = CarbonIntelligenceEngine.forecastEmissions(mockLogs);
    expect(forecast.projection30DaysKg).toBeCloseTo(148.5, 1); // average = 4.95, * 30 = 148.5
    expect(forecast.projection365DaysKg).toBeCloseTo(1806.75, 1);
  });

  test('should predict goal success probability', () => {
    const mockGoal: Goal = {
      id: 'g1',
      userId: 'u1',
      title: 'Reduce transportation carbon',
      category: 'transportation',
      targetCo2Kg: 100.0,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'ACTIVE',
      createdAt: new Date()
    };

    // Log emissions: 40kg total for first half of the duration
    // Elapsed ratio = 0.5. Projected emissions at end = 40 / 0.5 = 80kg.
    // Projected emissions (80kg) < Target (100kg), probability should be >50% (0.5)
    const mockLogs: CarbonLog[] = [
      { id: 'l1', userId: 'u1', category: 'transportation', subCategory: 'car', value: 100, unit: 'km', co2EquivalentKg: 18.0, loggedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), createdAt: new Date() },
      { id: 'l2', userId: 'u1', category: 'transportation', subCategory: 'car', value: 122.2, unit: 'km', co2EquivalentKg: 22.0, loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdAt: new Date() }
    ];

    const prediction = CarbonIntelligenceEngine.predictGoalSuccess(mockGoal, mockLogs);
    expect(prediction.projectedEndEmissionsKg).toBe(80.0);
    expect(prediction.successProbability).toBeGreaterThan(0.5);
  });

  test('should generate and sort recommendations based on priority categories', () => {
    const categories = {
      transportation: 10,
      energy: 150, // Energy is primary driver
      food: 30,
      waste: 5,
      water: 2
    };

    const recommendations = CarbonIntelligenceEngine.generatePersonalizedRecommendations(categories, false);
    // Highest priority category is 'energy', so recommendations with category 'energy' should rank first
    expect(recommendations[0].category).toBe('energy');
  });
});
