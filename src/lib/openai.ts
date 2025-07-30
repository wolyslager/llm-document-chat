import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import { openaiLogger } from './logger';

// Use a dummy key during build to avoid errors if OPENAI_API_KEY is not set
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build',
});

// ---------------------------------------------------------------------------
// 🧠 Simple in-memory cache for vector-store searches
// ---------------------------------------------------------------------------
// Keyed by `${query}::${vectorStoreId}`.  Keeps results for the lifetime of the
// process (good enough for edge/function runtimes where instances are
// short-lived). If you need stronger guarantees, swap this out for Redis or
// another shared cache.

type CachedSearchResult = {
  response: string;
  runId: string;
  threadId: string;
};

// Shared Redis instance (Upstash REST – credentials loaded from env vars)
const redis = Redis.fromEnv();
// TTL for Redis-cached results (seconds)
const REDIS_TTL_SECONDS = 60 * 60; // 1 hour

export interface FileUploadResult {
  fileId: string;
  filename: string;
  bytes: number;
  createdAt: number;
  purpose: string;
}

export async function uploadFile(file: File): Promise<FileUploadResult> {
  try {
    const uploaded = await openai.files.create({ file, purpose: 'assistants' });
    
    openaiLogger.info('File uploaded to OpenAI', {
      fileId: uploaded.id,
      filename: uploaded.filename,
      bytes: uploaded.bytes
    });
    
    return {
      fileId: uploaded.id,
      filename: uploaded.filename,
      bytes: uploaded.bytes,
      createdAt: uploaded.created_at,
      purpose: uploaded.purpose
    };
  } catch (error) {
    openaiLogger.error('Failed to upload file to OpenAI', error as Error, {
      filename: file.name,
      size: file.size
    });
    throw error;
  }
}

async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  const startTime = Date.now();
  
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execPromise = promisify(exec);
  
  try {
    // Create temp directory for PDF processing
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-convert-'));
    const pdfPath = path.join(tempDir, 'input.pdf');
    
    // Write PDF buffer to temp file
    await fs.writeFile(pdfPath, pdfBuffer);
    
    // Use system pdftocairo to convert PDF to images
    const outputPrefix = path.join(tempDir, 'page');
    const command = `pdftocairo -png -scale-to 1024 "${pdfPath}" "${outputPrefix}"`;
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      openaiLogger.warn('PDF conversion warnings', { stderr });
    }
    
    // Find all generated PNG files
    const files = await fs.readdir(tempDir);
    const pngFiles = (files as string[])
      .filter((file: string) => file.startsWith('page') && file.endsWith('.png'))
      .sort((a: string, b: string) => {
        // Sort by page number
        const aNum = parseInt(a.match(/page-(\d+)\.png/)?.[1] || '0');
        const bNum = parseInt(b.match(/page-(\d+)\.png/)?.[1] || '0');
        return aNum - bNum;
      });
    
    if (pngFiles.length === 0) {
      throw new Error('No images were generated from the PDF');
    }
    
    // Read all generated images
    const imageBuffers: Buffer[] = [];
    for (const pngFile of pngFiles) {
      const imagePath = path.join(tempDir, pngFile);
      const imageBuffer = await fs.readFile(imagePath);
      imageBuffers.push(imageBuffer);
    }
    
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
    const duration = Date.now() - startTime;
    openaiLogger.info('PDF converted to images', { 
      pageCount: imageBuffers.length,
      processingTimeMs: duration,
      inputSizeBytes: pdfBuffer.length
    });
    
    return imageBuffers;
    
  } catch (error) {
    openaiLogger.error('PDF conversion failed', error as Error, {
      inputSizeBytes: pdfBuffer.length
    });
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getFileType(filename: string, mimeType: string): 'image' | 'pdf' | 'text' {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  }
  
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  
  return 'text'; // txt, csv, etc.
}

