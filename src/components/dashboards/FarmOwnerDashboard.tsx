import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TodaysSummaryTab from './farm-owner/TodaysSummaryTab';
import FarmProgressTab from './farm-owner/FarmProgressTab';
import ShopsProgressTab from './farm-owner/ShopsProgressTab';
import CowManagementTab from './farm-owner/CowManagementTab';
import UserManagement from '@/components/UserManagement';

interface MilkingRecord {
  date: Date | string;
  totalMilk: number;
}

interface EggRecord {
  date: Date | string;
  totalEggs: number;
}

interface SlaughterRecord {
  date: Date | string;
  count: number;
}

interface ProductionRecord {
  date: Date | string;
  rawMilk: number;
}

interface SalesRecord {
  date: Date | string;
  amount: number;
  shopId: string;
}

interface FeedItem {
  currentStock: number;
  reorderLevel: number;
}

interface Cow {
  id: string;
  name?: string;
  breed?: string;
  healthStatus?: string;
  lastMilkingAmount?: number;
}

interface Shop {
  id: number;
  name: string;
  location: string;
}

const FarmOwnerDashboard = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration - replace with real data fetching
  const [milkingRecords] = useState<MilkingRecord[]>([
    { date: new Date(), totalMilk: 45.5 },
    { date: new Date(Date.now() - 86400000), totalMilk: 42.3 },
    { date: new Date(Date.now() - 172800000), totalMilk: 48.1 },
  ]);

  const [eggRecords] = useState<EggRecord[]>([
    { date: new Date(), totalEggs: 24 },
    { date: new Date(Date.now() - 86400000), totalEggs: 26 },
    { date: new Date(Date.now() - 172800000), totalEggs: 22 },
  ]);

  const [slaughterRecords] = useState<SlaughterRecord[]>([
    { date: new Date(), count: 2 },
    { date: new Date(Date.now() - 86400000), count: 0 },
    { date: new Date(Date.now() - 172800000), count: 1 },
  ]);

  const [productionRecords] = useState<ProductionRecord[]>([
    { date: new Date(), rawMilk: 40.2 },
    { date: new Date(Date.now() - 86400000), rawMilk: 38.5 },
    { date: new Date(Date.now() - 172800000), rawMilk: 44.1 },
  ]);

  const [cows] = useState<Cow[]>([
    { id: '1', name: 'Bella', breed: 'Holstein', healthStatus: 'healthy', lastMilkingAmount: 15.2 },
    { id: '2', name: 'Daisy', breed: 'Jersey', healthStatus: 'healthy', lastMilkingAmount: 12.8 },
    { id: '3', name: 'Luna', breed: 'Holstein', healthStatus: 'sick', lastMilkingAmount: 8.5 },
    { id: '4', name: 'Ruby', breed: 'Guernsey', healthStatus: 'healthy', lastMilkingAmount: 14.3 },
  ]);

  const [feedItems] = useState<FeedItem[]>([
    { currentStock: 50, reorderLevel: 100 },
    { currentStock: 25, reorderLevel: 50 },
    { currentStock: 150, reorderLevel: 100 },
  ]);

  const [salesRecords] = useState<SalesRecord[]>([
    { date: new Date(), amount: 2500, shopId: '1' },
    { date: new Date(), amount: 1800, shopId: '2' },
    { date: new Date(Date.now() - 86400000), amount: 2200, shopId: '1' },
    { date: new Date(Date.now() - 86400000), amount: 1950, shopId: '2' },
  ]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*');
        
        if (error) throw error;
        
        setShops(data || []);
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Today's Summary</TabsTrigger>
          <TabsTrigger value="farm">Farm Progress</TabsTrigger>
          <TabsTrigger value="shops">Shops Progress</TabsTrigger>
          <TabsTrigger value="cows">Cow Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TodaysSummaryTab
            milkingRecords={milkingRecords}
            eggRecords={eggRecords}
            slaughterRecords={slaughterRecords}
            productionRecords={productionRecords}
            cows={cows}
            shops={shops}
          />
        </TabsContent>

        <TabsContent value="farm">
          <FarmProgressTab
            milkingRecords={milkingRecords}
            cows={cows}
            feedItems={feedItems}
          />
        </TabsContent>

        <TabsContent value="shops">
          <ShopsProgressTab
            salesRecords={salesRecords}
            shops={shops}
          />
        </TabsContent>

        <TabsContent value="cows">
          <CowManagementTab cows={cows} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmOwnerDashboard;