// IndexedDB wrapper for offline data storage
class OfflineDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'MooInsightsDB';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each table
        const stores = [
          'cows', 'milk_records', 'egg_records', 'slaughter_records',
          'feed_inventory', 'sales_records', 'inventory', 'product_prices',
          'milk_processing_records', 'shops', 'profiles'
        ];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('synced', 'synced', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
          }
        });

        // Create sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('operation', 'operation', { unique: false });
        }
      };
    });
  }

  async save(storeName: string, data: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    for (const item of data) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ ...item, synced: true });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async get(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue(operation: string, table: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        operation,
        table,
        data,
        timestamp: new Date().toISOString()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDB();