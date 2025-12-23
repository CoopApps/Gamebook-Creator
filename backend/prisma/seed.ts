import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@gamebook.dev' },
    update: {},
    create: {
      email: 'demo@gamebook.dev',
      username: 'demo_user',
      passwordHash,
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create sample project
  const sampleProject = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      userId: demoUser.id,
      title: 'The Mysterious Mansion',
      description: 'A classic mystery adventure in a spooky mansion',
      isPublic: true,
    },
  });

  console.log('✅ Created sample project:', sampleProject.title);

  // Create sample nodes
  const startNode = await prisma.node.create({
    data: {
      projectId: sampleProject.id,
      nodeNumber: 1,
      nodeType: 'start',
      title: 'The Beginning',
      content: 'You stand before the towering gates of Blackwood Mansion. A mysterious letter brought you here, promising answers to questions you never knew you had.',
      positionX: 100,
      positionY: 100,
      properties: {
        initialStats: {
          strength: 10,
          intelligence: 10,
          luck: 10,
        },
      },
    },
  });

  const choiceNode = await prisma.node.create({
    data: {
      projectId: sampleProject.id,
      nodeNumber: 2,
      nodeType: 'choice',
      title: 'The Entrance',
      content: 'The front door creaks open. You can hear strange sounds coming from upstairs, but the kitchen door to your left is also ajar.',
      positionX: 400,
      positionY: 100,
      properties: {
        timeLimit: null,
        canGoBack: false,
      },
    },
  });

  const upstairsNode = await prisma.node.create({
    data: {
      projectId: sampleProject.id,
      nodeNumber: 3,
      nodeType: 'story',
      title: 'Upstairs',
      content: 'You climb the creaking stairs. At the top, you find a long hallway with portraits that seem to watch your every move.',
      positionX: 300,
      positionY: 300,
      properties: {},
    },
  });

  const kitchenNode = await prisma.node.create({
    data: {
      projectId: sampleProject.id,
      nodeNumber: 4,
      nodeType: 'inventory',
      title: 'The Kitchen',
      content: 'The kitchen is dusty but well-preserved. On the counter, you find an old rusty key.',
      positionX: 500,
      positionY: 300,
      properties: {
        action: 'add',
        items: ['rusty-key'],
      },
    },
  });

  console.log('✅ Created sample nodes');

  // Create connections
  await prisma.connection.createMany({
    data: [
      {
        projectId: sampleProject.id,
        fromNodeId: startNode.id,
        toNodeId: choiceNode.id,
        connectionType: 'normal',
        choiceText: 'Enter the mansion',
      },
      {
        projectId: sampleProject.id,
        fromNodeId: choiceNode.id,
        toNodeId: upstairsNode.id,
        connectionType: 'normal',
        choiceText: 'Investigate upstairs',
      },
      {
        projectId: sampleProject.id,
        fromNodeId: choiceNode.id,
        toNodeId: kitchenNode.id,
        connectionType: 'normal',
        choiceText: 'Check the kitchen',
      },
    ],
  });

  console.log('✅ Created sample connections');

  // Create progress system
  await prisma.progressSystem.create({
    data: {
      projectId: sampleProject.id,
      systemType: 'inventory',
      systemName: 'Item Management',
      configuration: {
        maxItems: 10,
        maxWeight: 50,
        allowDuplicates: false,
        startingItems: [],
      },
    },
  });

  console.log('✅ Created progress system');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: demo@gamebook.dev');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
