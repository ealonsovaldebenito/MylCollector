'use client';

export function AuthBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-50">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-amber-50" />

      {/* Subtle geometric shapes */}
      <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf610_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf610_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
  );
}
