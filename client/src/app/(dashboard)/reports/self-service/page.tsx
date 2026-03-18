import SelfServiceBuilder from '@/components/SelfServiceBuilder';

export default function SelfServicePage() {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics Platform</h1>
        <p className="mt-1 text-slate-400 font-medium">
          Self-Service Data Exploration for Formula Fig.
        </p>
      </div>

      <SelfServiceBuilder />
    </div>
  );
}
