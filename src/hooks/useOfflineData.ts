import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from '@/lib/offline';
import { useToast } from '@/hooks/use-toast';

type TableName = 'cows' | 'milk_records' | 'egg_records' | 'slaughter_records' | 
  'feed_inventory' | 'sales_records' | 'product_prices' | 'milk_processing_records' | 
  'shops' | 'profiles' | 'inventory';

interface UseOfflineDataOptions {
  table: TableName;
  dependencies?: any[];
}

export function useOfflineData<T>({ table, dependencies = [] }: UseOfflineDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
      toast({
        title: "Back Online",
        description: "Syncing your data...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're Offline",
        description: "Changes will be saved locally and synced when connection returns.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data (online or offline)
  const fetchData = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        // Try to fetch from Supabase first
        const { data: onlineData, error } = await supabase
          .from(table as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Save to offline storage
        await offlineDB.save(table, onlineData || []);
        setData(onlineData as T[] || []);
      } else {
        // Load from offline storage
        const offlineData = await offlineDB.get(table);
        setData(offlineData);
      }
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      
      // Fallback to offline data
      try {
        const offlineData = await offlineDB.get(table);
        setData(offlineData);
        
        if (isOnline) {
          toast({
            title: "Connection Error",
            description: "Using cached data. Some information may be outdated.",
            variant: "destructive"
          });
        }
      } catch (offlineError) {
        console.error('Error loading offline data:', offlineError);
        toast({
          title: "Data Error",
          description: "Unable to load data. Please check your connection.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Add new record (works offline)
  const addRecord = async (newRecord: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    const record = {
      ...newRecord,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as T;

    try {
      if (isOnline) {
        const { error } = await supabase.from(table as any).insert([record]);
        if (error) throw error;
      } else {
        // Add to sync queue for later
        await offlineDB.addToSyncQueue('INSERT', table, record);
        
        toast({
          title: "Saved Offline",
          description: "Your data will sync when connection returns.",
        });
      }

      // Update local state
      setData(prev => [record, ...prev]);
      
      // Save to offline storage
      const currentData = await offlineDB.get(table);
      await offlineDB.save(table, [record, ...currentData]);

    } catch (error) {
      console.error(`Error adding ${table} record:`, error);
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive"
      });
    }
  };

  // Update record (works offline)
  const updateRecord = async (id: string, updates: Partial<T>) => {
    const updatedRecord = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const { error } = await supabase
          .from(table as any)
          .update(updatedRecord)
          .eq('id', id);
        if (error) throw error;
      } else {
        // Add to sync queue for later
        await offlineDB.addToSyncQueue('UPDATE', table, { id, ...updatedRecord });
        
        toast({
          title: "Saved Offline",
          description: "Your changes will sync when connection returns.",
        });
      }

      // Update local state
      setData(prev => prev.map(item => 
        (item as any).id === id ? { ...item, ...updatedRecord } : item
      ));

      // Update offline storage
      const currentData = await offlineDB.get(table);
      const updatedData = currentData.map(item => 
        item.id === id ? { ...item, ...updatedRecord } : item
      );
      await offlineDB.save(table, updatedData);

    } catch (error) {
      console.error(`Error updating ${table} record:`, error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive"
      });
    }
  };

  // Sync pending changes when back online
  const syncPendingChanges = async () => {
    if (!isOnline) return;

    try {
      const syncQueue = await offlineDB.getSyncQueue();
      
      for (const item of syncQueue) {
        if (item.operation === 'INSERT') {
          await supabase.from(item.table as any).insert([item.data]);
        } else if (item.operation === 'UPDATE') {
          const { id, ...updateData } = item.data;
          await supabase.from(item.table as any).update(updateData).eq('id', id);
        }
      }

      // Clear sync queue after successful sync
      await offlineDB.clearSyncQueue();
      
      // Refresh data from server
      await fetchData();

      toast({
        title: "Sync Complete",
        description: "All offline changes have been synced.",
      });

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some changes couldn't be synced. Will retry later.",
        variant: "destructive"
      });
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [table, isOnline, ...dependencies]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_DATA') {
        syncPendingChanges();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    data,
    loading,
    isOnline,
    addRecord,
    updateRecord,
    refetch: fetchData,
    syncPendingChanges
  };
}