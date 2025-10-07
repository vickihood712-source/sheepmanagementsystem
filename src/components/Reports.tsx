import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, TrendingUp, Sheet as Sheep, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface ReportsProps {
  user: any;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [reportData, setReportData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('current_month');
  const [debtCreditData, setDebtCreditData] = useState<any>({
    summary: { totalDebt: 0, totalCredit: 0, netPosition: 0 },
    statusBreakdown: [],
    monthlyTrends: []
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      // Load sheep data
      const { data: sheepData } = await supabase.from('sheep').select('*');
      
      // Load financial data from sales_records and expenses with proper date filtering
      let salesQuery = supabase.from('sales_records').select('*');
      let expensesQuery = supabase.from('expenses').select('*');
      
      // Apply date filtering
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (dateRange) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      salesQuery = salesQuery.gte('date', startDateStr).lte('date', endDateStr);
      expensesQuery = expensesQuery.gte('date', startDateStr).lte('date', endDateStr);
      
      const { data: salesData } = await salesQuery;
      const { data: expensesData } = await expensesQuery;
      
      // Load alerts
      const { data: alertsData } = await supabase.from('alerts').select('*');

      // Load debt/credit data
      const { data: debtCreditRecords } = await supabase
        .from('debts_credits')
        .select('*')
        .order('created_at', { ascending: true });

      // Process financial data
      const salesRecords = salesData || [];
      const expenseRecords = expensesData || [];

      // Calculate statistics
      const totalSheep = sheepData?.length || 0;
      const healthyCount = sheepData?.filter(sheep => sheep.health_status === 'healthy').length || 0;
      const sickCount = sheepData?.filter(sheep => sheep.health_status === 'sick').length || 0;
      const pregnantCount = sheepData?.filter(sheep => sheep.health_status === 'pregnant').length || 0;
      
      const totalRevenue = salesRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const totalExpenses = expenseRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      
      const breedBreakdown = sheepData?.reduce((acc: any, sheep) => {
        acc[sheep.breed || 'Unknown'] = (acc[sheep.breed || 'Unknown'] || 0) + 1;
        return acc;
      }, {}) || {};

      const genderBreakdown = sheepData?.reduce((acc: any, sheep) => {
        acc[sheep.gender] = (acc[sheep.gender] || 0) + 1;
        return acc;
      }, {}) || {};

      const avgAge = sheepData?.reduce((sum, sheep) => {
        if (sheep.birth_date) {
          const age = Math.floor((now.getTime() - new Date(sheep.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
          return sum + age;
        }
        return sum;
      }, 0) / (sheepData?.filter(sheep => sheep.birth_date).length || 1) || 0;

      const avgWeight = sheepData?.reduce((sum, sheep) => sum + (sheep.weight || 0), 0) / totalSheep || 0;
      
      const totalValue = sheepData?.reduce((sum, sheep) => sum + (sheep.estimated_value || 0), 0) || 0;

      setReportData({
        sheep: {
          total: totalSheep,
          healthy: healthyCount,
          sick: sickCount,
          pregnant: pregnantCount,
          breedBreakdown,
          genderBreakdown,
          avgAge: avgAge.toFixed(1),
          avgWeight: avgWeight.toFixed(1),
          totalValue
        },
        financial: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: netProfit,
          profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0,
          revenueByCategory: salesRecords.reduce((acc: any, r) => {
            const category = r.transaction_type || 'Sales';
            acc[category] = (acc[category] || 0) + (parseFloat(r.amount) || 0);
            return acc;
          }, {}),
          expensesByCategory: expenseRecords.reduce((acc: any, r) => {
            const category = r.category || 'Other';
            acc[category] = (acc[category] || 0) + (parseFloat(r.amount) || 0);
            return acc;
          }, {})
        },
        health: {
          totalAlerts: (alertsData || []).length,
          healthScore: totalSheep > 0 ? ((healthyCount / totalSheep) * 100).toFixed(1) : 100,
          vaccinationCompliance: sheepData?.filter(s => s.vaccination_status === 'up_to_date').length || 0
        }
      });
      
      // Process debt/credit data
      if (debtCreditRecords) {
        const currentDebts = debtCreditRecords.filter(dc => dc.type === 'debt' && dc.status !== 'paid');
        const currentCredits = debtCreditRecords.filter(dc => dc.type === 'credit' && dc.status !== 'paid');
        
        const totalDebt = currentDebts.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);
        const totalCredit = currentCredits.reduce((sum, c) => sum + (c.amount - c.paid_amount), 0);
        
        const statusBreakdown = [
          { name: 'Outstanding Debts', value: totalDebt, color: '#EF4444' },
          { name: 'Outstanding Credits', value: totalCredit, color: '#10B981' }
        ].filter(item => item.value > 0);
        
        setDebtCreditData({
          summary: {
            totalDebt,
            totalCredit,
            netPosition: totalCredit - totalDebt
          },
          statusBreakdown,
          records: debtCreditRecords
        });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadReport = async (reportType: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (reportType) {
        case 'sheep':
          const { data: sheepData } = await supabase.from('sheep').select('*');
          data = sheepData || [];
          filename = `sheep_report_${dateRange}.csv`;
          break;
        case 'financial':
          const { data: salesData } = await supabase.from('sales_records').select('*');
          const { data: expensesData } = await supabase.from('expenses').select('*');
          
          // Combine and format financial data for CSV
          const salesFormatted = (salesData || []).map(record => ({
            date: record.date,
            type: 'Revenue',
            category: record.transaction_type || 'Sale',
            description: record.buyer_seller || 'Sale transaction',
            amount: record.amount,
            created_at: record.created_at
          }));
          
          const expensesFormatted = (expensesData || []).map(record => ({
            date: record.date,
            type: 'Expense',
            category: record.category,
            description: record.description,
            amount: record.amount,
            created_at: record.created_at
          }));
          
          data = [...salesFormatted, ...expensesFormatted];
          filename = `financial_report_${dateRange}.csv`;
          break;
        case 'health':
          const { data: healthData } = await supabase.from('alerts').select('*');
          data = healthData || [];
          filename = `health_report_${dateRange}.csv`;
          break;
        case 'overview':
          // Create a comprehensive overview report
          data = [{
            report_type: 'Flock Overview',
            total_sheep: reportData.sheep?.total || 0,
            healthy_sheep: reportData.sheep?.healthy || 0,
            sick_sheep: reportData.sheep?.sick || 0,
            pregnant_sheep: reportData.sheep?.pregnant || 0,
            total_revenue: reportData.financial?.revenue || 0,
            total_expenses: reportData.financial?.expenses || 0,
            net_profit: reportData.financial?.profit || 0,
            health_score: reportData.health?.healthScore || 0,
            total_debt: debtCreditData.summary?.totalDebt || 0,
            total_credit: debtCreditData.summary?.totalCredit || 0,
            net_position: debtCreditData.summary?.netPosition || 0,
            generated_date: new Date().toISOString().split('T')[0],
            date_range: dateRange
          }];
          filename = `overview_report_${dateRange}.csv`;
          break;
        case 'debts':
          data = debtCreditData.records || [];
          filename = `debt_credit_report_${dateRange}.csv`;
          break;
      }

      generateCSV(data, filename);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading report data...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">Comprehensive insights into your sheep management operations</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex space-x-4">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="current_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="current_year">This Year</option>
          <option value="last_year">Last Year</option>
        </select>
        
        <button
          onClick={() => downloadReport('overview')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-400 hover:bg-green-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Overview
        </button>
      </div>

      {/* Report Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'flock', label: 'Flock Analysis', icon: Sheep },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'health', label: 'Health', icon: FileText },
              { id: 'debts', label: 'Debt & Credit', icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedReport === tab.id
                    ? 'border-green-400 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="liquid-glass p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sheep</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.sheep?.total || 0}</p>
              </div>
              <Sheep className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="liquid-glass p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <p className="text-3xl font-bold text-green-600">{reportData.health?.healthScore || 0}%</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="liquid-glass p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-3xl font-bold ${
                  (reportData.financial?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(reportData.financial?.profit || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'flock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Health Status Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Healthy</span>
                  <span className="text-sm font-medium text-green-600">{reportData.sheep?.healthy || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sick</span>
                  <span className="text-sm font-medium text-red-600">{reportData.sheep?.sick || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pregnant</span>
                  <span className="text-sm font-medium text-purple-600">{reportData.sheep?.pregnant || 0}</span>
                </div>
              </div>
              <button
                onClick={() => downloadReport('sheep')}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Detailed Report
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Breed Distribution</h3>
              <div className="space-y-3">
                {Object.entries(reportData.sheep?.breedBreakdown || {}).map(([breed, count]) => (
                  <div key={breed} className="flex justify-between">
                    <span className="text-sm text-gray-600">{breed}</span>
                    <span className="text-sm font-medium text-gray-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Flock Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{reportData.sheep?.avgAge || 0}</p>
                <p className="text-sm text-gray-600">Avg Age (months)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{reportData.sheep?.avgWeight || 0}</p>
                <p className="text-sm text-gray-600">Avg Weight (kg)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">Ksh {(reportData.sheep?.totalValue || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{reportData.health?.vaccinationCompliance || 0}</p>
                <p className="text-sm text-gray-600">Vaccinated</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="liquid-glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.financial?.revenue || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {Object.keys(reportData.financial?.revenueByCategory || {}).length} revenue streams
              </p>
            </div>
            <div className="liquid-glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(reportData.financial?.expenses || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {Object.keys(reportData.financial?.expensesByCategory || {}).length} expense categories
              </p>
            </div>
            <div className="liquid-glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profit Margin</h3>
              <p className={`text-3xl font-bold ${
                parseFloat(reportData.financial?.profitMargin || '0') >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData.financial?.profitMargin || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Net: {formatCurrency(reportData.financial?.profit || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="liquid-glass p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Revenue by Category</h3>
                <button
                  onClick={() => downloadReport('financial')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(reportData.financial?.revenueByCategory || {}).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(amount as number)}</span>
                  </div>
                ))}
              </div>
              {Object.keys(reportData.financial?.revenueByCategory || {}).length === 0 && (
                <p className="text-sm text-gray-500">No revenue recorded for this period</p>
              )}
            </div>

            <div className="liquid-glass p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
              <div className="space-y-3">
                {Object.entries(reportData.financial?.expensesByCategory || {}).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(amount as number)}</span>
                  </div>
                ))}
              </div>
              {Object.keys(reportData.financial?.expensesByCategory || {}).length === 0 && (
                <p className="text-sm text-gray-500">No expenses recorded for this period</p>
              )}
            </div>
          </div>
          
          {/* Financial Summary Table */}
          <div className="liquid-glass p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Financial Summary</h3>
              <button
                onClick={() => downloadReport('financial')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Financial Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Revenue
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(reportData.financial?.revenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      100%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Expenses
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatCurrency(reportData.financial?.expenses || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reportData.financial?.revenue > 0 
                        ? ((reportData.financial.expenses / reportData.financial.revenue) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Net Profit
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      (reportData.financial?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(reportData.financial?.profit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reportData.financial?.profitMargin || 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'debts' && (
        <div className="space-y-6">
          {/* Debt/Credit Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="liquid-glass p-6 rounded-lg shadow border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Outstanding Debts</p>
                  <p className="text-3xl font-bold text-red-700">
                    {formatCurrency(debtCreditData.summary?.totalDebt || 0)}
                  </p>
                  <p className="text-sm text-red-600 mt-1">Money you owe</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="liquid-glass p-6 rounded-lg shadow border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Outstanding Credits</p>
                  <p className="text-3xl font-bold text-green-700">
                    {formatCurrency(debtCreditData.summary?.totalCredit || 0)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">Money owed to you</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className={`liquid-glass p-6 rounded-lg shadow border ${
              (debtCreditData.summary?.netPosition || 0) >= 0 ? 'border-green-200' : 'border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${
                    (debtCreditData.summary?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  } text-sm font-medium`}>Net Position</p>
                  <p className={`text-3xl font-bold ${
                    (debtCreditData.summary?.netPosition || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(debtCreditData.summary?.netPosition || 0)}
                  </p>
                  <p className={`text-sm mt-1 ${
                    (debtCreditData.summary?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(debtCreditData.summary?.netPosition || 0) >= 0 ? 'Positive position' : 'Negative position'}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${
                  (debtCreditData.summary?.netPosition || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
            </div>
          </div>

          {/* Debt/Credit Visualization */}
          {debtCreditData.statusBreakdown.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Status Breakdown Pie Chart */}
              <div className="liquid-glass p-4 md:p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Debt & Credit Breakdown</h3>
                  <button
                    onClick={() => downloadReport('debts')}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                  <PieChart>
                    <Pie
                      data={debtCreditData.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {debtCreditData.statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Debt/Credit Details Table */}
              <div className="liquid-glass p-4 md:p-6 rounded-lg shadow">
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                
                {/* Mobile-friendly horizontal scroll container */}
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="min-w-full px-4 md:px-0">
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(debtCreditData.records || []).slice(0, 10).map((record: any) => (
                        <div key={record.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0 min-w-[300px] sm:min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{record.counterparty}</div>
                            <div className="text-xs text-gray-500 truncate">{record.description}</div>
                            <div className="text-xs text-gray-400">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className={`text-sm font-medium ${
                          record.type === 'debt' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(record.amount - record.paid_amount)}
                        </div>
                            <div className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                          record.type === 'debt' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {record.type === 'debt' ? 'You Owe' : 'Owed to You'}
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
                  </div>
                </div>
                
                  {(!debtCreditData.records || debtCreditData.records.length === 0) && (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No debt or credit records found
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Download Section */}
          <div className="liquid-glass p-4 md:p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900">Export Report</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Download a comprehensive report of all debt and credit records
                </p>
              </div>
              <button
                onClick={() => downloadReport('debts')}
                className="inline-flex items-center px-3 md:px-4 py-2 border border-gray-300 text-xs md:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Download Full Report</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Health Score</h3>
              <p className="text-3xl font-bold text-green-600">{reportData.health?.healthScore || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Overall flock health</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Health Alerts</h3>
              <p className="text-3xl font-bold text-orange-600">{reportData.health?.totalAlerts || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Active alerts</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vaccination Rate</h3>
              <p className="text-3xl font-bold text-blue-600">
                {reportData.sheep?.total > 0 
                  ? Math.round((reportData.health?.vaccinationCompliance / reportData.sheep.total) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Up to date</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Health Summary</h3>
              <button
                onClick={() => downloadReport('health')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Health Report
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{reportData.sheep?.healthy || 0}</p>
                <p className="text-sm text-green-700">Healthy Sheep</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{reportData.sheep?.sick || 0}</p>
                <p className="text-sm text-red-700">Sick Sheep</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{reportData.sheep?.pregnant || 0}</p>
                <p className="text-sm text-purple-700">Pregnant Sheep</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{reportData.health?.vaccinationCompliance || 0}</p>
                <p className="text-sm text-blue-700">Vaccinated</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;