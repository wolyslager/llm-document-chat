import { NextRequest, NextResponse } from 'next/server';
import { createVectorStore, listVectorStores } from '@/lib/openai';
import { createErrorResponse } from '@/lib/errors';
import { validateJson, validateVectorStoreCreate } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const vectorStores = await listVectorStores();

    return NextResponse.json({
      success: true,
      vectorStores: vectorStores.data,
      count: vectorStores.data?.length || 0
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'GET', '/api/vector-stores');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse & validate
    const body = await validateJson(request);
    const { name, expires_days, chunking_strategy, metadata } = validateVectorStoreCreate(body);

    const options: any = {};
    
    if (name) {
      options.name = name;
    }
    
    if (expires_days) {
      options.expires_after = {
        anchor: 'last_active_at' as const,
        days: expires_days
      };
    }
    
    if (chunking_strategy) {
      options.chunking_strategy = chunking_strategy;
    }
    
    if (metadata) {
      options.metadata = metadata;
    }

    const vectorStore = await createVectorStore(options);

    return NextResponse.json({
      success: true,
      vectorStore
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'POST', '/api/vector-stores');
  }
}