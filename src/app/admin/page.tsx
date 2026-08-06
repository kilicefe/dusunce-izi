import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ShieldCheck, Users, FileText, Database, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  // Load system metrics from real database
  const totalUsers = await prisma.user.count();
  const totalClassrooms = await prisma.classroom.count();
  const totalStudents = await prisma.studentRoster.count();
  const recentLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold">Sistem Yönetim Paneli (Admin)</h1>
          </div>
          <p className="text-xs text-slate-400">
            Sistem sağlık durumunu, denetim günlüklerini (Audit Logs) ve toplam kullanıcı istatistiklerini izleyin.
          </p>
        </div>
        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
          Giriş Yapan: {admin.email}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kullanıcı Sayısı</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalUsers}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Sınıf Sayısı</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalClassrooms}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Öğrenci Kayıtları</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalStudents}</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Son Sistem Denetim Günlükleri (Audit Logs)
          </h2>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Henüz sistem denetim günlüğü bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Tarih / Saat</th>
                  <th className="px-6 py-3">Kullanıcı</th>
                  <th className="px-6 py-3">İşlem</th>
                  <th className="px-6 py-3">Kaynak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {log.user?.email || log.userId || 'Sistem'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                      {log.resource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
