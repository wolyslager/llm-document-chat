import { NextRequest, NextResponse } from 'next/server';
import { extractTablesAndText, addExtractedContentToVectorStore } from '@/lib/openai';
import { saveDocument, findDocumentByName } from '@/lib/database';
import { randomUUID } from 'crypto';
import { apiLogger as logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errors';
import { handleCors, withCors } from '@/lib/cors';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const progressId = randomUUID(); // Just for unique database IDs
    
    logger.processStart('file upload process');

    if (!file) {
      logger.warn('❌ No file provided');
      return withCors(NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      ), request);
    }

    logger.info(`📄 File received: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('❌ File too large');
      return withCors(NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      ), request);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.warn(`❌ File type not allowed: ${file.type}`);
      return withCors(NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      ), request);
    }

    logger.info('✅ File validation passed');

    // Check for duplicate files
    const existingDocument = await findDocumentByName(file.name);
    if (existingDocument) {
      logger.warn(`⚠️ Duplicate file detected: ${file.name}`);
      return withCors(NextResponse.json({
        message: 'File already exists',
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        existingDocument: {
          id: existingDocument.id,
          uploadedAt: existingDocument.uploadedAt,
          processingTimeMs: existingDocument.processingTimeMs
        },
        duplicate: true
      }), request);
    }

    logger.info('✅ No duplicate found, proceeding with processing');

    // Process document with vision API
    let uploadError: string | null = null;
    let extraction = null as any;
    let vectorStoreResult = null as any;
    let savedDocument = null as any;
    const startTime = Date.now();

    try {
      logger.processStep('table and text extraction');
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      extraction = await extractTablesAndText(fileBuffer, file.name, file.type);
      logger.processStep('extraction completed');
      logger.info(`📊 Found ${extraction.tables?.length || 0} table entries`);
      logger.info(`📝 Extracted text length: ${extraction.rawText?.length || 0} characters`);
      
      logger.processStep('add extracted content to vector store');
      vectorStoreResult = await addExtractedContentToVectorStore(extraction, file.name);
      logger.info(`✅ Extracted content added to vector store: ${vectorStoreResult.vectorStoreId}`);
      
      const processingTime = Date.now() - startTime;
      
      // Save to database
      savedDocument = await saveDocument({
        fileId: `direct-processing-${progressId}`, // Use unique ID to avoid conflicts
        filename: file.name,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedContent: extraction,
        vectorStoreId: vectorStoreResult.vectorStoreId,
        vectorStoreFileId: vectorStoreResult.vectorStoreFileId,
        extractedFileId: vectorStoreResult.extractedFileId,
        processingTimeMs: processingTime,
        status: 'success'
      });
      
    } catch (error) {
      logger.error('❌ Processing error', error as Error);
      uploadError = error instanceof Error ? error.message : 'Failed to upload file';
      
      // Don't save failed records to database - fail hard
      logger.error('Not saving failed record to database - failing process');
    }

    if (uploadError) {
      return withCors(NextResponse.json(
        { error: uploadError },
        { status: 500 }
      ), request);
    }

    logger.processComplete('file upload process');
    
    return withCors(NextResponse.json({
      message: 'File uploaded successfully',
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      processing: {
        method: 'direct-vision-api',
        originalType: file.type
      },
      extraction: extraction,
      documentId: savedDocument?.id,
      vectorStore: vectorStoreResult
    }), request);

  } catch (error) {
    return createErrorResponse(error as Error, 'POST', '/api/upload', request);
  }
}