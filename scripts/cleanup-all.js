#!/usr/bin/env node
const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

async function cleanupAll() {
  try {
    console.log('🧹 Starting complete cleanup...');
    
    // 1. Clean up database
    console.log('\n📊 Step 1: Cleaning up database...');
    const dbCount = await prisma.document.count();
    console.log(`📋 Found ${dbCount} documents in database`);
    
    if (dbCount > 0) {
      const dbResult = await prisma.document.deleteMany({});
      console.log(`✅ Deleted ${dbResult.count} documents from database`);
    } else {
      console.log('✅ Database already empty');
    }
    
    // 2. Clean up vector store
    console.log('\n🗂️ Step 2: Cleaning up vector store...');
    const vectorStoreId = process.env.DEFAULT_VECTOR_STORE_ID;
    
    if (!vectorStoreId) {
      console.log('❌ No DEFAULT_VECTOR_STORE_ID found in .env.local');
      return;
    }
    
    const files = await openai.vectorStores.files.list(vectorStoreId);
    console.log(`📋 Found ${files.data.length} files in vector store`);
    
    if (files.data.length > 0) {
      console.log(`🗑️ Deleting vector store: ${vectorStoreId}`);
      await openai.vectorStores.delete(vectorStoreId);
      console.log(`✅ Deleted vector store: ${vectorStoreId}`);
      
      // Create new vector store
      console.log('🆕 Creating new vector store...');
      const newVectorStore = await openai.vectorStores.create({
        name: 'document-store',
        expires_after: {
          anchor: "last_active_at",
          days: 30
        }
      });
      
      console.log(`✅ Created new vector store: ${newVectorStore.id}`);
      console.log(`💡 Update your .env.local: DEFAULT_VECTOR_STORE_ID=${newVectorStore.id}`);
    } else {
      console.log('✅ Vector store already empty');
    }
    
    console.log('\n🎉 Complete cleanup finished!');
    console.log('📝 Both database and vector store are now clean');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAll();