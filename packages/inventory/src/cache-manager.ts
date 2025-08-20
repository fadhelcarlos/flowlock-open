import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { RuntimeInventory } from "./index";

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  checksum: string;
  dependencies?: string[];
  tags?: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  invalidations: number;
  size: number;
}

export class InventoryCacheManager {
  private cacheDir: string;
  private memoryCache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private maxMemorySize: number;
  private defaultTTL: number;
  private invalidationQueue: Set<string>;
  
  constructor(options?: {
    cacheDir?: string;
    maxMemorySize?: number;
    defaultTTL?: number;
  }) {
    this.cacheDir = path.resolve(process.cwd(), options?.cacheDir || ".flowlock/cache");
    this.memoryCache = new Map();
    this.maxMemorySize = options?.maxMemorySize || 100; // MB
    this.defaultTTL = options?.defaultTTL || 3600000; // 1 hour
    this.invalidationQueue = new Set();
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0,
      size: 0
    };
    
    this.ensureCacheDir();
    this.loadPersistentCache();
  }
  
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  
  private loadPersistentCache(): void {
    const metaFile = path.join(this.cacheDir, "cache-meta.json");
    
    if (fs.existsSync(metaFile)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
        
        // Load entries that haven't expired
        for (const entry of meta.entries || []) {
          if (this.isValid(entry)) {
            this.memoryCache.set(entry.key, entry);
          }
        }
        
        this.stats = meta.stats || this.stats;
      } catch (error) {
        console.warn("Failed to load cache metadata:", error);
      }
    }
  }
  
  private savePersistentCache(): void {
    const metaFile = path.join(this.cacheDir, "cache-meta.json");
    
    const meta = {
      entries: Array.from(this.memoryCache.values()),
      stats: this.stats,
      timestamp: Date.now()
    };
    
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  }
  
  private calculateChecksum(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('md5').update(content).digest('hex');
  }
  
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return entry.timestamp + entry.ttl > now;
  }
  
  private getMemoryUsage(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length;
    }
    return size / (1024 * 1024); // Convert to MB
  }
  
  private evictLRU(): void {
    if (this.memoryCache.size === 0) return;
    
    // Find oldest entry
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  private checkMemoryPressure(): void {
    while (this.getMemoryUsage() > this.maxMemorySize && this.memoryCache.size > 0) {
      this.evictLRU();
    }
  }
  
  // Get cached data
  get(key: string): any | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      // Try loading from disk
      const diskPath = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(diskPath)) {
        try {
          const diskEntry = JSON.parse(fs.readFileSync(diskPath, "utf8"));
          if (this.isValid(diskEntry)) {
            this.memoryCache.set(key, diskEntry);
            this.stats.hits++;
            return diskEntry.data;
          }
        } catch (error) {
          console.warn(`Failed to load cache entry ${key} from disk:`, error);
        }
      }
      
      this.stats.misses++;
      return null;
    }
    
    if (!this.isValid(entry)) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    
    // Update timestamp for LRU
    entry.timestamp = Date.now();
    
    return entry.data;
  }
  
  // Set cached data
  set(
    key: string,
    data: any,
    options?: {
      ttl?: number;
      dependencies?: string[];
      tags?: string[];
      persistent?: boolean;
    }
  ): void {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || this.defaultTTL,
      checksum: this.calculateChecksum(data),
      dependencies: options?.dependencies,
      tags: options?.tags
    };
    
    this.memoryCache.set(key, entry);
    
    // Write to disk if persistent
    if (options?.persistent) {
      const diskPath = path.join(this.cacheDir, `${key}.json`);
      fs.writeFileSync(diskPath, JSON.stringify(entry, null, 2));
    }
    
    // Check memory pressure
    this.checkMemoryPressure();
    
    // Update stats
    this.stats.size = this.memoryCache.size;
  }
  
  // Invalidate specific cache entries
  invalidate(pattern: string | RegExp | ((key: string) => boolean)): number {
    const keysToInvalidate: string[] = [];
    
    for (const key of this.memoryCache.keys()) {
      if (typeof pattern === 'string' && key === pattern) {
        keysToInvalidate.push(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        keysToInvalidate.push(key);
      } else if (typeof pattern === 'function' && pattern(key)) {
        keysToInvalidate.push(key);
      }
    }
    
    for (const key of keysToInvalidate) {
      this.memoryCache.delete(key);
      
      // Also delete from disk
      const diskPath = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
      
      // Invalidate dependent entries
      this.invalidateDependents(key);
    }
    
    this.stats.invalidations += keysToInvalidate.length;
    return keysToInvalidate.length;
  }
  
  // Invalidate by tag
  invalidateByTag(tag: string): number {
    return this.invalidate((key) => {
      const entry = this.memoryCache.get(key);
      return entry?.tags?.includes(tag) || false;
    });
  }
  
  // Invalidate dependent entries
  private invalidateDependents(key: string): void {
    for (const [depKey, entry] of this.memoryCache) {
      if (entry.dependencies?.includes(key)) {
        this.memoryCache.delete(depKey);
        this.invalidateDependents(depKey); // Recursive invalidation
      }
    }
  }
  
  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    
    // Clear disk cache
    const files = fs.readdirSync(this.cacheDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    }
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0,
      size: 0
    };
  }
  
  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  // Cache warming
  async warm(loader: () => Promise<any>, key: string, options?: any): Promise<void> {
    const data = await loader();
    this.set(key, data, options);
  }
  
  // Batch invalidation with debouncing
  queueInvalidation(key: string): void {
    this.invalidationQueue.add(key);
    
    // Debounce actual invalidation
    setTimeout(() => {
      if (this.invalidationQueue.size > 0) {
        for (const k of this.invalidationQueue) {
          this.invalidate(k);
        }
        this.invalidationQueue.clear();
      }
    }, 100);
  }
  
  // Save cache state before shutdown
  shutdown(): void {
    this.savePersistentCache();
  }
}

