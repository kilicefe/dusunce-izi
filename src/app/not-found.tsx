export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-indigo-400">404</h2>
        <h1 className="text-xl font-bold">Sayfa Bulunamadı</h1>
        <p className="text-sm text-slate-400">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
        >
          Gösterge Paneline Dön
        </a>
      </div>
    </div>
  );
}
