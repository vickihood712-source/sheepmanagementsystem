import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Sheet as Sheep, Heart, DollarSign, FileText, Users, Settings, LogOut, Plus, Search, Filter, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SheepForm from './SheepForm';
import SheepList from './SheepList';
import HealthMonitor from './HealthMonitor';
import FinanceTracker from './FinanceTracker';
import ExpenseTracker from './ExpenseTracker';
import Reports from './Reports';
import UserManagement from './UserManagement';
import FinancialCharts from './FinancialCharts';

interface DashboardProps {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'staff' | 'veterinarian';
    name: string;
  };
  onLogout: () => void;
}

interface DashboardStats {
  totalSheep: number;
  healthyCount: number;
  sickCount: number;
  totalValue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalSheep: 0,
    healthyCount: 0,
    sickCount: 0,
    totalValue: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();

    // Set default tabs based on role
    if (user.role === 'veterinarian') {
      setActiveTab('health');
    } else if (user.role === 'staff') {
      setActiveTab('sheep');
    }
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load sheep statistics
      const { data: sheepData, error: sheepError } = await supabase
        .from('sheep')
        .select('health_status, estimated_value');
      
      if (sheepError) throw sheepError;

      // Load financial data for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data: salesData } = await supabase
        .from('sales_records')
        .select('amount, date')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);
      
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, date')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      // Calculate statistics
      const totalSheep = sheepData?.length || 0;
      const healthyCount = sheepData?.filter(sheep => sheep.health_status === 'healthy').length || 0;
      const sickCount = sheepData?.filter(sheep => sheep.health_status === 'sick').length || 0;
      const totalValue = sheepData?.reduce((sum, sheep) => sum + (sheep.estimated_value || 0), 0) || 0;
      
      const monthlyRevenue = salesData?.reduce((sum, record) => sum + record.amount, 0) || 0;
      const monthlyExpenses = expensesData?.reduce((sum, record) => sum + record.amount, 0) || 0;

      setStats({
        totalSheep,
        healthyCount,
        sickCount,
        totalValue,
        monthlyRevenue,
        monthlyExpenses
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMenuItems = () => {
    // Role-based menu items
    if (user.role === 'veterinarian') {
      return [{ id: 'health', label: 'Health Monitor', icon: Heart }];
    }

    if (user.role === 'staff') {
      return [
        { id: 'sheep', label: 'Flock Management', icon: Sheep },
        { id: 'health', label: 'Health Records', icon: Heart },
        { id: 'expenses', label: 'Expenses', icon: DollarSign }
      ];
    }

    // Admin gets full access
    if (user.role === 'admin') {
      return [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'sheep', label: 'Sheep Management', icon: Sheep },
        { id: 'health', label: 'Health Monitor', icon: Heart },
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'users', label: 'User Management', icon: Users }
      ];
    }

    // Default fallback (shouldn't reach here)
    return [{ id: 'sheep', label: 'Sheep Management', icon: Sheep }];
  };

  const hasAccess = (tabId: string): boolean => {
    const allowedTabs = getMenuItems().map(item => item.id);
    return allowedTabs.includes(tabId);
  };

  const handleTabChange = (tabId: string) => {
    if (hasAccess(tabId)) {
      setActiveTab(tabId);
      setSidebarOpen(false); // Auto-close mobile menu
    } else {
      // Redirect to default allowed tab with error message
      const defaultTab = getMenuItems()[0]?.id || 'sheep';
      setActiveTab(defaultTab);
      setSidebarOpen(false); // Auto-close mobile menu
      alert('Access denied: You do not have permission to view this section.');
    }
  };

  const renderContent = () => {
    // Double-check access before rendering
    if (!hasAccess(activeTab)) {
      return (
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-4">Access Denied</div>
          <div className="text-gray-600">You do not have permission to view this section.</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return user.role === 'admin' ? <OverviewTab stats={stats} user={user} /> : <AccessDenied />;
      case 'sheep':
        return <SheepManagementTab user={user} onStatsUpdate={loadDashboardStats} />;
      case 'health':
        return <HealthMonitor user={user} />;
      case 'finance':
        return user.role === 'admin' ? <FinanceTracker user={user} onUpdate={loadDashboardStats} /> : <AccessDenied />;
      case 'analytics':
        return user.role === 'admin' ? <FinancialCharts user={user} /> : <AccessDenied />;
      case 'expenses':
        return user.role === 'staff' ? <ExpenseTracker user={user} onUpdate={loadDashboardStats} /> : <AccessDenied />;
      case 'reports':
        return user.role === 'admin' ? <Reports user={user} /> : <AccessDenied />;
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : <div>Access Denied</div>;
      default:
        return <SheepManagementTab user={user} onStatsUpdate={loadDashboardStats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={onLogout}
            getMenuItems={getMenuItems}
            handleTabChange={handleTabChange}
            setSidebarOpen={setSidebarOpen}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-green-100 via-green-200 to-green-100"></div>
        <SidebarContent 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={onLogout}
          getMenuItems={getMenuItems}
          handleTabChange={handleTabChange}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="hidden md:block absolute left-64 top-0 bottom-0 w-px bg-gradient-to-b from-green-100 via-green-200 to-green-100 z-20"></div>
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 content-glass p-6">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Access Denied Component
const AccessDenied: React.FC = () => (
  <div className="text-center py-12">
    <div className="text-red-600 text-lg font-medium mb-4">Access Denied</div>
    <div className="text-gray-600">You do not have permission to view this section.</div>
  </div>
);

const SidebarContent: React.FC<{
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  getMenuItems: () => any[];
  handleTabChange: (tabId: string) => void;
  setSidebarOpen: (open: boolean) => void;
}> = ({ user, activeTab, onLogout, getMenuItems, handleTabChange }) => {
  const menuItems = getMenuItems();

  return (
    <div className="flex flex-col h-full sidebar-glass">
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-green-200/30">
        <Sheep className="h-8 w-8 text-blue-500 mr-3" />
        <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">SheepMS</span>
      </div>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="px-3 mb-6">
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-green-700 capitalize font-medium">{user.role}</p>
          </div>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`${
                activeTab === item.id
                  ? 'liquid-glass border-green-400 text-green-800'
                  : 'border-transparent text-gray-600 hover:liquid-glass hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md border-l-4 w-full text-left transition-colors`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-2">
          <button
            onClick={onLogout}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:liquid-glass hover:text-red-600 w-full text-left transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ stats: DashboardStats; user: any }> = ({ stats, user }) => {
  // Only admins should see financial overview
  if (user.role !== 'admin') {
    return <AccessDenied />;
  }

  const profit = stats.monthlyRevenue - stats.monthlyExpenses;
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user.name}</h1>
        <p className="mt-1 text-sm text-gray-600">Here's what's happening with your flock today.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="liquid-glass overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Sheep className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sheep</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalSheep}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Healthy</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.healthyCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Need Attention</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.sickCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Flock Value</dt>
                  <dd className="text-lg font-medium text-gray-900">Ksh {stats.totalValue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="liquid-glass shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Revenue</span>
              <span className="text-sm font-medium text-green-600">Ksh {stats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Expenses</span>
              <span className="text-sm font-medium text-red-600">Ksh {stats.monthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Net Profit</span>
                <span className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Ksh {profit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="liquid-glass shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Health Alerts</h3>
          <div className="space-y-3">
            {stats.sickCount > 0 ? (
              <div className="p-3 bg-red-50 rounded-md">
                <div className="flex">
                  <Heart className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      {stats.sickCount} sheep require immediate attention
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded-md">
                <div className="flex">
                  <Heart className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">All sheep are healthy!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SheepManagementTab: React.FC<{ user: any; onStatsUpdate: () => void }> = ({ user, onStatsUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSheep, setSelectedSheep] = useState(null);

  const handleSheepUpdate = () => {
    onStatsUpdate();
    setShowForm(false);
    setSelectedSheep(null);
  };

  const handleEditSheep = (sheep: any) => {
    setSelectedSheep(sheep);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sheep Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-400 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sheep
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <SheepForm 
            sheep={selectedSheep}
            onSubmit={handleSheepUpdate}
            onCancel={() => {
              setShowForm(false);
              setSelectedSheep(null);
            }}
          />
        </div>
      )}

      <SheepList user={user} onEdit={handleEditSheep} />
    </div>
  );
};

export default Dashboard;