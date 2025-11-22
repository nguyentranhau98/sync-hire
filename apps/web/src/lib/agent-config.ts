/**
 * Agent API Configuration
 *
 * Manages the Python agent API URL based on environment:
 * - Development: Direct connection to localhost:8080
 * - Production: Firebase proxy to Cloud Run via /python-api
 */

/**
 * Get the agent API base URL based on environment
 *
 * In production (Firebase Hosting), uses the /python-api proxy route
 * which Firebase Hosting rewrites to the Cloud Run service.
 *
 * In development, connects directly to localhost.
 */
export function getAgentApiUrl(): string {
  // If explicitly set in environment, use that
  if (process.env.AGENT_API_URL) {
    return process.env.AGENT_API_URL;
  }

  // Production: use Firebase proxy
  if (process.env.NODE_ENV === 'production') {
    // Firebase Hosting will proxy /python-api/** to Cloud Run
    // This eliminates CORS and keeps the Cloud Run URL private
    return '/python-api';
  }

  // Development: direct connection
  return process.env.PYTHON_AGENT_URL || 'http://localhost:8080';
}

/**
 * Build a full agent API endpoint URL
 *
 * @param endpoint - The endpoint path (e.g., '/health', '/join-interview')
 * @returns Full URL to the agent endpoint
 */
export function getAgentEndpoint(endpoint: string): string {
  const baseUrl = getAgentApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Check if we're using the Firebase proxy
 */
export function isUsingFirebaseProxy(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.AGENT_API_URL;
}
