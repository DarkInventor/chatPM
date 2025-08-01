/**
 * Simple in-memory cache for AI context data
 * Reduces Firebase reads and speeds up context loading
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class AIContextCache {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100; // Prevent memory leaks

  /**
   * Get cached data if it exists and is still valid
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with optional TTL
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.clearExpired();
      
      // If still too large, remove oldest entries
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = Array.from(this.cache.keys())[0];
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Remove expired entries from cache
   */
  static clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key for workspace context
   */
  static getWorkspaceContextKey(workspaceId: string, organizationId: string): string {
    return `workspace_context:${organizationId}:${workspaceId}`;
  }

  /**
   * Generate cache key for cross-workspace context
   */
  static getCrossWorkspaceContextKey(userId: string, organizationId: string): string {
    return `cross_workspace_context:${organizationId}:${userId}`;
  }

  /**
   * Generate cache key for project insights
   */
  static getProjectInsightsKey(projectId: string): string {
    return `project_insights:${projectId}`;
  }

  /**
   * Get cache statistics for monitoring
   */
  static getStats(): {
    size: number;
    hitRate: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses to calculate
      expiredEntries
    };
  }

  /**
   * Cache workspace context with smart TTL based on activity
   */
  static cacheWorkspaceContext(
    workspaceId: string, 
    organizationId: string, 
    data: any, 
    recentActivityCount: number = 0
  ): void {
    // Shorter TTL for active workspaces, longer for inactive ones
    const baseTTL = this.DEFAULT_TTL;
    const activityMultiplier = recentActivityCount > 10 ? 0.5 : recentActivityCount > 5 ? 0.75 : 1.5;
    const ttl = Math.floor(baseTTL * activityMultiplier);

    const key = this.getWorkspaceContextKey(workspaceId, organizationId);
    this.set(key, data, ttl);
  }

  /**
   * Invalidate cache for a specific workspace
   */
  static invalidateWorkspace(workspaceId: string, organizationId: string): void {
    const key = this.getWorkspaceContextKey(workspaceId, organizationId);
    this.cache.delete(key);
  }

  /**
   * Invalidate cache for a specific user's cross-workspace data
   */
  static invalidateUserContext(userId: string, organizationId: string): void {
    const key = this.getCrossWorkspaceContextKey(userId, organizationId);
    this.cache.delete(key);
  }

  /**
   * Automatically clean up expired entries periodically
   */
  static startCleanupTimer(): void {
    // Clean up every 2 minutes
    setInterval(() => {
      this.clearExpired();
    }, 2 * 60 * 1000);
  }
}

// Start cleanup timer when module loads
if (typeof window !== 'undefined') {
  AIContextCache.startCleanupTimer();
}