// API client configuration
const getBaseURL = () => {
  // In production, use the backend URL if provided
  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // In development or if no backend URL is provided, use relative URLs
  return '';
};

export const API_BASE_URL = getBaseURL();

// Helper function to make API requests
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
} 