import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  malaAmount: number;
  yoghurtAmount: number;
}

interface SalesRecord {
  date: Date | string;
  amount: number;
  shopId: string;
  productType: string;
  quantity: number;
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
  const [activeTab, setActiveTab] = useState("overview");

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

        // Fetch milk processing records
        const { data: processingData, error: processingError } = await supabase
          .from('milk_processing_records')
          .select('date, total_milk_used, mala_amount, yoghurt_amount')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (processingError) throw processingError;
        
        const processingByDate = processingData?.reduce((acc: Record<string, {milk: number, mala: number, yoghurt: number}>, record) => {
          const date = record.date;
          if (!acc[date]) acc[date] = { milk: 0, mala: 0, yoghurt: 0 };
          acc[date].milk += parseFloat(record.total_milk_used?.toString() || '0');
          acc[date].mala += parseFloat(record.mala_amount?.toString() || '0');
          acc[date].yoghurt += parseFloat(record.yoghurt_amount?.toString() || '0');
          return acc;
        }, {}) || {};
        
        setProductionRecords(Object.entries(processingByDate).map(([date, data]) => ({
          date: new Date(date),
          rawMilk: data.milk,
          malaAmount: data.mala,
          yoghurtAmount: data.yoghurt
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
          .select('date, amount, shop_id, product_type, quantity')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (salesError) throw salesError;
        setSalesRecords(salesData?.map(record => ({
          date: new Date(record.date),
          amount: parseFloat(record.amount?.toString() || '0'),
          shopId: record.shop_id.toString(),
          productType: record.product_type || 'Unknown',
          quantity: parseFloat(record.quantity?.toString() || '0')
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full md:min-w-0">
            <TabsTrigger value="overview" className="whitespace-nowrap">Today's Summary</TabsTrigger>
            <TabsTrigger value="farm" className="whitespace-nowrap">Farm Progress</TabsTrigger>
            <TabsTrigger value="shops" className="whitespace-nowrap">Shops Progress</TabsTrigger>
            <TabsTrigger value="cows" className="whitespace-nowrap">Cow Management</TabsTrigger>
            <TabsTrigger value="users" className="whitespace-nowrap">User Management</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <TodaysSummaryTab
            milkingRecords={milkingRecords}
            eggRecords={eggRecords}
            slaughterRecords={slaughterRecords}
            productionRecords={productionRecords}
            cows={cows}
            shops={shops}
            onNavigateToTab={setActiveTab}
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
          <CowManagementTab cows={cows} onCowAdded={() => {
            // Refetch cows data
            const fetchCows = async () => {
              try {
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
              } catch (error) {
                console.error('Error fetching cows:', error);
              }
            };
            fetchCows();
          }} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmOwnerDashboard;