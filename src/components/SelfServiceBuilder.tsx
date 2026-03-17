'use client';

import React, { useState } from 'react';
import ReportDataGrid from './ReportDataGrid';
import { Database, Filter, Loader2, Play, Download } from 'lucide-react';

const TABLES = [
  'mbo_appointments',
  'mbo_sale_items',
  'mbo_sales',
  'mbo_client_services',
  'mbo_sale_contracts'
];

// Simplified mapping for demonstration. Real implementation would derive this dynamically.
const DIMENSION_OPTIONS: Record<string, string[]> = {
  mbo_appointments: ['status', 'staff_id', 'location_id', 'service_name', 'gender_preference'],
  mbo_sale_items: ['location_id', 'category_id', 'returned', 'is_service', 'item_id'],
  mbo_sales: ['client_id', 'staff_id', 'currency'],
  mbo_client_services: ['name', 'activation_type', 'program_name', 'current'],
  mbo_sale_contracts: ['name', 'autopay_trigger_type', 'autopay_enabled']
};

export default function SelfServiceBuilder() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  const [table, setTable] = useState('mbo_sales');
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState([{ column: 'total_amount', agg: 'SUM' as any }]);

  const handleRunQuery = async () => {
    if (!table || dimensions.length === 0) {
      alert("Please select at least one Dimension to Group By.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reports/self-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800/50">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Filter size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Query Configuration</h2>
            <p className="text-sm text-slate-400">Build custom reports from the analytics schema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Table Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Source Table</label>
            <select 
              value={table}
              onChange={(e) => {
                setTable(e.target.value);
                setDimensions([]); // Reset on table change
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
            >
              {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Dimensions Selection */}
          <div className="space-y-3 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dimensions (Group By)</label>
            <div className="flex flex-wrap gap-2">
              {(DIMENSION_OPTIONS[table] || []).map(dim => (
                <button
                  key={dim}
                  onClick={() => toggleDimension(dim)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                    dimensions.includes(dim) 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
            {dimensions.length === 0 && (
               <p className="text-xs text-rose-400/80 mt-1">Please select at least one dimension.</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300">
                    <Database size={16} className="text-slate-500" />
                    Metric:
                    <span className="font-medium text-white">{metrics[0].agg}({metrics[0].column})</span>
                </div>
            </div>
          
            <div className="flex gap-3">
                <button
                    onClick={handleExport}
                    disabled={data.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 border border-slate-700"
                >
                    <Download size={18} />
                    Export CSV
                </button>
                <button
                    onClick={handleRunQuery}
                    disabled={loading || dimensions.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                    Execute Query
                </button>
            </div>
        </div>
      </div>

      {/* Results Component */}
      <ReportDataGrid data={data} columns={columns} />
    </div>
  );
}
