import { useState } from 'react';
import { Home } from './pages/Home';
import { Tracker } from './pages/Tracker';
import { useTheme } from './hooks/useTheme';

type Page = 'home' | 'tracker';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {page === 'home' ? (
        <Home
          onStart={() => setPage('tracker')}
          isDark={isDark}
          onToggleTheme={toggle}
        />
      ) : (
        <Tracker
          isDark={isDark}
          onToggleTheme={toggle}
          onBack={() => setPage('home')}
        />
      )}
    </div>
  );
}
