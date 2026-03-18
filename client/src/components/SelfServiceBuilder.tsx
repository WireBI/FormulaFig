'use client';

import React, { useState, useEffect } from 'react';
import ReportDataGrid from './ReportDataGrid';
import { Database, Filter, Loader2, Play, Download, Lock, Sparkles, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABLES = [
  'mbo_appointments',
  'mbo_sale_items',
  'mbo_sales',
  'mbo_client_services',
  'mbo_sale_contracts'
];

const DIMENSION_OPTIONS: Record<string, string[]> = {
  mbo_appointments: ['status', 'staff_id', 'location_id', 'service_name', 'gender_preference'],
  mbo_sale_items: ['location_id', 'category_id', 'returned', 'is_service', 'item_id'],
  mbo_sales: ['client_id', 'staff_id', 'currency'],
  mbo_client_services: ['name', 'activation_type', 'program_name', 'current'],
  mbo_sale_contracts: ['name', 'autopay_trigger_type', 'autopay_enabled']
};

export default function SelfServiceBuilder() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  const [table, setTable] = useState('mbo_sales');
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState([{ column: 'total_amount', agg: 'SUM' as any }]);

  useEffect(() => {
    setToken(localStorage.getItem('google_token'));
  }, []);

  const handleRunQuery = async () => {
    if (!table || dimensions.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/reports/self-service`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tableName: table,
          dimensions,
          metrics
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message);

      setData(result.data);
      if (result.data.length > 0) {
        setColumns(Object.keys(result.data[0]));
      } else {
        setColumns([]);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Query Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
      if (data.length === 0) return;
      const csvContent = [
          columns.join(','),
          ...data.map(row => columns.map(header => JSON.stringify(row[header] ?? '')).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `self_service_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const toggleDimension = (dim: string) => {
    setDimensions(prev => 
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} className="text-blue-500" />
        </div>

        <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 shadow-inner">
              <Table size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Query Builder</h2>
              <p className="text-sm text-slate-400 font-medium">Configure dimensions and metrics for analysis</p>
            </div>
          </div>
          <div className="hidden md:block">
             <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 text-xs font-bold uppercase tracking-widest">
               <Lock size={14} /> Security Protocol Active
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table Selection */}
          <div className="space-y-4 lg:col-span-4">
            <div className="flex items-center gap-2">
                <Database size={14} className="text-slate-500" />
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Source Dataset</label>
            </div>
            <select 
              value={table}
              onChange={(e) => {
                setTable(e.target.value);
                setDimensions([]); 
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Dimensions Selection */}
          <div className="space-y-4 lg:col-span-8">
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Dimensions (Group By)</label>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {(DIMENSION_OPTIONS[table] || []).map(dim => (
                <button
                  key={dim}
                  onClick={() => toggleDimension(dim)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-bold transition-all border",
                    dimensions.includes(dim) 
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/5' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  )}
                >
                  {dim}
                </button>
              ))}
            </div>
            {dimensions.length === 0 && (
               <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-widest px-1">At least one dimension is required</p>
            )}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-xs font-medium text-slate-400">
                    <span className="text-slate-600 uppercase tracking-widest font-bold">Aggregate:</span>
                    <span className="text-white bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-blue-400">{metrics[0].agg}({metrics[0].column})</span>
                </div>
            </div>
          
            <div className="flex gap-4 w-full sm:w-auto">
                <button
                    onClick={handleExport}
                    disabled={data.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl text-sm font-bold transition-all disabled:opacity-30 border border-slate-700/50"
                >
                    <Download size={18} />
                    CSV
                </button>
                <button
                    onClick={handleRunQuery}
                    disabled={loading || dimensions.length === 0 || !token}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:shadow-none relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                    <span>Execute Analysis</span>
                </button>
            </div>
        </div>
      </div>

      {/* Results Component */}
      <div className={cn("transition-all duration-500", !data.length && "opacity-50 grayscale")}>
        <ReportDataGrid data={data} columns={columns} />
      </div>
    </div>
  );
}

