import { NextRequest, NextResponse } from 'next/server';
import { searchVectorStore } from '@/lib/openai';
import { apiLogger } from '@/lib/logger';
import { createErrorResponse, ExternalServiceError } from '@/lib/errors';
import { validateJson, validateSearchRequest } from '@/lib/validation';
import { handleCors, withCors } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  try {
    // Parse and validate request
    const body = await validateJson(request);
    const { query } = validateSearchRequest(body);
    const trimmedQuery = query.trim();

    apiLogger.apiRequest('POST', '/api/search', { queryLength: trimmedQuery.length });

    let searchResult;
    try {
      searchResult = await searchVectorStore(trimmedQuery);
    } catch (error) {
      throw new ExternalServiceError('OpenAI', error instanceof Error ? error.message : 'Search failed');
    }
    
    // Remove citation brackets from the response
    let cleanedResponse = searchResult.response;
    if (typeof cleanedResponse === 'string') {
      // Remove patterns like 【4:0†extracted_sample-invoice.pdf.txt】
      cleanedResponse = cleanedResponse.replace(/【[^】]*】/g, '');
      // Also remove any remaining citation patterns like [1], (1), etc.
      cleanedResponse = cleanedResponse.replace(/\[[^\]]*\]/g, '');
      cleanedResponse = cleanedResponse.trim();
    }

    apiLogger.apiResponse('POST', '/api/search', 200, { 
      responseLength: cleanedResponse.length,
      runId: searchResult.runId
    });

    return withCors(NextResponse.json({
      success: true,
      query: trimmedQuery,
      response: cleanedResponse,
      metadata: {
        runId: searchResult.runId,
        threadId: searchResult.threadId,
        searchedAt: new Date().toISOString()
      }
    }), request);

  } catch (error) {
    return createErrorResponse(error as Error, 'POST', '/api/search', request);
  }
}