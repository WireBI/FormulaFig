import SelfServiceBuilder from '@/components/SelfServiceBuilder';

export default function SelfServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Platform</h1>
          <p className="mt-2 text-slate-400">
            Self-Service Data Exploration for Formula Fig.
          </p>
        </div>

        <SelfServiceBuilder />
      </div>
    </div>
  );
}
