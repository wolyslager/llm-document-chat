#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function createDefaultVectorStore() {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.error('Please set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  try {
    console.log('Creating default vector store...');
    
    const response = await fetch('https://api.openai.com/v1/vector_stores', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: 'Document Processing Vector Store',
        chunking_strategy: { 
          type: 'static',
          static: {
            max_chunk_size_tokens: 800,
            chunk_overlap_tokens: 400
          }
        },
        metadata: { purpose: 'default-document-storage' }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create vector store: ${response.statusText}`);
    }

    const vectorStore = await response.json();
    console.log('Vector store created successfully:');
    console.log(`ID: ${vectorStore.id}`);
    console.log(`Name: ${vectorStore.name}`);
    
    // Save the vector store ID to .env.local
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add or update the DEFAULT_VECTOR_STORE_ID
    if (envContent.includes('DEFAULT_VECTOR_STORE_ID=')) {
      envContent = envContent.replace(/DEFAULT_VECTOR_STORE_ID=.*/, `DEFAULT_VECTOR_STORE_ID=${vectorStore.id}`);
    } else {
      envContent += `\nDEFAULT_VECTOR_STORE_ID=${vectorStore.id}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Vector store ID saved to .env.local: ${vectorStore.id}`);
    
  } catch (error) {
    console.error('Error creating vector store:', error);
    process.exit(1);
  }
}

createDefaultVectorStore();