'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('google_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuth(true);
    }
  }, [router]);

  if (!isAuth) return null;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.1),transparent_50%)] overflow-hidden">
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Reports & Insights
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Connection</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
