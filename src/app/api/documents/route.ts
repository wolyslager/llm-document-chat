import { NextResponse } from 'next/server';
import { getAllDocuments } from '@/lib/database';
import { apiLogger } from '@/lib/logger';
import { createErrorResponse, DatabaseError } from '@/lib/errors';

export async function GET() {
  try {
    apiLogger.apiRequest('GET', '/api/documents');
    
    let documents;
    try {
      documents = await getAllDocuments();
    } catch (error) {
      throw new DatabaseError('fetch all documents', error as Error);
    }
    
    // Return documents with full extracted content for UI display
    const documentSummaries = documents.map(doc => {
      return {
        id: doc.id,
        fileId: doc.fileId,
        filename: doc.filename,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        uploadedAt: doc.uploadedAt,
        processingTimeMs: doc.processingTimeMs,
        status: doc.status,
        // Include full extracted content for UI display
        extractedContent: doc.extractedContent,
        vectorStoreId: doc.vectorStoreId,
        vectorStoreFileId: doc.vectorStoreFileId,
        extractedFileId: doc.extractedFileId
      };
    });
    
    apiLogger.apiResponse('GET', '/api/documents', 200, { count: documents.length });
    
    return NextResponse.json({
      success: true,
      count: documents.length,
      documents: documentSummaries
    });
  } catch (error) {
    return createErrorResponse(error as Error, 'GET', '/api/documents');
  }
}