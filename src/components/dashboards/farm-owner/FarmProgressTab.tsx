import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Milk,
  BarChart,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MilkingRecord {
  date: Date | string;
  totalMilk: number;
}

interface Cow {
  id: string;
  name?: string;
  breed?: string;
  healthStatus?: string;
  lastMilkingAmount?: number;
}

interface FeedItem {
  currentStock: number;
  reorderLevel: number;
}

interface FarmProgressTabProps {
  milkingRecords: MilkingRecord[];
  cows: Cow[];
  feedItems: FeedItem[];
}

const FarmProgressTab = ({ milkingRecords, cows, feedItems }: FarmProgressTabProps) => {
  const safeDateConvert = (dateInput: Date | string): Date => {
    return dateInput instanceof Date ? dateInput : new Date(dateInput);
  };

  const weeklyMilk = milkingRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo;
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.totalMilk || 0), 0);

  const healthyCows = cows.filter(cow => cow?.healthStatus === 'healthy').length;
  const lowStockFeed = feedItems.filter(item => 
    (item.currentStock || 0) <= (item.reorderLevel || 0)
  ).length;
  
  const averageDailyMilk = weeklyMilk > 0 ? (weeklyMilk / 7) : 0;

  // Prepare chart data
  const chartData = milkingRecords
    .slice(-7) // Last 7 records
    .map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      milk: record.totalMilk
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Milk</CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyMilk.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days collection
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Milk</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyMilk.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground mt-1">
              Weekly average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Cows</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyCows}</div>
            <p className="text-xs text-muted-foreground">
              out of {cows.length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Feed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockFeed}</div>
            <p className="text-xs text-muted-foreground">
              items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Milk Production Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Milk (L)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value) => [`${value}L`, 'Milk Production']}
                />
                <Line 
                  type="monotone" 
                  dataKey="milk" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmProgressTab;