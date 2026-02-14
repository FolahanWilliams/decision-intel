/**
 * Utility functions for AI analysis resilience and performance
 */

/**
 * Execute a function with retry logic and exponential backoff
 * @param fn The function to execute
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param baseDelay Base delay in milliseconds (default: 1000)
 * @param maxDelay Maximum delay in milliseconds (default: 30000)
 * @returns Promise resolving to the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate exponential backoff delay with jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
      const delay = exponentialDelay + jitter;
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`, lastError.message);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Sleep for a specified duration
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with a timeout
 * @param fn The function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message
 * @returns Promise resolving to the function result
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Calculate content hash for caching purposes
 * Uses a simple but fast hashing algorithm suitable for text content
 * @param content The content to hash
 * @returns Hash string
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Smart text truncation that preserves sentence boundaries and context
 * @param text The text to truncate
 * @param maxChars Maximum characters
 * @param minSentenceLength Minimum sentence length to consider valid
 * @returns Truncated text
 */
export function smartTruncate(
  text: string,
  maxChars: number,
  minSentenceLength: number = 10
): string {
  if (text.length <= maxChars) {
    return text;
  }
  
  // Define sentence ending patterns
  const sentenceEndings = /[.!?]+\s+/g;
  
  // Find all sentence boundaries
  const matches: Array<{ index: number; length: number }> = [];
  let match;
  while ((match = sentenceEndings.exec(text)) !== null) {
    matches.push({ index: match.index + match[0].length, length: match[0].length });
  }
  
  // If no sentence boundaries found, fall back to word boundary
  if (matches.length === 0) {
    return truncateAtWordBoundary(text, maxChars);
  }
  
  // Find the last complete sentence that fits within maxChars
  let lastValidIndex = 0;
  for (const m of matches) {
    if (m.index <= maxChars) {
      // Check if this creates a meaningful sentence
      const sentence = text.substring(lastValidIndex, m.index).trim();
      if (sentence.length >= minSentenceLength) {
        lastValidIndex = m.index;
      }
    } else {
      break;
    }
  }
  
  // If we couldn't find a valid sentence boundary, try word boundary
  if (lastValidIndex === 0) {
    return truncateAtWordBoundary(text, maxChars);
  }
  
  const truncated = text.substring(0, lastValidIndex).trim();
  return truncated + "\n\n[Content truncated for analysis - " + 
    `${Math.round((truncated.length / text.length) * 100)}% of original processed]`;
}

/**
 * Truncate text at word boundary
 * @param text The text to truncate
 * @param maxChars Maximum characters
 * @returns Truncated text
 */
function truncateAtWordBoundary(text: string, maxChars: number): string {
  // Find the last space before maxChars
  let truncateIndex = maxChars;
  while (truncateIndex > 0 && text[truncateIndex] !== ' ') {
    truncateIndex--;
  }
  
  // If no space found, just cut at maxChars
  if (truncateIndex === 0) {
    truncateIndex = maxChars;
  }
  
  const truncated = text.substring(0, truncateIndex).trim();
  return truncated + "\n\n[Content truncated for analysis - " +
    `${Math.round((truncated.length / text.length) * 100)}% of original processed]`;
}

/**
 * Validates if content is suitable for analysis
 * @param content The content to validate
 * @returns Validation result with error message if invalid
 */
export function validateContent(content: string): { valid: boolean; error?: string } {
  const MIN_CONTENT_LENGTH = 50;
  const MAX_CONTENT_LENGTH = 100000;
  
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Content is empty" };
  }
  
  if (content.length < MIN_CONTENT_LENGTH) {
    return { 
      valid: false, 
      error: `Content too short (${content.length} chars). Minimum ${MIN_CONTENT_LENGTH} characters required for meaningful analysis.` 
    };
  }
  
  if (content.length > MAX_CONTENT_LENGTH) {
    return { 
      valid: false, 
      error: `Content too long (${content.length} chars). Maximum ${MAX_CONTENT_LENGTH} characters supported.` 
    };
  }
  
  return { valid: true };
}

/**
 * Batch process an array with concurrency control
 * @param items Array of items to process
 * @param processor Function to process each item
 * @param concurrency Maximum concurrent operations (default: 3)
 * @returns Array of results
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const promise = processor(items[i]).then(result => {
      results[i] = result;
    });
    
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * Memoize a function with TTL (Time To Live)
 * @param fn The function to memoize
 * @param ttlMs Time to live in milliseconds
 * @returns Memoized function
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    
    const result = fn(...args);
    cache.set(key, { value: result, expiry: Date.now() + ttlMs });
    return result;
  }) as T;
}
