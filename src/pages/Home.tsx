import { Zap, MapPin, Database, Cpu, ChevronRight, BarChart3, Sun, Moon } from 'lucide-react';

interface Props {
  onStart: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const FEATURES = [
  {
    icon: <Zap size={18} className="text-purple-400" />,
    title: 'Hybrid GPS + AI Tracking',
    desc: 'Seamlessly switches to AI predictions when GPS signal is lost, never losing your position',
  },
  {
    icon: <Cpu size={18} className="text-blue-400" />,
    title: 'On-Device AI Inference',
    desc: 'LSTM model runs in your browser—no cloud, no internet needed, completely private',
  },
  {
    icon: <Database size={18} className="text-sky-400" />,
    title: 'Local Data Storage',
    desc: 'All trajectories and analytics saved locally on your device, you have full control',
  },
  {
    icon: <BarChart3 size={18} className="text-emerald-400" />,
    title: 'Hybrid System Insights',
    desc: 'View real-time statistics on GPS vs AI-predicted points to evaluate system effectiveness',
  },
];

export function Home({ onStart, isDark, onToggleTheme }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white">TrajectAI</span>
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
        <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs font-semibold px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          AI-Powered Hybrid Tracking
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white leading-tight">
            Never Lose<br />
            <span className="text-purple-500">Your Position</span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Track your movement in real-time with GPS. When signal is lost, AI takes over seamlessly.
            All powered on-device, completely private, no cloud required.
          </p>
        </div>

        <button
          onClick={onStart}
          className="group flex items-center gap-3 bg-purple-500 hover:bg-purple-400
            text-white font-bold text-base px-8 py-4 rounded-2xl
            shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60
            transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Zap size={20} />
          Start Hybrid Tracking
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Stats strip */}
        <div className="flex gap-6 text-center">
          {[
            { n: 'GPS', label: 'Primary Source' },
            { n: 'AI', label: 'Backup Mode' },
            { n: '100%', label: 'Private' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black text-purple-500">{s.n}</div>
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
