import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { UserProvider } from '@/contexts/user-context';

/**
 * App Shell Layout (doc 08, Layout B).
 * Sidebar (desktop) + Topbar + Main content area.
 */
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="relative flex h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
    </UserProvider>
  );
}
