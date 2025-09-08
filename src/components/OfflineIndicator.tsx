import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { offlineDB } from '@/lib/offline';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending sync items
    const checkPendingSync = async () => {
      try {
        const syncQueue = await offlineDB.getSyncQueue();
        setHasPendingSync(syncQueue.length > 0);
      } catch (error) {
        console.error('Error checking sync queue:', error);
      }
    };

    checkPendingSync();
    const interval = setInterval(checkPendingSync, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && !hasPendingSync) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Wifi className="w-3 h-3" />
        Online
      </Badge>
    );
  }

  if (isOnline && hasPendingSync) {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CloudUpload className="w-3 h-3" />
        Syncing...
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <WifiOff className="w-3 h-3" />
      Offline
    </Badge>
  );
}