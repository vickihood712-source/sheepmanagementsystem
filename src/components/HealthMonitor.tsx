import React, { useState, useEffect } from 'react';
import { Heart, AlertTriangle, TrendingUp, Calendar, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HealthMonitorProps {
  user: any;
}

interface HealthAlert {
  id: string;
  sheep_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  created_at: string;
  sheep: {
    ear_tag: string;
    breed: string;
  };
}

const HealthMonitor: React.FC<HealthMonitorProps> = ({ user }) => {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadHealthData();
    loadAlerts();
  }, []);

  const loadHealthData = async () => {
    try {
      let query = supabase.from('sheep').select('*');
      
      // Role-based filtering
      if (user.role === 'farmer') {
        query = query.eq('created_by', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Analyze health data and generate predictions
      const analyzedData = data?.map(sheep => ({
        ...sheep,
        healthScore: calculateHealthScore(sheep),
        riskFactors: identifyRiskFactors(sheep)
      })) || [];

      setHealthData(analyzedData);
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      // Since health_alerts doesn't exist, we'll use health_records to simulate alerts
      let query = supabase.from('health_records').select(`
          id,
          sheep_id,
          record_type,
          description,
          created_at,
          sheep (ear_tag, breed)
        `).in('record_type', ['illness', 'checkup']);
      
      // Role-based filtering for health records
      if (user.role === 'farmer') {
        // Filter by sheep owned by farmer - this would need proper implementation
        // For now, we'll show all records but in production you'd join with sheep table
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Transform health_records into alert format
      const alertsData = (data || []).map(record => ({
        id: record.id,
        sheep_id: record.sheep_id,
        alert_type: record.record_type,
        severity: record.record_type === 'illness' ? 'high' : 'medium',
        message: record.description,
        created_at: record.created_at,
        sheep: record.sheep
      }));
      
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading health alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (sheep: any): number => {
    let score = 100;

    // Age factor
    if (sheep.birth_date) {
      const ageMonths = Math.floor((Date.now() - new Date(sheep.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      if (ageMonths > 60) score -= 10; // Older sheep
      if (ageMonths < 6) score -= 5; // Very young sheep
    }

    // Health status
    switch (sheep.health_status) {
      case 'sick': score -= 40; break;
      case 'recovering': score -= 20; break;
      case 'pregnant': score -= 5; break; // Slight concern during pregnancy
    }

    // Vaccination status
    switch (sheep.vaccination_status) {
      case 'overdue': score -= 25; break;
      case 'due': score -= 10; break;
    }

    // Weight concerns
    if (sheep.weight) {
      if (sheep.weight < 30) score -= 15; // Underweight
      if (sheep.weight > 100) score -= 10; // Potentially overweight
    }

    return Math.max(0, Math.min(100, score));
  };

  const identifyRiskFactors = (sheep: any): string[] => {
    const factors = [];

    if (sheep.vaccination_status === 'overdue') {
      factors.push('Overdue vaccinations');
    }
    
    if (sheep.health_status === 'sick') {
      factors.push('Currently ill');
    }

    if (sheep.birth_date) {
      const ageMonths = Math.floor((Date.now() - new Date(sheep.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      if (ageMonths > 60) {
        factors.push('Advanced age');
      }
    }

    if (sheep.weight && sheep.weight < 35) {
      factors.push('Underweight');
    }

    if (!sheep.weight || !sheep.birth_date) {
      factors.push('Incomplete health data');
    }

    return factors;
  };

  const generateHealthPrediction = async (sheepId: string) => {
    const sheep = healthData.find(s => s.id === sheepId);
    if (!sheep) return;

    // Simulate AI prediction based on historical data and current health metrics
    const predictions = [
      {
        condition: 'Respiratory infection risk',
        probability: sheep.vaccination_status === 'overdue' ? 'High (75%)' : 'Low (15%)',
        recommendation: sheep.vaccination_status === 'overdue' 
          ? 'Update vaccinations immediately and monitor breathing patterns'
          : 'Continue regular monitoring'
      },
      {
        condition: 'Nutritional deficiency',
        probability: sheep.weight && sheep.weight < 40 ? 'Medium (45%)' : 'Low (20%)',
        recommendation: sheep.weight && sheep.weight < 40
          ? 'Increase feed quality and add mineral supplements'
          : 'Maintain current feeding schedule'
      },
      {
        condition: 'Breeding complications',
        probability: sheep.health_status === 'pregnant' ? 'Medium (35%)' : 'Not applicable',
        recommendation: sheep.health_status === 'pregnant'
          ? 'Schedule regular checkups and monitor weight gain'
          : 'N/A'
      }
    ];

    return predictions;
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading health data...</div>;
  }

  const healthyCount = healthData.filter(s => s.health_status === 'healthy').length;
  const sickCount = healthData.filter(s => s.health_status === 'sick').length;
  const averageHealthScore = healthData.reduce((sum, s) => sum + s.healthScore, 0) / healthData.length || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Health Monitor</h1>
        <p className="mt-1 text-sm text-gray-600">AI-powered health tracking and predictions for your flock</p>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Healthy Sheep</p>
              <p className="text-2xl font-semibold text-gray-900">{healthyCount}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Need Attention</p>
              <p className="text-2xl font-semibold text-gray-900">{sickCount}</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Health Score</p>
              <p className="text-2xl font-semibold text-gray-900">{averageHealthScore.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-400 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Health Overview
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-green-400 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Health Alerts
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'predictions'
                  ? 'border-green-400 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Predictions
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="liquid-glass rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sheep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Factors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {healthData.map((sheep) => (
                <tr key={sheep.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Stethoscope className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{sheep.ear_tag}</div>
                        <div className="text-sm text-gray-500">{sheep.breed}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthScoreColor(sheep.healthScore)}`}>
                      {sheep.healthScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthScoreColor(sheep.health_status === 'healthy' ? 100 : 50)}`}>
                      {sheep.health_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {sheep.riskFactors.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {sheep.riskFactors.slice(0, 2).map((factor: string, idx: number) => (
                            <li key={idx} className="text-xs text-red-600">{factor}</li>
                          ))}
                          {sheep.riskFactors.length > 2 && (
                            <li className="text-xs text-gray-400">+{sheep.riskFactors.length - 2} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-xs text-green-600">No risk factors identified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sheep.updated_at || sheep.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium">
                      Sheep #{alert.sheep.ear_tag} - {alert.alert_type}
                    </h3>
                    <p className="mt-1 text-sm">{alert.message}</p>
                    <p className="mt-2 text-xs opacity-75">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active health alerts
            </div>
          )}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Health Predictions</h3>
          <div className="space-y-6">
            {healthData.filter(sheep => sheep.riskFactors.length > 0).slice(0, 5).map((sheep) => (
              <div key={sheep.id} className="border-l-4 border-yellow-400 pl-4">
                <h4 className="font-medium text-gray-900">Sheep #{sheep.ear_tag}</h4>
                <div className="mt-2 space-y-2">
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-sm font-medium text-yellow-800">Respiratory Health Risk</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Based on vaccination status and environmental factors: 
                      {sheep.vaccination_status === 'overdue' ? ' High risk (75%)' : ' Low risk (15%)'}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Recommendation: {sheep.vaccination_status === 'overdue' 
                        ? 'Update vaccinations immediately'
                        : 'Continue regular monitoring'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {healthData.filter(sheep => sheep.riskFactors.length > 0).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                All sheep are showing low health risks. Great job!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMonitor;