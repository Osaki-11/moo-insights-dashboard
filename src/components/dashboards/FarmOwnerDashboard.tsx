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
  const [milkingRecords, setMilkingRecords] = useState<MilkingRecord[]>([]);
  const [eggRecords, setEggRecords] = useState<EggRecord[]>([]);
  const [slaughterRecords, setSlaughterRecords] = useState<SlaughterRecord[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch shops
        const { data: shopsData, error: shopsError } = await supabase
          .from('shops')
          .select('*');
        if (shopsError) throw shopsError;
        setShops(shopsData || []);

        // Fetch cows
        const { data: cowsData, error: cowsError } = await supabase
          .from('cows')
          .select('*');
        if (cowsError) throw cowsError;
        setCows(cowsData?.map(cow => ({
          id: cow.id,
          name: cow.name,
          breed: cow.breed,
          healthStatus: cow.health_status,
          lastMilkingAmount: cow.last_milking_amount
        })) || []);

        // Fetch milk records (last 7 days aggregated by date)
        const { data: milkData, error: milkError } = await supabase
          .from('milk_records')
          .select('date, amount')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (milkError) throw milkError;
        
        const milkByDate = milkData?.reduce((acc: Record<string, number>, record) => {
          const date = record.date;
          acc[date] = (acc[date] || 0) + parseFloat(record.amount?.toString() || '0');
          return acc;
        }, {}) || {};
        
        setMilkingRecords(Object.entries(milkByDate).map(([date, totalMilk]) => ({
          date: new Date(date),
          totalMilk
        })));

        // Fetch egg records
        const { data: eggData, error: eggError } = await supabase
          .from('egg_records')
          .select('date, count')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (eggError) throw eggError;
        setEggRecords(eggData?.map(record => ({
          date: new Date(record.date),
          totalEggs: record.count
        })) || []);

        // Fetch slaughter records
        const { data: slaughterData, error: slaughterError } = await supabase
          .from('slaughter_records')
          .select('date, count')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (slaughterError) throw slaughterError;
        setSlaughterRecords(slaughterData?.map(record => ({
          date: new Date(record.date),
          count: record.count
        })) || []);

        // Use milk records as production records for now
        setProductionRecords(Object.entries(milkByDate).map(([date, rawMilk]) => ({
          date: new Date(date),
          rawMilk: rawMilk * 0.9 // Assume 90% of milk goes to production
        })));

        // Fetch feed inventory
        const { data: feedData, error: feedError } = await supabase
          .from('feed_inventory')
          .select('current_stock, reorder_level');
        if (feedError) throw feedError;
        setFeedItems(feedData?.map(item => ({
          currentStock: parseFloat(item.current_stock?.toString() || '0'),
          reorderLevel: parseFloat(item.reorder_level?.toString() || '0')
        })) || []);

        // Fetch sales records
        const { data: salesData, error: salesError } = await supabase
          .from('sales_records')
          .select('date, amount, shop_id')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (salesError) throw salesError;
        setSalesRecords(salesData?.map(record => ({
          date: new Date(record.date),
          amount: parseFloat(record.amount?.toString() || '0'),
          shopId: record.shop_id.toString()
        })) || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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