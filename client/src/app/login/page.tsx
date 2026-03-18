'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      localStorage.setItem('google_token', credentialResponse.credential);
      router.push('/reports/self-service');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-950">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 relative z-10 shadow-2xl overflow-hidden"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center font-bold text-3xl text-white mx-auto mb-6 shadow-lg shadow-blue-500/20"
          >
            FF
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Formula Fig</h1>
          <p className="text-slate-400 text-lg">Self-Service Data Explorer</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.error('Login Failed')}
              useOneTap
              theme="filled_black"
              shape="pill"
              text="continue_with"
            />
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-400">Authorized Personnel Only</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
              Secure access for @formulafig.com and @wirebi.com domains.
            </p>
          </div>
        </div>

        {/* Subtle bottom logo/text */}
        <div className="mt-10 text-center">
          <span className="text-slate-600 text-[10px] font-medium tracking-widest uppercase">Powered by WireBI Core</span>
        </div>
      </motion.div>
    </div>
  );
}