async function processTextFile(fileBuffer: Buffer, filename: string): Promise<{
  documentType: string;
  extractedFields: Record<string, any>;
  confidence: number;
  tables: Array<{ row: string; column: string; value: string }>;
  rawText: string;
  rawResponse: any;
}> {
  const textContent = fileBuffer.toString('utf-8');
  
  // For CSV files, try to parse as table
  const tables: Array<{ row: string; column: string; value: string }> = [];
  
  if (filename.toLowerCase().endsWith('.csv')) {
    const lines = textContent.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      const headers = lines[0].split(',').map(h => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        for (let j = 0; j < Math.min(headers.length, values.length); j++) {
          tables.push({
            row: `Row ${i}`,
            column: headers[j],
            value: values[j]
          });
        }
      }
    }
  }
  
  return {
    documentType: 'other', // Default for text files
    extractedFields: {},
    confidence: 0.5,
    tables,
    rawText: textContent,
    rawResponse: { type: 'direct-text-processing' }
  };
}

export async function extractTablesAndText(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  customPrompt?: string
): Promise<{
  documentType: string;
  extractedFields: Record<string, any>;
  confidence: number;
  tables: Array<{ row: string; column: string; value: string }>;
  rawText: string;
  rawResponse: any;
}> {
  const startTime = Date.now();
  const fileType = getFileType(filename, mimeType);
  
  // Handle text files directly
  if (fileType === 'text') {
    const result = await processTextFile(fileBuffer, filename);
    openaiLogger.info('Text file processed', {
      filename,
      textLength: result.rawText.length,
      tableEntries: result.tables.length,
      processingTimeMs: Date.now() - startTime
    });
    return result;
  }
  
  // Prepare for vision API
  const prompt =
    customPrompt?.trim() ||
    `You are an expert document classifier and data extractor. Analyze the provided document image and return a strict JSON response with these keys:

1. "documentType" – Classify the document as one of: "invoice", "purchase_order", "receipt", "contract", "report", "form", "letter", or whatever category is the most appropriate.

2. "extractedFields" – Key structured data based on document type:
   • For invoices: {"invoiceNumber", "date", "dueDate", "vendor", "total", "tax", "subtotal", "billTo", "items"}
   • For purchase orders: {"poNumber", "date", "vendor", "buyer", "total", "items", "deliveryDate", "terms"}
   • For receipts: {"store", "date", "total", "tax", "paymentMethod", "items"}
   • For contracts: {"parties", "date", "title", "value", "terms", "duration"}
   • For other types: extract the most relevant fields found

3. "tables" – an array that captures EVERY data cell from ALL tables in the document **excluding header rows**. Represent each cell as an object {"row","column","value"}.
   • "row"  – the EXACT text of the FIRST cell in that row (the row header/value).
   • "column" – the EXACT text of the column header (top-most header cell) for that column.
   • "value" – the cell text itself.
   Do NOT use numeric indices or positional terms. Do NOT include header rows themselves (they become the column names).

   Example table snippet (header + 1 row):
   Pieces | Pallets | Description
   72     | 9       | SAP Forms

   Should yield in "tables":
   [
     {"row":"72","column":"Pieces","value":"72"},
     {"row":"72","column":"Pallets","value":"9"},
     {"row":"72","column":"Description","value":"SAP Forms"}
   ]

4. "rawText" – plain text of all NON-tabular content in reading order.

5. "confidence" – Your confidence in the classification (0-1)

Return ONLY a valid JSON object. Extract actual values when present, use null for missing fields.`;

  let imageBuffers: Buffer[] = [];
  
  if (fileType === 'pdf') {
    imageBuffers = await convertPdfToImages(fileBuffer);
  } else {
    imageBuffers = [fileBuffer];
  }
  
  // Process all images and combine results
  const allTables: Array<{ row: string; column: string; value: string }> = [];
  let allRawText = '';
  const allResponses: any[] = [];
  let documentType = 'other';
  let extractedFields = {};
  let confidence = 0;
  
  for (let i = 0; i < imageBuffers.length; i++) {
    const imageBuffer = imageBuffers[i];
    const mimeTypeForImage = fileType === 'pdf' ? 'image/png' : mimeType;
    const pageInfo = imageBuffers.length > 1 ? ` (Page ${i + 1}/${imageBuffers.length})` : '';
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}${pageInfo ? `\n\nNote: This is page ${i + 1} of ${imageBuffers.length}.` : ''}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeTypeForImage};base64,${imageBuffer.toString('base64')}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: "json_object"
        },
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      
      // Combine results
      if (parsed.documentType) {
        documentType = parsed.documentType;
      }
      if (parsed.extractedFields) {
        extractedFields = parsed.extractedFields;
      }
      if (parsed.confidence) {
        confidence = parsed.confidence;
      }

      if (parsed.tables && Array.isArray(parsed.tables)) {
        parsed.tables.forEach((table: any) => {
          allTables.push({
            ...table,
            row: pageInfo ? `${table.row}${pageInfo}` : table.row
          });
        });
      }
      
      if (parsed.rawText) {
        allRawText += (allRawText ? '\n\n' : '') + 
                     (pageInfo ? `=== Page ${i + 1} ===\n` : '') + 
                     parsed.rawText;
      }
      
      allResponses.push(response);
      
    } catch (error) {
      openaiLogger.error(`Failed to process page ${i + 1}`, error as Error, {
        page: i + 1,
        totalPages: imageBuffers.length,
        filename
      });
      throw error;
    }
  }

  const processingTime = Date.now() - startTime;
  
  openaiLogger.info('Document content extracted', {
    filename,
    fileType,
    pagesProcessed: imageBuffers.length,
    tableEntries: allTables.length,
    textLength: allRawText.length,
    processingTimeMs: processingTime
  });
  
  return { 
    documentType,
    extractedFields,
    confidence,
    tables: allTables, 
    rawText: allRawText, 
    rawResponse: { 
      pages: allResponses.length,
      responses: allResponses,
      documentType,
      extractedFields,
      confidence
    } 
  };
}

