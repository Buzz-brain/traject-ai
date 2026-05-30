import { Radio, MapPin, Database, Cpu, ChevronRight, Globe, Sun, Moon } from 'lucide-react';

interface Props {
  onStart: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const FEATURES = [
  {
    icon: <MapPin size={18} className="text-emerald-400" />,
    title: 'Live GPS Tracking',
    desc: 'High-accuracy location sampling every 1s or 5m movement',
  },
  {
    icon: <Database size={18} className="text-sky-400" />,
    title: 'Offline-First Storage',
    desc: 'Data saved locally, then synced to secure cloud storage',
  },
  {
    icon: <Cpu size={18} className="text-amber-400" />,
    title: 'AI Training Ready',
    desc: 'Structured JSON format for LSTM trajectory prediction models',
  },
  {
    icon: <Globe size={18} className="text-rose-400" />,
    title: 'Made for Nigeria',
    desc: 'Optimized for Nigerian roads, cities & movement patterns',
  },
];

export function Home({ onStart, isDark, onToggleTheme }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Radio size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white">Naija GPS Collector</span>
        </div>
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl
            glass-card border border-white/30 dark:border-white/10 transition-all duration-200
            hover:scale-105"
        >
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center gap-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Open Data Initiative · Nigeria
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white leading-tight">
            Map Nigeria,<br />
            <span className="text-emerald-500">Train AI</span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Contribute GPS movement data from your daily commute, walks, and drives across Nigeria.
            Every trajectory helps build smarter AI models for mobility prediction.
          </p>
        </div>

        <button
          onClick={onStart}
          className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400
            text-white font-bold text-base px-8 py-4 rounded-2xl
            shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60
            transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <MapPin size={20} />
          Start Collecting Data
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Stats strip */}
        <div className="flex gap-6 text-center">
          {[
            { n: '1s', label: 'Sample Rate' },
            { n: '5m', label: 'Min Distance' },
            { n: '6+', label: 'Data Fields' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black text-emerald-500">{s.n}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-10 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-4 flex gap-3 items-start">
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white">{f.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