// Singleton instance for inventory caching
let cacheInstance: InventoryCacheManager | null = null;

export function getInventoryCache(): InventoryCacheManager {
  if (!cacheInstance) {
    cacheInstance = new InventoryCacheManager();
  }
  return cacheInstance;
}

// Cache invalidation strategies
export class CacheInvalidationStrategy {
  private cache: InventoryCacheManager;
  
  constructor(cache: InventoryCacheManager) {
    this.cache = cache;
  }
  
  // Invalidate on file change
  onFileChange(filePath: string): void {
    const ext = path.extname(filePath);
    
    // Invalidate based on file type
    switch (ext) {
      case '.prisma':
      case '.sql':
        this.cache.invalidateByTag('db-schema');
        this.cache.invalidateByTag('db-inventory');
        break;
        
      case '.ts':
      case '.js':
        if (filePath.includes('api') || filePath.includes('route')) {
          this.cache.invalidateByTag('api-inventory');
        }
        if (filePath.includes('model') || filePath.includes('entity')) {
          this.cache.invalidateByTag('db-schema');
        }
        break;
        
      case '.tsx':
      case '.jsx':
        this.cache.invalidateByTag('ui-inventory');
        break;
    }
  }
  
  // Invalidate on spec change
  onSpecChange(specSection: string): void {
    switch (specSection) {
      case 'entities':
        this.cache.invalidateByTag('db-schema');
        this.cache.invalidateByTag('db-inventory');
        break;
        
      case 'screens':
        this.cache.invalidateByTag('ui-inventory');
        break;
        
      case 'flows':
        this.cache.invalidate(/.*inventory.*/);
        break;
    }
  }
  
  // Time-based invalidation
  scheduleInvalidation(pattern: string | RegExp, intervalMs: number): NodeJS.Timer {
    return setInterval(() => {
      this.cache.invalidate(pattern);
    }, intervalMs);
  }
  
  // Smart invalidation based on data freshness
  validateFreshness(key: string, maxAge: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      this.cache.invalidate(key);
      return false;
    }
    
    return true;
  }
}

// Enhanced inventory builder with caching
export async function buildInventoryWithCache(
  cfgPath: string,
  options?: {
    useCache?: boolean;
    cacheTTL?: number;
    forceRefresh?: boolean;
  }
): Promise<RuntimeInventory> {
  const cache = getInventoryCache();
  const cacheKey = `inventory-${cfgPath}`;
  
  // Check cache first
  if (options?.useCache && !options?.forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log("✅ Using cached inventory data");
      return cached;
    }
  }
  
  // Build fresh inventory
  console.log("🔄 Building fresh inventory...");
  const { buildInventory } = await import("./index");
  const inventoryPath = await buildInventory(cfgPath);
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  
  // Cache the result
  if (options?.useCache) {
    cache.set(cacheKey, inventory, {
      ttl: options.cacheTTL || 3600000,
      tags: ['inventory', 'db-inventory', 'api-inventory', 'ui-inventory'],
      persistent: true
    });
  }
  
  return inventory;
}