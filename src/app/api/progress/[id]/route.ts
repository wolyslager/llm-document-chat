import { NextRequest } from 'next/server';

// Simple in-memory store for progress tracking
const progressStore = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', id })}\n\n`);
      
      // Set up interval to check for progress updates
      const interval = setInterval(() => {
        const progress = progressStore.get(id);
        if (progress) {
          controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`);
          
          // If processing is complete, clean up
          if (progress.step === 'completed' || progress.step === 'error') {
            clearInterval(interval);
            progressStore.delete(id);
            controller.close();
          }
        }
      }, 100);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        progressStore.delete(id);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
}

// Helper function to update progress (called from other APIs)
export function updateProgress(id: string, step: string, message: string, progress: number, data?: any) {
  progressStore.set(id, {
    type: 'progress',
    id,
    step,
    message,
    progress, // 0-100
    timestamp: new Date().toISOString(),
    data
  });
}

// Export for use in other files
export { progressStore };