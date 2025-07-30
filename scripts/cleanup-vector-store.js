#!/usr/bin/env node
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function cleanupVectorStore() {
  const vectorStoreId = process.env.DEFAULT_VECTOR_STORE_ID;
  
  if (!vectorStoreId) {
    console.log('❌ No DEFAULT_VECTOR_STORE_ID found in .env.local');
    return;
  }
  
  try {
    console.log(`🗂️ Cleaning up vector store: ${vectorStoreId}`);
    
    // List all files in the vector store
    const files = await openai.vectorStores.files.list(vectorStoreId);
    console.log(`📋 Found ${files.data.length} files in vector store`);
    
    if (files.data.length === 0) {
      console.log('✅ Vector store is already empty');
      return;
    }
    
    // Delete the entire vector store and create a new one
    console.log(`🗑️ Deleting entire vector store: ${vectorStoreId}`);
    await openai.vectorStores.delete(vectorStoreId);
    console.log(`✅ Deleted vector store: ${vectorStoreId}`);
    
    // Create a new vector store
    console.log('🆕 Creating new vector store...');
    const newVectorStore = await openai.vectorStores.create({
      name: 'document-store',
      expires_after: {
        anchor: "last_active_at",
        days: 30
      }
    });
    
    console.log(`🎉 Created new vector store: ${newVectorStore.id}`);
    console.log(`💡 Update your .env.local: DEFAULT_VECTOR_STORE_ID=${newVectorStore.id}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanupVectorStore();