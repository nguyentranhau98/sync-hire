/**
 * Google Secret Manager Integration
 *
 * This module provides utilities to access secrets from Google Secret Manager
 * in production, while falling back to environment variables in development.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Cache for secrets to avoid repeated API calls
const secretCache = new Map<string, string>();

// Initialize Secret Manager client (only in production)
let secretClient: SecretManagerServiceClient | null = null;

if (process.env.NODE_ENV === 'production' && process.env.GCP_PROJECT_ID) {
  secretClient = new SecretManagerServiceClient();
}

/**
 * Get a secret from Google Secret Manager or environment variables
 *
 * @param secretName - Name of the secret (e.g., 'GEMINI_API_KEY')
 * @param version - Version of the secret (default: 'latest')
 * @returns The secret value
 */
export async function getSecret(
  secretName: string,
  version: string = 'latest'
): Promise<string> {
  // Development: use environment variables
  if (process.env.NODE_ENV !== 'production') {
    const envValue = process.env[secretName];
    if (!envValue) {
      throw new Error(`Secret ${secretName} not found in environment variables`);
    }
    return envValue;
  }

  // Check cache first
  const cacheKey = `${secretName}:${version}`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey)!;
  }

  // Production: use Secret Manager
  if (!secretClient || !process.env.GCP_PROJECT_ID) {
    throw new Error('Secret Manager not configured. Set GCP_PROJECT_ID environment variable.');
  }

  try {
    const projectId = process.env.GCP_PROJECT_ID;
    const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;

    const [secretVersion] = await secretClient.accessSecretVersion({ name });
    const secretValue = secretVersion.payload?.data?.toString();

    if (!secretValue) {
      throw new Error(`Secret ${secretName} is empty`);
    }

    // Cache the secret
    secretCache.set(cacheKey, secretValue);

    return secretValue;
  } catch (error) {
    console.error(`Failed to access secret ${secretName}:`, error);
    throw new Error(`Failed to access secret ${secretName}`);
  }
}

/**
 * Get multiple secrets at once
 *
 * @param secretNames - Array of secret names
 * @returns Object mapping secret names to their values
 */
export async function getSecrets(secretNames: string[]): Promise<Record<string, string>> {
  const secrets: Record<string, string> = {};

  await Promise.all(
    secretNames.map(async (name) => {
      secrets[name] = await getSecret(name);
    })
  );

  return secrets;
}

/**
 * Get a secret synchronously from cache or environment
 * Only use this after calling getSecret() at least once to populate the cache
 *
 * @param secretName - Name of the secret
 * @returns The cached secret value or environment variable
 */
export function getSecretSync(secretName: string): string {
  // Development: use environment variables
  if (process.env.NODE_ENV !== 'production') {
    const envValue = process.env[secretName];
    if (!envValue) {
      throw new Error(`Secret ${secretName} not found in environment variables`);
    }
    return envValue;
  }

  // Production: check cache
  const cacheKey = `${secretName}:latest`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey)!;
  }

  throw new Error(
    `Secret ${secretName} not in cache. Call getSecret() first or use environment variables.`
  );
}

/**
 * Clear the secret cache (useful for testing or forced refresh)
 */
export function clearSecretCache(): void {
  secretCache.clear();
}

/**
 * Preload commonly used secrets at application startup
 * Call this in your application initialization code
 */
export async function preloadSecrets(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode: skipping secret preload');
    return;
  }

  const commonSecrets = [
    'GEMINI_API_KEY',
    'STREAM_API_SECRET',
    'NEXT_PUBLIC_STREAM_API_KEY',
  ];

  try {
    await getSecrets(commonSecrets);
    console.log('Secrets preloaded successfully');
  } catch (error) {
    console.error('Failed to preload secrets:', error);
    // Don't throw - allow app to start and fail on first secret access
  }
}
