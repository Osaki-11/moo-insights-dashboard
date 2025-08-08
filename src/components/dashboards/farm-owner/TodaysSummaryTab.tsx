import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Store, 
  TrendingUp, 
  Settings, 
  Calendar, 
  Milk,
  Activity,
  Egg,
  Drumstick
} from 'lucide-react';

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

interface TodaysSummaryTabProps {
  milkingRecords: MilkingRecord[];
  eggRecords: EggRecord[];
  slaughterRecords: SlaughterRecord[];
  productionRecords: ProductionRecord[];
  cows: Cow[];
  shops: Shop[];
  onNavigateToTab?: (tabValue: string) => void;
}

const TodaysSummaryTab = ({
  milkingRecords,
  eggRecords,
  slaughterRecords,
  productionRecords,
  cows,
  shops,
  onNavigateToTab
}: TodaysSummaryTabProps) => {
  const safeDateConvert = (dateInput: Date | string): Date => {
    return dateInput instanceof Date ? dateInput : new Date(dateInput);
  };

  const todaysMilk = milkingRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.totalMilk || 0), 0);

  const todaysEggs = eggRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.totalEggs || 0), 0);

  const todaysSlaughtered = slaughterRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.count || 0), 0);

  const todaysProduction = productionRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.rawMilk || 0), 0);

  const todaysMala = productionRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.malaAmount || 0), 0);

  const todaysYoghurt = productionRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.yoghurtAmount || 0), 0);

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Today's Farm Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{todaysMilk.toFixed(1)}L</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Milk className="h-4 w-4" /> Milk Collected
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{todaysProduction.toFixed(1)}L</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Milk className="h-4 w-4" /> Milk Processed
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="text-orange-600">Mala: {todaysMala.toFixed(1)}L</span>
                <span className="text-purple-600">Yogurt: {todaysYoghurt.toFixed(1)}L</span>
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{todaysEggs}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Egg className="h-4 w-4" /> Eggs Collected
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{todaysSlaughtered}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Drumstick className="h-4 w-4" /> Chickens Slaughtered
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{cows.length}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Activity className="h-4 w-4" /> Cows Managed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              1 farm manager, 2 shop managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shops.length}</div>
            <p className="text-xs text-muted-foreground">
              {shops.length === 2 ? "Both shops operational" : `${shops.length} shops active`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 45,000</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={() => onNavigateToTab?.('users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigateToTab?.('shops')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Revenue Reports
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onNavigateToTab?.('farm')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Update Product Prices
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Shop 1 reported daily sales</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Farm manager recorded milk production</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Low feed stock alert</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodaysSummaryTab;