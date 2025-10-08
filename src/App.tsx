import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'farmer' | 'vet' | 'staff';
  name: string;
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          setUser({
            id: user.id,
            email: user.email!,
            role: profile.role,
            name: profile.full_name
          });
          setCurrentView('dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // If Supabase is not configured, stay on landing page
      setCurrentView('landing');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (user: User) => {
    setUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('landing');
  };

  const showAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setCurrentView('auth');
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
      <PWAInstallPrompt />
      {currentView === 'landing' && (
        <LandingPage onShowAuth={showAuth} />
      )}
      {currentView === 'auth' && (
        <AuthForm 
          mode={authMode} 
          onAuth={handleAuth}
          onBack={() => setCurrentView('landing')}
        />
      )}
      {currentView === 'dashboard' && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;