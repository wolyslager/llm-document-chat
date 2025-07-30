import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { apiLogger } from '@/lib/logger';
import { createErrorResponse, NotFoundError, DatabaseError } from '@/lib/errors';
import { validateDocumentId } from '@/lib/validation';
import { handleCors, withCors } from '@/lib/cors';
import OpenAI from 'openai';

// Create an OpenAI SDK instance (we don't have access to the shared one here)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  try {
    const { id } = await params;
    
    // Validate document ID
    validateDocumentId(id);
    
    apiLogger.apiRequest('GET', `/api/documents/${id}`, { documentId: id });
    
    let document;
    try {
      document = await prisma.document.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('fetch document', error as Error);
    }
    
    if (!document) {
      throw new NotFoundError('Document', id);
    }
    
    apiLogger.apiResponse('GET', `/api/documents/${id}`, 200, { 
      documentId: id,
      originalName: document.originalName
    });
    
    return withCors(NextResponse.json({
      success: true,
      document
    }), request);
    
  } catch (error) {
    const { id } = await params;
    return createErrorResponse(error as Error, 'GET', `/api/documents/${id}`, request);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  try {
    const { id } = params;
    
    // Validate document ID
    validateDocumentId(id);
    
    apiLogger.apiRequest('DELETE', `/api/documents/${id}`, { documentId: id });

    let doc;
    try {
      // Get document details first
      doc = await prisma.document.findUnique({ where: { id } });
    } catch (error) {
      throw new DatabaseError('fetch document for deletion', error as Error);
    }
    
    if (!doc) {
      throw new NotFoundError('Document', id);
    }

    // Attempt to delete associated vector store file, if any
    if (doc.vectorStoreId && doc.vectorStoreFileId) {
      try {
        // @ts-ignore – the type may differ slightly but this is the correct REST call
        await openai.vectorStores.files.del(doc.vectorStoreId, doc.vectorStoreFileId);
      } catch (error) {
        // Log but don't fail - this is a cleanup operation
        apiLogger.warn('Failed to remove vector store file', { 
          vectorStoreId: doc.vectorStoreId,
          vectorStoreFileId: doc.vectorStoreFileId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Optionally remove the extracted content file from OpenAI Files API (optional)
    if (doc.extractedFileId) {
      try {
        // @ts-ignore – SDK typing may not have del yet
        await openai.files.del(doc.extractedFileId);
      } catch (error) {
        // Log but don't fail - this is a cleanup operation
        apiLogger.warn('Failed to delete extracted file', { 
          extractedFileId: doc.extractedFileId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    try {
      // Finally delete DB record
      await prisma.document.delete({ where: { id } });
    } catch (error) {
      throw new DatabaseError('delete document', error as Error);
    }

    apiLogger.info('Document deleted successfully', {
      documentId: id,
      originalName: doc.originalName,
      hadVectorStoreFile: !!(doc.vectorStoreId && doc.vectorStoreFileId),
      hadExtractedFile: !!doc.extractedFileId
    });

    return withCors(NextResponse.json({ success: true }), request);
  } catch (error) {
    const { id } = params;
    return createErrorResponse(error as Error, 'DELETE', `/api/documents/${id}`, request);
  }
}