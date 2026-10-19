import { LoaderCircle } from 'lucide-react';

export function TeacherPageLoading({ label = 'Sayfa yükleniyor…' }: { label?: string }) {
  return (
    <section aria-label={label} aria-busy="true" className="min-w-0 space-y-6">
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-800">
        <span aria-hidden="true" className="motion-safe:animate-spin">
          <LoaderCircle className="h-5 w-5" />
        </span>
        {label}
      </div>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="h-8 w-2/3 max-w-sm rounded-lg bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-1/3 rounded bg-slate-200" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}
