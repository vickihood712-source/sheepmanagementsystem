import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FinancialChartsProps {
  user: any;
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ user }) => {
  const [chartData, setChartData] = useState<any>({
    monthlyTrends: [],
    categoryBreakdown: [],
    profitAnalysis: [],
    cashFlow: [],
    yearlyComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    loadChartData();
  }, [timeRange]);

  const loadChartData = async () => {
    try {
      // Load sales and expenses data
      const { data: salesData } = await supabase
        .from('sales_records')
        .select('amount, date, transaction_type')
        .order('date', { ascending: true });

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, date, category')
        .order('date', { ascending: true });

      const { data: sheepData } = await supabase
        .from('sheep')
        .select('estimated_value, created_at, status');

      // Process data for charts
      const processedData = processFinancialData(salesData || [], expensesData || [], sheepData || []);
      setChartData(processedData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processFinancialData = (sales: any[], expenses: any[], sheep: any[]) => {
    // Monthly trends data
    const monthlyData = generateMonthlyTrends(sales, expenses);
    
    // Category breakdown for expenses
    const categoryData = generateCategoryBreakdown(expenses);
    
    // Profit analysis over time
    const profitData = generateProfitAnalysis(sales, expenses);
    
    // Cash flow analysis
    const cashFlowData = generateCashFlow(sales, expenses);
    
    // Yearly comparison
    const yearlyData = generateYearlyComparison(sales, expenses);

    return {
      monthlyTrends: monthlyData,
      categoryBreakdown: categoryData,
      profitAnalysis: profitData,
      cashFlow: cashFlowData,
      yearlyComparison: yearlyData
    };
  };

  const generateMonthlyTrends = (sales: any[], expenses: any[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthSales = sales
        .filter(s => s.date.startsWith(monthKey))
        .reduce((sum, s) => sum + s.amount, 0);
      
      const monthExpenses = expenses
        .filter(e => e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.amount, 0);
      
      months.push({
        month: monthName,
        revenue: monthSales,
        expenses: monthExpenses,
        profit: monthSales - monthExpenses
      });
    }
    
    return months;
  };

  const generateCategoryBreakdown = (expenses: any[]) => {
    const categories: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const generateProfitAnalysis = (sales: any[], expenses: any[]) => {
    const quarters = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const quarterStart = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
      const quarterEnd = new Date(now.getFullYear(), now.getMonth() - (i * 3) + 3, 0);
      
      const quarterSales = sales
        .filter(s => {
          const saleDate = new Date(s.date);
          return saleDate >= quarterStart && saleDate <= quarterEnd;
        })
        .reduce((sum, s) => sum + s.amount, 0);
      
      const quarterExpenses = expenses
        .filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= quarterStart && expenseDate <= quarterEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      quarters.push({
        quarter: `Q${4 - i}`,
        revenue: quarterSales,
        expenses: quarterExpenses,
        profit: quarterSales - quarterExpenses,
        margin: quarterSales > 0 ? ((quarterSales - quarterExpenses) / quarterSales * 100) : 0
      });
    }
    
    return quarters;
  };

  const generateCashFlow = (sales: any[], expenses: any[]) => {
    const dailyData = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dailySales = sales
        .filter(s => s.date === dateKey)
        .reduce((sum, s) => sum + s.amount, 0);
      
      const dailyExpenses = expenses
        .filter(e => e.date === dateKey)
        .reduce((sum, e) => sum + e.amount, 0);
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inflow: dailySales,
        outflow: dailyExpenses,
        net: dailySales - dailyExpenses
      });
    }
    
    return dailyData;
  };

  const generateYearlyComparison = (sales: any[], expenses: any[]) => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear];
    
    return years.map(year => {
      const yearSales = sales
        .filter(s => new Date(s.date).getFullYear() === year)
        .reduce((sum, s) => sum + s.amount, 0);
      
      const yearExpenses = expenses
        .filter(e => new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        year: year.toString(),
        revenue: yearSales,
        expenses: yearExpenses,
        profit: yearSales - yearExpenses
      };
    });
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const formatCurrency = (value: number) => `Ksh ${value.toLocaleString()}`;

  const calculateKPIs = () => {
    const currentMonth = chartData.monthlyTrends[chartData.monthlyTrends.length - 1];
    const previousMonth = chartData.monthlyTrends[chartData.monthlyTrends.length - 2];
    
    if (!currentMonth || !previousMonth) return { revenueGrowth: 0, profitGrowth: 0, expenseGrowth: 0 };
    
    const revenueGrowth = previousMonth.revenue > 0 
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100) 
      : 0;
    
    const profitGrowth = previousMonth.profit !== 0 
      ? ((currentMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit) * 100) 
      : 0;
    
    const expenseGrowth = previousMonth.expenses > 0 
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100) 
      : 0;
    
    return { revenueGrowth, profitGrowth, expenseGrowth };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  const kpis = calculateKPIs();
  const totalRevenue = chartData.monthlyTrends.reduce((sum: number, month: any) => sum + month.revenue, 0);
  const totalExpenses = chartData.monthlyTrends.reduce((sum: number, month: any) => sum + month.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Financial Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your sheep business performance</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="24months">Last 24 Months</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="liquid-glass p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
              <div className="flex items-center mt-2">
                {kpis.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${kpis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(kpis.revenueGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </div>
            <DollarSign className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalExpenses)}</p>
              <div className="flex items-center mt-2">
                {kpis.expenseGrowth <= 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${kpis.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(kpis.expenseGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </div>
            <Activity className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className={`liquid-glass p-6 rounded-xl border ${totalProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-medium`}>Net Profit</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(totalProfit)}
              </p>
              <div className="flex items-center mt-2">
                {kpis.profitGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${kpis.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(kpis.profitGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </div>
            <Target className={`h-12 w-12 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-700">
                {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-purple-600 mt-2">Industry avg: 15-25%</p>
            </div>
            <Calendar className="h-12 w-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue & Expenses Trend */}
        <div className="liquid-glass p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Revenue & Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Category Breakdown */}
        <div className="liquid-glass p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.categoryBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Analysis */}
        <div className="liquid-glass p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quarterly Profit Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.profitAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="profit" fill="#10B981" name="Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow */}
        <div className="liquid-glass p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">30-Day Cash Flow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="inflow" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Cash Inflow"
              />
              <Area 
                type="monotone" 
                dataKey="outflow" 
                stackId="2" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.6}
                name="Cash Outflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-over-Year Comparison */}
      <div className="liquid-glass p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Year-over-Year Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData.yearlyComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" stroke="#6b7280" />
            <YAxis stroke="#6b7280" tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}K`} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#3B82F6" name="Profit" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialCharts;