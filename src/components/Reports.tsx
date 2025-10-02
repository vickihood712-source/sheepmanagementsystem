import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, TrendingUp, Sheet as Sheep, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReportsProps {
  user: any;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [reportData, setReportData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('current_month');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      // Load sheep data
      const { data: sheepData } = await supabase.from('sheep').select('*');
      
      // Load financial data from sales_records and expenses
      const { data: salesData } = await supabase.from('sales_records').select('*');
      const { data: expensesData } = await supabase.from('expenses').select('*');
      
      // Load alerts
      const { data: alertsData } = await supabase.from('alerts').select('*');

      // Process data based on date range
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          break;
      }

      // Combine financial data
      const salesRecords = (salesData || []).map(record => ({ ...record, type: 'revenue' }));
      const expenseRecords = (expensesData || []).map(record => ({ ...record, type: 'expense' }));
      const allFinanceData = [...salesRecords, ...expenseRecords];
      
      const filteredFinance = allFinanceData.filter(record => 
        new Date(record.date) >= startDate && 
        (dateRange !== 'last_month' && dateRange !== 'last_year' ? new Date(record.date) <= now : 
         dateRange === 'last_month' ? new Date(record.date) < new Date(now.getFullYear(), now.getMonth(), 1) :
         new Date(record.date) < new Date(now.getFullYear(), 0, 1))
      );

      const filteredAlerts = alertsData?.filter(alert =>
        new Date(alert.created_at) >= startDate
      ) || [];

      // Calculate statistics
      const totalSheep = sheepData?.length || 0;
      const healthyCount = sheepData?.filter(sheep => sheep.health_status === 'healthy').length || 0;
      const sickCount = sheepData?.filter(sheep => sheep.health_status === 'sick').length || 0;
      const pregnantCount = sheepData?.filter(sheep => sheep.health_status === 'pregnant').length || 0;
      
      const totalRevenue = filteredFinance.filter(r => r.type === 'revenue').reduce((sum, r) => sum + r.amount, 0);
      const totalExpenses = filteredFinance.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
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
          revenueByCategory: filteredFinance.filter(r => r.type === 'revenue').reduce((acc: any, r) => {
            acc[r.category || 'Other'] = (acc[r.category || 'Other'] || 0) + r.amount;
            return acc;
          }, {}),
          expensesByCategory: filteredFinance.filter(r => r.type === 'expense').reduce((acc: any, r) => {
            acc[r.category || 'Other'] = (acc[r.category || 'Other'] || 0) + r.amount;
            return acc;
          }, {})
        },
        health: {
          totalAlerts: filteredAlerts.length,
          healthScore: totalSheep > 0 ? ((healthyCount / totalSheep) * 100).toFixed(1) : 100,
          vaccinationCompliance: sheepData?.filter(s => s.vaccination_status === 'up_to_date').length || 0
        }
      });
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
          data = [...(salesData || []), ...(expensesData || [])];
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
            generated_date: new Date().toISOString().split('T')[0],
            date_range: dateRange
          }];
          filename = `overview_report_${dateRange}.csv`;
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
              { id: 'health', label: 'Health', icon: FileText }
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
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.financial?.revenue || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(reportData.financial?.expenses || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profit Margin</h3>
              <p className={`text-3xl font-bold ${
                parseFloat(reportData.financial?.profitMargin || '0') >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {reportData.financial?.profitMargin || 0}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
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
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
              <div className="space-y-3">
                {Object.entries(reportData.financial?.expensesByCategory || {}).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(amount as number)}</span>
                  </div>
                ))}
              </div>
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