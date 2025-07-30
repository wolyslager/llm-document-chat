import { PrismaClient } from '@prisma/client';
import { dbLogger } from './logger';
import { DatabaseError } from './errors';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface SaveDocumentParams {
  fileId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  extractedContent: any;
  vectorStoreId?: string;
  vectorStoreFileId?: string;
  extractedFileId?: string;
  processingTimeMs?: number;
  status?: 'success' | 'pending';
}

export async function saveDocument(params: SaveDocumentParams) {
  try {
    const document = await prisma.document.create({
      data: {
        fileId: params.fileId,
        filename: params.filename,
        originalName: params.originalName,
        fileSize: params.fileSize,
        fileType: params.fileType,
        extractedContent: params.extractedContent,
        vectorStoreId: params.vectorStoreId,
        vectorStoreFileId: params.vectorStoreFileId,
        extractedFileId: params.extractedFileId,
        processingTimeMs: params.processingTimeMs,
        status: params.status || 'success',
      },
    });

    dbLogger.info('Document saved to database', { 
      documentId: document.id,
      originalName: params.originalName,
      fileType: params.fileType,
      fileSize: params.fileSize,
      processingTimeMs: params.processingTimeMs,
      status: document.status
    });
    
    return document;
  } catch (error) {
    dbLogger.error('Failed to save document to database', error as Error, {
      originalName: params.originalName,
      fileId: params.fileId,
      fileType: params.fileType
    });
    throw new DatabaseError('save document', error as Error);
  }
}

export async function getDocument(fileId: string) {
  try {
    const document = await prisma.document.findUnique({
      where: { fileId },
    });
    
    // Only log if not found (potential issue) or on error
    if (!document) {
      dbLogger.warn('Document not found', { fileId });
    }
    
    return document;
  } catch (error) {
    dbLogger.error('Failed to fetch document', error as Error, { fileId });
    throw new DatabaseError('fetch document', error as Error);
  }
}

export async function getAllDocuments() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    
    // Only log count for operational awareness
    dbLogger.info('Documents retrieved', { count: documents.length });
    return documents;
  } catch (error) {
    dbLogger.error('Failed to fetch all documents', error as Error);
    throw new DatabaseError('fetch all documents', error as Error);
  }
}

export async function findDocumentByName(originalName: string) {
  try {
    const document = await prisma.document.findFirst({
      where: { originalName },
    });
    
    // Only log if found (indicates duplicate upload attempt)
    if (document) {
      dbLogger.info('Duplicate document detected', { 
        originalName,
        existingDocumentId: document.id,
        existingUploadDate: document.uploadedAt
      });
    }
    
    return document;
  } catch (error) {
    dbLogger.error('Failed to check for existing document', error as Error, { originalName });
    throw new DatabaseError('check for existing document', error as Error);
  }
}