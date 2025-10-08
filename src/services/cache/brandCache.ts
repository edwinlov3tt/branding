import type { BrandExtractResponse } from '@/types'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class BrandCache {
  private cache: Map<string, CacheEntry<BrandExtractResponse>>
  private defaultTTL: number // Time to live in milliseconds

  constructor(ttlMinutes: number = 30) {
    this.cache = new Map()
    this.defaultTTL = ttlMinutes * 60 * 1000 // Convert to milliseconds

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Get cached brand assets by brand ID
   */
  get(brandId: string): BrandExtractResponse | null {
    const entry = this.cache.get(brandId)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(brandId)
      return null
    }

    return entry.data
  }

  /**
   * Set brand assets in cache
   */
  set(brandId: string, data: BrandExtractResponse, ttl?: number): void {
    const timestamp = Date.now()
    const expiresAt = timestamp + (ttl || this.defaultTTL)

    this.cache.set(brandId, {
      data,
      timestamp,
      expiresAt
    })
  }

  /**
   * Invalidate cache for a specific brand
   */
  invalidate(brandId: string): void {
    this.cache.delete(brandId)
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      console.log(`Brand cache cleanup: removed ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([id, entry]) => ({
        brandId: id,
        age: Math.round((Date.now() - entry.timestamp) / 1000),
        ttl: Math.round((entry.expiresAt - Date.now()) / 1000)
      }))
    }
  }
}

// Export singleton instance with 30 minute TTL
export const brandCache = new BrandCache(30)
