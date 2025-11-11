import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TodaysSummaryTab from './farm-owner/TodaysSummaryTab';
import FarmProgressTab from './farm-owner/FarmProgressTab';
import ShopsProgressTab from './farm-owner/ShopsProgressTab';
import CowManagementTab from './farm-owner/CowManagementTab';
import FinancialDashboard from './farm-owner/FinancialDashboard';
import UserManagement from '@/components/UserManagement';
import InventoryManagement from './InventoryManagement';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LayoutDashboard, DollarSign, Sprout, Store, Beef, Package, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const tabs = [
    { value: "overview", label: "Today's Summary", icon: LayoutDashboard },
    { value: "financial", label: "Financial", icon: DollarSign },
    { value: "farm", label: "Farm", icon: Sprout },
    { value: "shops", label: "Shops", icon: Store },
    { value: "cows", label: "Cows", icon: Beef },
    { value: "inventory", label: "Inventory", icon: Package },
    { value: "users", label: "Users", icon: Users },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsMenuOpen(false);
  };

  return (
    <div className="p-1 md:p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile Navigation Menu */}
        {isMobile ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {tabs.find(t => t.value === activeTab)?.label}
            </h2>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleTabChange(tab.value)}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          /* Desktop Tabs */
          <div className="mb-4 md:mb-6">
            <TabsList className="inline-flex w-max h-auto flex-wrap gap-1 bg-muted/50 p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="whitespace-nowrap text-sm px-3 py-2 data-[state=active]:bg-background"
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}

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

        <TabsContent value="financial">
          <FinancialDashboard
            salesRecords={salesRecords}
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
        
        <TabsContent value="inventory">
          <InventoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmOwnerDashboard;