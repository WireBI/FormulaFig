'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  UserPlus, 
  CreditCard, 
  DollarSign, 
  UserCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Metric {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  icon: any;
  color: string;
}

export default function FigBarPerformance() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'wtd' | 'mtd'>('daily');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('google_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/locations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setLocations(result);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('google_token');
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/reports/fig-bar-performance`);
        if (selectedLocation) url.searchParams.append('locationId', selectedLocation);
        
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-slate-400 font-medium">Loading Performance Data...</span>
        </div>
      </div>
    );
  }

  const currentData = data?.[period] || {};

  const metrics: Metric[] = [
    {
      label: 'Gross Revenue',
      value: `$${currentData.revenue?.toLocaleString()}`,
      subValue: `Target: $${currentData.targets?.revenue?.toLocaleString()}`,
      trend: 12.5,
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Unique Guests',
      value: currentData.uniqueGuests || 0,
      subValue: `${currentData.newGuests || 0} New Guests`,
      trend: 8.2,
      icon: Users,
      color: 'emerald'
    },
    {
      label: 'Active Members',
      value: currentData.activeMembers || 0,
      subValue: '+3 this period',
      trend: 4.1,
      icon: UserCheck,
      color: 'indigo'
    },
    {
      label: 'AOV',
      value: `$${Math.round(currentData.aov || 0)}`,
      subValue: 'per guest',
      trend: -2.4,
      icon: TrendingUp,
      color: 'violet'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fig Bar Performance</h1>
          <div className="flex items-center gap-3 text-slate-400 font-medium">
             <Calendar size={14} className="text-blue-400" />
             <span>Showing data for: <b className="text-slate-200">{data?.metadata?.last_date || '...'}</b></span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 min-w-[200px]">
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Filter size={16} />
             </div>
             <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-200 focus:ring-0 cursor-pointer w-full pr-8"
             >
                <option value="">All Locations</option>
                {locations.map(loc => (
                   <option key={loc.location_id} value={loc.location_id} className="bg-slate-900">{loc.name}</option>
                ))}
             </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50">
            {(['daily', 'wtd', 'mtd'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  period === p 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl hover:border-slate-700/50 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${metric.color}-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-${metric.color}-500/10 transition-all`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${metric.color}-500/10 border border-${metric.color}-500/20 text-${metric.color}-400`}>
                <metric.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${metric.trend && metric.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metric.trend && metric.trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(metric.trend || 0)}%
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{metric.value}</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">{metric.subValue}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Metrics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Revenue Split</h3>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Memberships</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Treatments</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /> Products</div>
            </div>
          </div>
          
          <div className="h-6 w-full flex rounded-full overflow-hidden bg-slate-800/30">
            <div 
              className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-1000" 
              style={{ width: `${(currentData.revenueByType?.memberships / currentData.revenue) * 100 || 0}%` }} 
            />
            <div 
              className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-1000" 
              style={{ width: `${(currentData.revenueByType?.treatments / currentData.revenue) * 100 || 0}%` }} 
            />
            <div 
              className="h-full bg-slate-700 transition-all duration-1000" 
              style={{ width: `${(currentData.revenueByType?.products / currentData.revenue) * 100 || 0}%` }} 
            />
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Memberships</p>
              <h4 className="text-xl font-bold text-white">${currentData.revenueByType?.memberships?.toLocaleString()}</h4>
              <p className="text-xs text-emerald-400 font-bold mt-1">+{Math.round((currentData.revenueByType?.memberships / currentData.revenue) * 100 || 0)}% Share</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Treatments</p>
              <h4 className="text-xl font-bold text-white">${currentData.revenueByType?.treatments?.toLocaleString()}</h4>
              <p className="text-xs text-blue-400 font-bold mt-1">+{Math.round((currentData.revenueByType?.treatments / currentData.revenue) * 100 || 0)}% Share</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Products</p>
              <h4 className="text-xl font-bold text-white">${currentData.revenueByType?.products?.toLocaleString()}</h4>
              <p className="text-xs text-indigo-400 font-bold mt-1">+{Math.round((currentData.revenueByType?.products / currentData.revenue) * 100 || 0)}% Share</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl flex flex-col justify-between">
           <div>
              <h3 className="text-lg font-bold text-white mb-6">Operations</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-slate-400 font-medium">Labor % of Revenue</span>
                       <span className="text-white font-bold">{currentData.laborPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${currentData.laborPercent}%` }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-slate-400 font-medium">Booking Conversion</span>
                       <span className="text-white font-bold">{Math.round(currentData.bookingConversionRate)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentData.bookingConversionRate}%` }} />
                    </div>
                 </div>
              </div>
           </div>

           <div className="pt-8 border-t border-slate-800 mt-8">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Estimated EBITDA</p>
              <div className="flex items-end gap-3">
                 <h4 className="text-3xl font-bold text-white">${Math.round(currentData.ebitda || 0).toLocaleString()}</h4>
                 <div className="mb-1 text-xs font-bold text-emerald-400">+2.5%</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
