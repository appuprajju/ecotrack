import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database started...');

  // 1. Create default admin and a user
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const userPasswordHash = await bcrypt.hash('UserPassword123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecotrack.ai' },
    update: {},
    create: {
      email: 'admin@ecotrack.ai',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      firstName: 'EcoTrack',
      lastName: 'Administrator',
      country: 'Global'
    }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo.user@ecotrack.ai' },
    update: {},
    create: {
      email: 'demo.user@ecotrack.ai',
      passwordHash: userPasswordHash,
      role: 'USER',
      firstName: 'Jane',
      lastName: 'Doe',
      country: 'United States'
    }
  });

  console.log('Users seeded successfully');

  // 2. Emission Factors (Standard IPCC conversion values)
  const factors = [
    // Transportation (kg CO2 / km)
    { category: 'transportation', subCategory: 'car', factor: 0.18, unit: 'km', source: 'IPCC 2023 Guidelines' },
    { category: 'transportation', subCategory: 'bus', factor: 0.08, unit: 'km', source: 'IPCC 2023 Guidelines' },
    { category: 'transportation', subCategory: 'metro', factor: 0.03, unit: 'km', source: 'DEFRA 2023' },
    { category: 'transportation', subCategory: 'train', factor: 0.04, unit: 'km', source: 'DEFRA 2023' },
    { category: 'transportation', subCategory: 'flight', factor: 0.25, unit: 'km', source: 'IPCC 2023 Guidelines' },

    // Energy (kg CO2 / kWh)
    { category: 'energy', subCategory: 'electricity', factor: 0.45, unit: 'kWh', source: 'IEA Carbon Intensity 2022' },
    { category: 'energy', subCategory: 'lpg', factor: 1.51, unit: 'kg', source: 'US EPA Carbon Factors' },
    { category: 'energy', subCategory: 'renewable', factor: 0.02, unit: 'kWh', source: 'NREL LCA Standards' },

    // Food (kg CO2 / meal)
    { category: 'food', subCategory: 'vegan', factor: 1.5, unit: 'meal', source: 'Oxford University Food Study' },
    { category: 'food', subCategory: 'vegetarian', factor: 2.5, unit: 'meal', source: 'Oxford University Food Study' },
    { category: 'food', subCategory: 'non_vegetarian', factor: 7.2, unit: 'meal', source: 'Oxford University Food Study' },

    // Waste (kg CO2 / kg)
    { category: 'waste', subCategory: 'plastic', factor: 2.0, unit: 'kg', source: 'UNEP Plastic Report 2022' },
    { category: 'waste', subCategory: 'organic', factor: 0.5, unit: 'kg', source: 'EPA WARM Model' },
    { category: 'waste', subCategory: 'recyclable', factor: 0.1, unit: 'kg', source: 'EPA WARM Model' },

    // Water (kg CO2 / liter)
    { category: 'water', subCategory: 'tap_water', factor: 0.0003, unit: 'liter', source: 'EIA Municipal Water Standard' }
  ];

  for (const f of factors) {
    await prisma.emissionFactor.upsert({
      where: { subCategory: f.subCategory },
      update: { factor: f.factor, unit: f.unit, source: f.source },
      create: f
    });
  }

  console.log('Emission factors seeded successfully');

  // 3. Sustainability Challenges
  const challenges = [
    {
      title: '7-Day Car-Free Challenge',
      description: 'Ditch your personal car for 7 days. Use public transport, bicycle, or walk instead!',
      category: 'transportation',
      co2SavingsEstKg: 25.0,
      points: 150,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Go Vegan for 5 Days',
      description: 'Eat 100% plant-based meals for 5 consecutive days to dramatically cut food-related emissions.',
      category: 'food',
      co2SavingsEstKg: 18.5,
      points: 120,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Zero Single-Use Plastics',
      description: 'Avoid buying or using single-use plastics (bottles, bags, straws, cutlery) for 10 days.',
      category: 'waste',
      co2SavingsEstKg: 5.0,
      points: 80,
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Energy Vampire Hunt',
      description: 'Unplug all unused electrical appliances and keep lights off in vacant rooms for a week.',
      category: 'energy',
      co2SavingsEstKg: 12.0,
      points: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const c of challenges) {
    await prisma.challenge.create({
      data: c
    });
  }

  console.log('Eco-Challenges seeded successfully');

  // 4. Learning Content
  const learningMaterials = [
    {
      title: 'Understanding Carbon Offsets: A Beginner Guide',
      contentType: 'article',
      content: 'Carbon offsets are practical solutions where individuals or entities fund project models that reduce or capture greenhouse gas emissions. Examples include reforestation, wind farm installations, and methane capture. While offsets help, reducing personal consumption remains the primary defense.',
      category: 'general'
    },
    {
      title: 'How Diet Impacts Environmental Sustainability',
      contentType: 'article',
      content: 'Food production accounts for nearly 26% of global carbon emissions. Meat-rich diets have high footprints because cattle require large tracts of land and emit methane. Adapting to vegan meals even 2-3 times a week can cut your carbon food footprint by over 40%.',
      category: 'food'
    },
    {
      title: 'The Real Cost of Short Flights',
      contentType: 'article',
      content: 'Short-haul aviation produces high carbon intensity because takeoff and landing consume disproportionate energy. Taking a high-speed electric train instead of a flight reduces travel-related emissions by up to 90%. Always consider terrestrial transit for distances under 500km.',
      category: 'transportation'
    },
    {
      title: 'Guide to Home Energy Efficiency',
      contentType: 'guide',
      content: '1. Switch to LED lighting to reduce bulb consumption by 75%.\n2. Set your thermostat 1-2 degrees Celsius cooler in winter.\n3. Wash clothes in cold water to save water heating energy.\n4. Check insulation around doors and windows to minimize air leaks.',
      category: 'energy'
    }
  ];

  for (const item of learningMaterials) {
    await prisma.learningContent.create({
      data: item
    });
  }

  console.log('Learning content seeded successfully');
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
