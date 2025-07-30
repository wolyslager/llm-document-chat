import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore, deleteVectorStore } from '@/lib/openai';
import { apiLogger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errors';
import { validateDocumentId } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vectorStoreId = validateDocumentId(params.id);
    
    if (!vectorStoreId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid vector store ID' 
        },
        { status: 400 }
      );
    }

    const vectorStore = await getVectorStore(vectorStoreId);

    return NextResponse.json({
      success: true,
      vectorStore
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'GET', '/api/vector-stores/[id]');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vectorStoreId = validateDocumentId(params.id);
    
    if (!vectorStoreId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid vector store ID' 
        },
        { status: 400 }
      );
    }

    const result = await deleteVectorStore(vectorStoreId);

    return NextResponse.json({
      success: true,
      message: 'Vector store deleted successfully',
      result
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'DELETE', '/api/vector-stores/[id]');
  }
}