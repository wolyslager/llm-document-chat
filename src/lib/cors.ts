import { NextRequest, NextResponse } from 'next/server';

// CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://gently-takehome.vercel.app',
  'https://gently-takehome-git-main-wolyslagers-projects.vercel.app',
  // Add any other frontend domains here
];

export function corsHeaders(origin?: string | null): Headers {
  const headers = new Headers();
  
  // Check if origin is allowed
  const isAllowedOrigin = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.includes('vercel.app') || // Allow all Vercel preview deployments
    origin.includes('localhost') ||  // Allow all localhost ports
    process.env.NODE_ENV === 'development'
  );

  if (isAllowedOrigin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  return headers;
}

export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers?.get('origin');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(origin),
    });
  }
  
  return null;
}

export function withCors(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers?.get('origin');
  const corsHeadersObj = corsHeaders(origin);
  
  // Add CORS headers to the response
  corsHeadersObj.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  return response;
}