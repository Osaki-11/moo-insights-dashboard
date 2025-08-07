import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag,
  TrendingUp,
  BarChart
} from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesRecord {
  date: Date | string;
  amount: number;
  shopId: string;
  productType: string;
  quantity: number;
}

interface Shop {
  id: number;
  name: string;
  location: string;
}

interface ShopsProgressTabProps {
  salesRecords: SalesRecord[];
  shops: Shop[];
}

const ShopsProgressTab = ({ salesRecords, shops }: ShopsProgressTabProps) => {
  const safeDateConvert = (dateInput: Date | string): Date => {
    return dateInput instanceof Date ? dateInput : new Date(dateInput);
  };

  const todaySales = salesRecords
    .filter(record => {
      try {
        const recordDate = safeDateConvert(record.date);
        return recordDate.toDateString() === new Date().toDateString();
      } catch {
        return false;
      }
    })
    .reduce((total, record) => total + (record.amount || 0), 0);
  
  const weeklySales = salesRecords
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
    .reduce((total, record) => total + (record.amount || 0), 0);

  const shopSalesData = shops.map(shop => {
    const shopRecords = salesRecords.filter(record => record.shopId === shop.id.toString());
    const shopSales = shopRecords.reduce((total, record) => total + (record.amount || 0), 0);
    
    // Group items by product type and sum quantities
    const itemsSold = shopRecords.reduce((acc, record) => {
      const key = record.productType;
      acc[key] = (acc[key] || 0) + (record.quantity || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return {
      ...shop,
      totalSales: shopSales,
      itemsSold
    };
  });

  // Prepare chart data for each shop
  const chartData = shopSalesData.map(shop => ({
    name: shop.name,
    sales: shop.totalSales
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total across all shops
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {weeklySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Sales</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(weeklySales > 0 ? (weeklySales/7) : 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Weekly average
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Sales (KES)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`KES ${value}`, 'Total Sales']}
                />
                <Bar 
                  dataKey="sales" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shopSalesData.map((shop) => (
          <Card key={shop.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{shop.name}</span>
                <span className="text-primary">KES {shop.totalSales.toFixed(2)}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{shop.location}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance</span>
                    <span className="text-green-600">Good</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min((shop.totalSales / Math.max(...shopSalesData.map(s => s.totalSales))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Relative to best performing shop
                  </p>
                </div>
                
                {Object.keys(shop.itemsSold).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Items Sold</h4>
                    <div className="space-y-1">
                      {Object.entries(shop.itemsSold).map(([product, quantity]) => (
                        <div key={product} className="flex justify-between text-sm">
                          <span className="capitalize">{product}</span>
                          <span className="font-medium">{quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShopsProgressTab;