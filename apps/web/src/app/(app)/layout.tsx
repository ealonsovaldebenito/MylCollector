import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { UserProvider } from '@/contexts/user-context';

/**
 * App Shell Layout (doc 08, Layout B).
 * Sidebar (desktop) + Topbar + Main content area.
 *
 * Changelog:
 *   2026-02-17 — Visual v2: animated blobs, responsive padding, page-enter transition
 */
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="relative flex h-screen bg-background">
        {/* Ambient glow effects — slow moving blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
          <div className="animate-blob absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-accent/8 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <Sidebar />
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto p-5 lg:p-8">
            <div className="animate-page-enter">{children}</div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
