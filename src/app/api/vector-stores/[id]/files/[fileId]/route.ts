import { NextRequest, NextResponse } from 'next/server';
import { removeFileFromVectorStore } from '@/lib/openai';
import { createErrorResponse } from '@/lib/errors';
import { validateDocumentId } from '@/lib/validation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { id: vectorStoreIdRaw, fileId: fileIdRaw } = params;
    const vectorStoreId = validateDocumentId(vectorStoreIdRaw);
    const fileId = validateDocumentId(fileIdRaw);
    
    if (!vectorStoreId || !fileId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid vector store ID or file ID' 
        },
        { status: 400 }
      );
    }

    const result = await removeFileFromVectorStore(vectorStoreId, fileId);

    return NextResponse.json({
      success: true,
      message: 'File removed from vector store successfully',
      result
    });

  } catch (error) {
    return createErrorResponse(error as Error, 'DELETE', '/api/vector-stores/[id]/files/[fileId]');
  }
}