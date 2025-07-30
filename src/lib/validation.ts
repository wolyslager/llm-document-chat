import { z } from 'zod';

// Search API validation
export const searchRequestSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(1000, 'Search query is too long')
    .refine(val => val.trim().length > 0, 'Search query cannot be empty or only whitespace')
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

// Document ID validation (for URL params)
export const documentIdSchema = z.string()
  .min(1, 'Document ID is required')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Document ID contains invalid characters');

export type DocumentId = z.infer<typeof documentIdSchema>;

// File upload validation (for future use)
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  fileSize: z.number().min(1, 'File size must be greater than 0').max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  fileType: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9\-\+]+$/, 'Invalid MIME type'),
  customPrompt: z.string().max(2000, 'Custom prompt is too long').optional()
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

// Vector store creation schema (POST /vector-stores)
export const vectorStoreCreateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name too long').optional(),
  expires_days: z.number().int().positive().max(365, 'Expiration must be <= 365 days').optional(),
  chunking_strategy: z.object({
    type: z.literal('static'),
    static: z.object({
      max_chunk_size_tokens: z.number().int().positive().max(2000),
      chunk_overlap_tokens: z.number().int().nonnegative().max(1000)
    })
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type VectorStoreCreateRequest = z.infer<typeof vectorStoreCreateSchema>;

// Common validation utilities
export const validateJson = async (request: Request) => {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

export const validateSearchRequest = (data: unknown): SearchRequest => {
  return searchRequestSchema.parse(data);
};

export const validateDocumentId = (id: string): DocumentId => {
  return documentIdSchema.parse(id);
};

export const validateVectorStoreCreate = (data: unknown): VectorStoreCreateRequest => {
  return vectorStoreCreateSchema.parse(data);
};