#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🗑️ Cleaning up database...');
    
    // Count existing documents
    const count = await prisma.document.count();
    console.log(`📋 Found ${count} documents in database`);
    
    if (count === 0) {
      console.log('✅ Database is already empty');
      return;
    }
    
    // Delete all documents
    const result = await prisma.document.deleteMany({});
    console.log(`🎉 Successfully deleted ${result.count} documents from database`);
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase();