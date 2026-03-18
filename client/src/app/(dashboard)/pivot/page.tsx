'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Download, RefreshCw, BarChart3, Database, Filter } from 'lucide-react';

// We import the CSS for react-pivottable
import 'react-pivottable/pivottable.css';

// Client-only wrapper for the Pivot Table to avoid SSR issues with Plotly/DOM
const PivotTableUI = dynamic(() => import('react-pivottable/PivotTableUI'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <span className="font-bold text-lg tracking-tight text-slate-300">Initializing Analysis Engine...</span>
    </div>
  )
});

export default function PivotPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pivotState, setPivotState] = useState<any>({
    rows: ['category', 'description'],
    cols: ['year_month'],
    vals: ['amount'],
    aggregatorName: 'Sum',
    rendererName: 'Table',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('google_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/reports/pivot-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        // Convert quantity and amount to numbers to ensure correct aggregation
        const formattedData = result.map((row: any) => ({
            ...row,
            quantity: Number(row.quantity),
            amount: Number(row.amount),
            // is_service is already formatted as "True"/"False" in SQL
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    if (data.length === 0) return;
    const columns = Object.keys(data[0]);
    const csvContent = [
      columns.join(','),
      ...data.map(row => columns.map(header => JSON.stringify(row[header] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pivot_data_summary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <BarChart3 size={24} />
             </div>
             <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Pivot Analysis</h1>
          </div>
          <p className="text-slate-400 font-medium ml-11">Multi-dimensional exploration of aggregated sales history</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
          <button
            onClick={handleExport}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Analysis Container */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden min-h-[700px] group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <Database size={160} className="text-blue-500" />
        </div>

        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm z-10">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
               <Loader2 size={64} className="text-blue-500 animate-spin relative" />
            </div>
            <p className="text-white font-black text-2xl tracking-tighter">PREPARING DATA CUBE</p>
            <p className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-[0.3em]">Crunching 300,000+ line items into optimized summaries</p>
          </div>
        ) : (
          <div className="pivot-container relative">
             <style>{`
                .pivot-container .pvtUI { width: 100%; border-collapse: collapse; color: #94a3b8; font-size: 13px; font-weight: 500; }
                .pivot-container .pvtAxisContainer, .pivot-container .pvtVals { 
                    background: rgba(15, 23, 42, 0.6) !important; 
                    border: 1px solid rgba(51, 65, 85, 0.4) !important;
                    padding: 16px !important;
                    border-radius: 20px !important;
                    margin-bottom: 8px !important;
                }
                .pivot-container .pvtAttr { 
                    background: linear-gradient(135deg, #1e293b, #0f172a) !important; 
                    color: #f8fafc !important; 
                    border-radius: 10px !important;
                    padding: 8px 16px !important;
                    margin: 4px !important;
                    border: 1px solid rgba(59, 130, 246, 0.3) !important;
                    font-weight: 700 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                }
                .pivot-container .pvtCheckContainer { background: #020617 !important; color: #94a3b8 !important; border-radius: 12px; padding: 12px !important; border: 1px solid #1e293b !important; }
                .pivot-container select { 
                    background: #020617 !important; 
                    color: #f8fafc !important; 
                    border: 1px solid #1e293b !important;
                    border-radius: 10px !important;
                    padding: 6px 12px !important;
                    outline: none !important;
                    font-weight: 600 !important;
                }
                .pivot-container .pvtTable { color: #f1f5f9 !important; width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; margin-top: 32px !important; border-radius: 16px !important; overflow: hidden !important; }
                .pivot-container .pvtTable thead tr th, .pivot-container .pvtTable tbody tr th { 
                    background: rgba(30, 41, 59, 0.95) !important; 
                    color: #64748b !important; 
                    border: 1px solid rgba(51, 65, 85, 0.3) !important;
                    padding: 14px 20px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    font-size: 10px !important;
                }
                .pivot-container .pvtTable tbody tr td { 
                    background: rgba(15, 23, 42, 0.3) !important; 
                    color: #f8fafc !important; 
                    border: 1px solid rgba(51, 65, 85, 0.2) !important;
                    padding: 14px 20px !important;
                    text-align: right !important;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
                    font-size: 12px !important;
                }
                .pivot-container .pvtTotal, .pivot-container .pvtGrandTotal { font-weight: 900; background: rgba(30, 41, 59, 0.9) !important; color: #3b82f6 !important; }
                .pivot-container .pvtRowLabel { text-align: left !important; color: #94a3b8 !important; background: rgba(30, 41, 59, 0.4) !important; }
             `}</style>
             <PivotTableUI
                data={data}
                onChange={(s: any) => setPivotState(s)}
                {...pivotState}
             />
          </div>
        )}
      </div>

      {/* Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Filter size={20} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Strategy</p>
                <p className="text-sm font-semibold text-slate-300">Option 2: Summary Aggregation</p>
            </div>
        </div>
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Database size={20} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dataset Rows</p>
                <p className="text-sm font-semibold text-slate-300">~15,000 Grouped blocks</p>
            </div>
        </div>
      </div>
    </div>
  );
}