export async function createOrGetVectorStore(name: string = 'document-store') {
  const vectorStoreId = process.env.DEFAULT_VECTOR_STORE_ID;
  
  if (vectorStoreId) {
    try {
      const vectorStore = await openai.vectorStores.retrieve(vectorStoreId);
      openaiLogger.info('Using existing vector store', { 
        vectorStoreId: vectorStore.id,
        fileCount: vectorStore.file_counts?.total || 0
      });
      return vectorStore;
    } catch (error) {
      openaiLogger.warn('Configured vector store not found, creating new one', { 
        configuredId: vectorStoreId 
      });
    }
  }
  
  try {
    const vectorStore = await openai.vectorStores.create({
      name: name,
      expires_after: {
        anchor: "last_active_at",
        days: 30
      }
    });
    
    openaiLogger.info('Created new vector store', { 
      vectorStoreId: vectorStore.id,
      name: vectorStore.name,
      envVarNeeded: `DEFAULT_VECTOR_STORE_ID=${vectorStore.id}`
    });
    
    return vectorStore;
  } catch (error) {
    openaiLogger.error('Failed to create vector store', error as Error, { name });
    throw error;
  }
}

export async function addExtractedContentToVectorStore(
  extractedContent: any, 
  originalFilename: string,
  vectorStoreId?: string
) {
  try {
    // Get or create vector store
    const vectorStore = vectorStoreId 
      ? await openai.vectorStores.retrieve(vectorStoreId)
      : await createOrGetVectorStore();
    
    // Format extracted content into searchable text
    let textContent = `File: ${originalFilename}\n\n`;
    
    if (extractedContent.rawText) {
      textContent += `TEXT CONTENT:\n${extractedContent.rawText}\n\n`;
    }
    
    if (extractedContent.tables && extractedContent.tables.length > 0) {
      textContent += `TABLE DATA:\n`;
      extractedContent.tables.forEach((table: any, index: number) => {
        textContent += `Row: ${table.row}, Column: ${table.column}, Value: ${table.value}\n`;
      });
      textContent += '\n';
    }
    
    // Create a new file with the extracted content
    const extractedFile = await openai.files.create({
      file: new File([textContent], `extracted_${originalFilename}.txt`, { type: 'text/plain' }),
      purpose: 'assistants'
    });
    
    // Add the extracted content file to vector store
    const vectorStoreFile = await openai.vectorStores.files.create(
      vectorStore.id,
      { file_id: extractedFile.id }
    );
    
    openaiLogger.info('Content added to vector store', {
      originalFilename,
      vectorStoreId: vectorStore.id,
      vectorStoreFileId: vectorStoreFile.id,
      extractedFileId: extractedFile.id,
      textLength: textContent.length,
      tableCount: extractedContent.tables?.length || 0,
      status: vectorStoreFile.status
    });
  
    return {
      vectorStoreId: vectorStore.id,
      vectorStoreFileId: vectorStoreFile.id,
      extractedFileId: extractedFile.id,
      status: vectorStoreFile.status
    };
  } catch (error) {
    openaiLogger.error('Failed to add content to vector store', error as Error, {
      originalFilename,
      vectorStoreId
    });
    throw error;
  }
}

