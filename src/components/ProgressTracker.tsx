'use client';

import { useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';

interface ProgressData {
  type: string;
  id: string;
  step: string;
  message: string;
  progress: number;
  timestamp: string;
  data?: any;
}

interface ProgressTrackerProps {
  progressId: string;
  onComplete?: (data?: any) => void;
  onError?: (error: string) => void;
}

const stepIcons: Record<string, string> = {
  starting: '🚀',
  validating: '✅',
  checking: '🔍',
  processing: '⚙️',
  extracting: '🤖',
  vectorizing: '📂',
  saving: '💾',
  completed: '🎉',
  error: '❌'
};

const stepLabels: Record<string, string> = {
  starting: 'Starting',
  validating: 'Validating',
  checking: 'Checking',
  processing: 'Processing',
  extracting: 'Extracting',
  vectorizing: 'Indexing',
  saving: 'Saving',
  completed: 'Complete',
  error: 'Error'
};

export default function ProgressTracker({ progressId, onComplete, onError }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const logger = createLogger('progress-tracker');

  useEffect(() => {
    // Set initial connecting state immediately
    setProgress({
      type: 'progress',
      id: progressId,
      step: 'starting',
      message: 'Connecting to progress stream...',
      progress: 0,
      timestamp: new Date().toISOString()
    });

    const eventSource = new EventSource(`/api/progress/${progressId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          logger.info('Progress tracker connected');
          return;
        }

        if (data.type === 'progress') {
          setProgress(data);
          
          if (data.step === 'completed') {
            onComplete?.(data.data);
            eventSource.close();
          } else if (data.step === 'error') {
            onError?.(data.message);
            eventSource.close();
          }
        }
      } catch (error) {
        logger.error('Failed to parse progress data', error);
      }
    };

    eventSource.onerror = (error) => {
      logger.error('EventSource failed', error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [progressId, onComplete, onError]);

  if (!progress && !isConnected) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  const currentStep = progress?.step || 'starting';
  const currentProgress = progress?.progress || 0;
  const currentMessage = progress?.message || 'Initializing...';
  const isError = currentStep === 'error';
  const isComplete = currentStep === 'completed';

  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{stepIcons[currentStep] || '⚙️'}</span>
          <h3 className="text-lg font-medium text-gray-900">
            {stepLabels[currentStep] || 'Processing'}
          </h3>
        </div>
        <div className="ml-auto">
          <span className={`text-sm font-medium ${
            isError ? 'text-red-600' : 
            isComplete ? 'text-green-600' : 
            'text-blue-600'
          }`}>
            {currentProgress}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ease-out ${
            isError ? 'bg-red-500' : 
            isComplete ? 'bg-green-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      {/* Current Message */}
      <p className={`text-sm ${
        isError ? 'text-red-600' : 
        isComplete ? 'text-green-600' : 
        'text-gray-600'
      }`}>
        {currentMessage}
      </p>

      {/* Show additional data for completed uploads */}
      {isComplete && progress?.data && !progress.data.duplicate && (
        <div className="mt-3 p-3 bg-green-50 rounded-md">
          <div className="text-sm text-green-800">
            {progress.data.extractedContent && (
              <div className="space-y-1">
                <div>📊 Tables extracted: {progress.data.extractedContent.tables}</div>
                <div>📝 Text characters: {progress.data.extractedContent.textLength?.toLocaleString()}</div>
                <div>🔍 Added to search index</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show duplicate info */}
      {isComplete && progress?.data?.duplicate && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-md">
          <div className="text-sm text-yellow-800">
            <div>⚠️ File already exists in database</div>
            {progress.data.existingDocument && (
              <div className="mt-1 text-xs">
                Uploaded: {new Date(progress.data.existingDocument.uploadedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && !isComplete && !isError && (
        <div className="mt-2 text-xs text-gray-500">
          ⚠️ Connection lost - progress may not update
        </div>
      )}
    </div>
  );
}