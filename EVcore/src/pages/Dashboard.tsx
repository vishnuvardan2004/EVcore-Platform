
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Zap } from 'lucide-react';

interface SubPlatform {
  id: string;
  title: string;
  description: string;
  route: string;
  isActive: boolean;
  featureId: string;
  gradient: string;
  icon: string;
  category: 'core' | 'analytics' | 'operations' | 'management';
  stats?: { label: string; value: string; trend: string };
}

const subPlatforms: SubPlatform[] = [
  {
    id: 'vehicle-tracker',
    title: 'Vehicle Deployment',
    description: 'Real-time fleet tracking and deployment management',
    route: '/vehicle-tracker',
    isActive: true,
    featureId: 'vehicle-deployment',
    gradient: 'from-blue-600 via-blue-500 to-cyan-400',
    icon: '🚗',
    category: 'core',
    stats: { label: 'Active Vehicles', value: '24', trend: '+12%' }
  },
  {
    id: 'offline-bookings',
    title: 'Smart Bookings',
    description: 'Intelligent booking system with offline capabilities',
    route: '/offline-bookings',
    isActive: true,
    featureId: 'offline-bookings',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    icon: '📱',
    category: 'core',
    stats: { label: 'Daily Bookings', value: '156', trend: '+8%' }
  },
  {
    id: 'database',
    title: 'Data Hub',
    description: 'Centralized data management and analytics platform',
    route: '/database',
    isActive: true,
    featureId: 'database-management',
    gradient: 'from-purple-600 via-purple-500 to-indigo-400',
    icon: '🗃️',
    category: 'management',
    stats: { label: 'Records', value: '2.4K', trend: '+15%' }
  },
  {
    id: 'driver-induction',
    title: 'Driver Onboarding',
    description: 'Streamlined driver registration and verification',
    route: '/driver-induction',
    isActive: true,
    featureId: 'driver-induction',
    gradient: 'from-orange-600 via-orange-500 to-yellow-400',
    icon: '👤',
    category: 'management',
    stats: { label: 'New Drivers', value: '12', trend: '+3%' }
  },
  {
    id: 'trip-details',
    title: 'Trip Analytics',
    description: 'Comprehensive trip monitoring and performance insights',
    route: '/trip-details',
    isActive: true,
    featureId: 'trip-details',
    gradient: 'from-pink-600 via-pink-500 to-rose-400',
    icon: '📊',
    category: 'analytics',
    stats: { label: 'Trips Today', value: '89', trend: '+22%' }
  },
  {
    id: 'charging-tracker',
    title: 'Energy Management',
    description: 'Advanced charging optimization and energy monitoring',
    route: '/charging-tracker',
    isActive: true,
    featureId: 'charging-tracker',
    gradient: 'from-green-600 via-green-500 to-lime-400',
    icon: '⚡',
    category: 'operations',
    stats: { label: 'Charging Ports', value: '16', trend: '+5%' }
  },
  {
    id: 'attendance',
    title: 'Workforce',
    description: 'Smart attendance and workforce management',
    route: '/attendance',
    isActive: false,
    featureId: 'attendance',
    gradient: 'from-slate-600 via-slate-500 to-gray-400',
    icon: '🕒',
    category: 'management',
    stats: { label: 'Present Today', value: '47', trend: '92%' }
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { canAccessFeature, user } = useRoleAccess();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter platforms based on user role and permissions
  const accessiblePlatforms = useMemo(() => {
    return subPlatforms.filter(platform => 
      canAccessFeature(platform.featureId) && platform.isActive
    );
  }, [canAccessFeature]);

  const handleCardClick = (platform: SubPlatform) => {
    if (platform.isActive && canAccessFeature(platform.featureId)) {
      navigate(platform.route);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Dynamic grid background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
        </div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Logo and Branding */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-3xl p-2 shadow-2xl">
                <Zap className="w-24 h-24 text-green-400 mb-2" fill="currentColor" stroke="none" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-7xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
                EVZIP
              </h1>
              <div className="text-2xl text-blue-400 font-bold tracking-wider">EVCORE Platform</div>
            </div>
          </div>

          {/* Live Status Bar */}
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold">System Online</span>
                </div>
                <div className="text-gray-300">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                {user && (
                  <div className="text-blue-400 font-medium">
                    Welcome, {user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{accessiblePlatforms.length} Active Modules</span>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <span>Real-time Sync</span>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {accessiblePlatforms.map((platform, index) => (
            <div
              key={platform.id}
              className="group relative transform hover:scale-105 transition-all duration-500 cursor-pointer"
              onClick={() => handleCardClick(platform)}
            >
              {/* Card glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${platform.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
              
              <Card className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 rounded-3xl overflow-hidden shadow-2xl h-full">
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Status indicator */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">ACTIVE</span>
                </div>

                <CardContent className="relative z-10 p-8 h-full flex flex-col">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {platform.icon}
                    </div>
                    <div className={`w-16 h-1 bg-gradient-to-r ${platform.gradient} rounded-full`}></div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                      {platform.title}
                    </h3>
                    <p className="text-gray-400 text-base leading-relaxed mb-6">
                      {platform.description}
                    </p>
                  </div>

                  {/* Stats */}
                  {platform.stats && (
                    <div className="bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-400">{platform.stats.label}</div>
                          <div className="text-2xl font-bold text-white">{platform.stats.value}</div>
                        </div>
                        <div className="text-green-400 text-sm font-medium">
                          {platform.stats.trend}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <div className={`bg-gradient-to-r ${platform.gradient} p-0.5 rounded-2xl group-hover:shadow-lg transition-all duration-300`}>
                    <div className="bg-gray-900 rounded-2xl px-6 py-3 flex items-center justify-between group-hover:bg-gray-800 transition-colors duration-300">
                      <span className="text-white font-medium">Launch Module</span>
                      <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-3xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                2.4K+
              </div>
              <div className="text-gray-400">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-gray-400">System Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent mb-2">
                156
              </div>
              <div className="text-gray-400">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
