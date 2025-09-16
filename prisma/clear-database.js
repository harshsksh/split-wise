const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Delete all data in the correct order to respect foreign key constraints
    console.log('📝 Deleting settlements...');
    await prisma.settlement.deleteMany();
    
    console.log('💰 Deleting expense splits...');
    await prisma.expenseSplit.deleteMany();
    
    console.log('💸 Deleting expenses...');
    await prisma.expense.deleteMany();
    
    console.log('👥 Deleting group members...');
    await prisma.groupMember.deleteMany();
    
    console.log('👤 Deleting friends...');
    await prisma.friend.deleteMany();
    
    console.log('🏠 Deleting groups...');
    await prisma.group.deleteMany();
    
    console.log('👤 Deleting users...');
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleared successfully!');
    console.log('📊 All collections have been emptied.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase();

