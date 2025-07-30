import { NextRequest, NextResponse } from 'next/server';
import { listVectorStoreFiles, addFileToVectorStore } from '@/lib/openai';
import { validateJson } from '@/lib/validation';
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

    const files = await listVectorStoreFiles(vectorStoreId);

    return NextResponse.json({
      success: true,
      files: files.data,
      count: files.data?.length || 0
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'GET', '/api/vector-stores/[id]/files');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vectorStoreId = validateDocumentId(params.id);
    const body = await validateJson(request);
    const { file_id } = body;
    
    if (!vectorStoreId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid vector store ID' 
        },
        { status: 400 }
      );
    }

    if (!file_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'file_id is required' 
        },
        { status: 400 }
      );
    }

    const result = await addFileToVectorStore(vectorStoreId, file_id);

    return NextResponse.json({
      success: true,
      message: 'File added to vector store successfully',
      result
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'POST', '/api/vector-stores/[id]/files');
  }
}