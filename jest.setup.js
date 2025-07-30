// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.DEFAULT_VECTOR_STORE_ID = 'test-vector-store-id'
process.env.DATABASE_URL = 'file:./test.db'
process.env.UPSTASH_REDIS_REST_URL = 'http://test-redis-url'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  }
}))

// Increase timeout for tests that might take longer
jest.setTimeout(30000)