export async function searchVectorStore(query: string, vectorStoreId?: string) {
  const startTime = Date.now();
  const storeId = vectorStoreId || process.env.DEFAULT_VECTOR_STORE_ID;
  
  if (!storeId) {
    throw new Error('No vector store ID provided');
  }
  
  // Check cache first (non-blocking - cache failures shouldn't break core functionality)
  const cacheKey = `${query}::${storeId}`;
  let cachedResult: CachedSearchResult | null = null;
  
  try {
    cachedResult = await redis.get<CachedSearchResult>(cacheKey);
    if (cachedResult) {
      openaiLogger.info('Search result served from cache', {
        query: query.slice(0, 100), // Log first 100 chars of query
        vectorStoreId: storeId,
        responseTime: Date.now() - startTime
      });
      return cachedResult;
    }
  } catch (err) {
    // Cache failures are non-critical - log and continue
    // This is intentional graceful degradation for cache infrastructure issues
    openaiLogger.warn('Cache lookup failed, proceeding without cache', { 
      error: err instanceof Error ? err.message : 'Unknown cache error',
      cacheKey: cacheKey.slice(0, 50) // Log partial key for debugging
    });
  }
  
  try {
    // Create assistant with vector store
    const assistant = await openai.beta.assistants.create({
      name: "Document Search Assistant",
      instructions: "You are a helpful assistant that searches through uploaded documents to answer questions.",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [storeId]
        }
      }
    });
    
    // Create thread and run
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: query
        }
      ]
    });
    
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id
    });
    
    // Get response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const response = messages.data[0].content[0];
    
    // Cleanup
    await openai.beta.assistants.delete(assistant.id);
    
    const result: CachedSearchResult = {
      response: response.type === 'text' ? response.text.value : 'No text response',
      runId: run.id,
      threadId: thread.id
    };

    // Cache the result (non-blocking - cache write failures shouldn't affect response)
    try {
      await redis.set(cacheKey, result, { ex: REDIS_TTL_SECONDS });
      openaiLogger.debug('Search result cached successfully', { cacheKey: cacheKey.slice(0, 50) });
    } catch (err) {
      // Cache write failures are non-critical - log and continue
      // This is intentional graceful degradation for cache infrastructure issues
      openaiLogger.warn('Failed to cache search result', { 
        error: err instanceof Error ? err.message : 'Unknown cache error',
        cacheKey: cacheKey.slice(0, 50)
      });
    }

    const processingTime = Date.now() - startTime;
    openaiLogger.info('Vector store search completed', {
      query: query.slice(0, 100), // Log first 100 chars of query
      vectorStoreId: storeId,
      responseLength: result.response.length,
      processingTimeMs: processingTime,
      runId: run.id,
      runStatus: run.status
    });

    return result;
  } catch (error) {
    openaiLogger.error('Vector store search failed', error as Error, {
      query: query.slice(0, 100),
      vectorStoreId: storeId,
      processingTimeMs: Date.now() - startTime
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Vector store utilities (light wrappers around OpenAI SDK)
// ---------------------------------------------------------------------------

export const listVectorStores = async () => {
  return openai.vectorStores.list();
};

export const createVectorStore = async (options: Record<string, any>) => {
  return openai.vectorStores.create(options);
};

export const getVectorStore = async (id: string) => {
  return openai.vectorStores.retrieve(id);
};

export const deleteVectorStore = async (id: string) => {
  return openai.vectorStores.delete(id);
};

export const listVectorStoreFiles = async (vectorStoreId: string) => {
  return openai.vectorStores.files.list(vectorStoreId);
};

export const addFileToVectorStore = async (vectorStoreId: string, fileId: string) => {
  return openai.vectorStores.files.create(vectorStoreId, { file_id: fileId });
};

export const removeFileFromVectorStore = async (vectorStoreId: string, fileId: string) => {
  return openai.vectorStores.files.delete(vectorStoreId, fileId as any);
};