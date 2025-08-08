import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag,
  TrendingUp,
  BarChart
} from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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

  // Product prices management state
  const [priceShopId, setPriceShopId] = useState<string>(shops[0]?.id?.toString() || '');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceForm, setPriceForm] = useState({ productType: '', price: '' });

  const loadPrices = async (shopId: number) => {
    setLoadingPrices(true);
    const { data, error } = await supabase
      .from('product_prices')
      .select('product_type, price')
      .eq('shop_id', shopId);
    if (!error) {
      const map: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        map[row.product_type] = parseFloat(row.price?.toString() || '0');
      });
      setPrices(map);
    }
    setLoadingPrices(false);
  };

  useEffect(() => {
    if (priceShopId) {
      loadPrices(parseInt(priceShopId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceShopId]);

  // Shop details dialog state
  const [detailsShopId, setDetailsShopId] = useState<number | null>(null);

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Product Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label htmlFor="price-shop">Select Shop</Label>
              <Select value={priceShopId} onValueChange={setPriceShopId}>
                <SelectTrigger id="price-shop"><SelectValue placeholder="Choose shop" /></SelectTrigger>
                <SelectContent>
                  {shops.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Prices</Label>
              <div className="space-y-2 mt-2">
                {Object.keys(prices).length === 0 && (
                  <div className="text-sm text-muted-foreground">{loadingPrices ? 'Loading prices...' : 'No prices set for this shop yet.'}</div>
                )}
                {Object.entries(prices).map(([product, price]) => (
                  <div key={product} className="flex items-center justify-between gap-3">
                    <div className="capitalize text-sm">{product}</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-32"
                        value={price}
                        onChange={(e) => setPrices(prev => ({ ...prev, [product]: parseFloat(e.target.value || '0') }))}
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          await supabase.from('product_prices').upsert({
                            shop_id: Number(priceShopId),
                            product_type: product,
                            price: Number(prices[product] || 0)
                          });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  value={priceForm.productType}
                  onValueChange={(v) => setPriceForm(prev => ({ ...prev, productType: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milk">Milk</SelectItem>
                    <SelectItem value="mala">Mala</SelectItem>
                    <SelectItem value="yogurt">Yogurt</SelectItem>
                    <SelectItem value="eggs">Eggs</SelectItem>
                    <SelectItem value="chicken">Chicken</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Price (KES)"
                  value={priceForm.price}
                  onChange={(e) => setPriceForm(prev => ({ ...prev, price: e.target.value }))}
                />
                <Button onClick={async () => {
                  if (!priceForm.productType || !priceForm.price || !priceShopId) return;
                  await supabase.from('product_prices').upsert({
                    shop_id: Number(priceShopId),
                    product_type: priceForm.productType,
                    price: Number(priceForm.price),
                  });
                  setPriceForm({ productType: '', price: '' });
                  await loadPrices(Number(priceShopId));
                }}>
                  Add / Update
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shopSalesData.map((shop) => (
          <Card key={shop.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setDetailsShopId(shop.id)}>
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

      <Dialog open={detailsShopId !== null} onOpenChange={(open) => !open && setDetailsShopId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shops.find(s => s.id === detailsShopId)?.name} - Today's Sales
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown for today
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {(() => {
              const todayStr = new Date().toDateString();
              const records = salesRecords.filter(r => {
                try { const d = safeDateConvert(r.date); return d.toDateString() === todayStr && r.shopId === String(detailsShopId); } catch { return false; }
              });
              const total = records.reduce((sum, r) => sum + (r.amount || 0), 0);
              const byProduct = records.reduce((acc: Record<string, number>, r) => {
                acc[r.productType] = (acc[r.productType] || 0) + (r.quantity || 0);
                return acc;
              }, {} as Record<string, number>);
              return (
                <>
                  <div className="text-sm text-muted-foreground">Total: KES {total.toFixed(2)}</div>
                  <div className="space-y-1">
                    {Object.keys(byProduct).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No sales recorded today.</div>
                    ) : (
                      Object.entries(byProduct).map(([p, q]) => (
                        <div key={p} className="flex justify-between text-sm">
                          <span className="capitalize">{p}</span>
                          <span className="font-medium">{q} units</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopsProgressTab;