'use client';

import { useState, useEffect } from 'react';
import { getClassroom, archiveClassroom, restoreClassroom } from '@/app/actions/classroomActions';
import { addStudentToRoster, previewAndImportCSV } from '@/app/actions/rosterActions';
import { Users, UserPlus, Upload, ArrowLeft, Archive, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { TeacherLink as Link } from '@/components/teacher/TeacherLink';

export default function ClassroomDetailClient({ id }: { id: string }) {
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Manual student add state
  const [schoolNumber, setSchoolNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // CSV Import state
  const [csvContent, setCsvContent] = useState('');
  const [csvPreviewResult, setCsvPreviewResult] = useState<any>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getClassroom(id);
      setClassroom(data);
    } catch (err: any) {
      setError(err.message || 'Sınıf yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    setActionSuccess('');

    try {
      await addStudentToRoster({
        classroomId: id,
        schoolNumber,
        firstName,
        lastName,
      });
      setSchoolNumber('');
      setFirstName('');
      setLastName('');
      setActionSuccess(`${schoolNumber} numaralı öğrenci başarıyla eklendi.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Öğrenci eklenirken hata oluştu');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      if (text) {
        setCsvLoading(true);
        try {
          const preview = await previewAndImportCSV(id, text, false);
          setCsvPreviewResult(preview);
        } catch (err: any) {
          setError(err.message || 'CSV önizleme hatası');
        } finally {
          setCsvLoading(false);
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmCSVImport = async () => {
    if (!csvContent) return;
    setCsvLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const res = await previewAndImportCSV(id, csvContent, true);
      setActionSuccess(`${res.validCount} öğrenci başarıyla sınıfa aktarıldı!`);
      setCsvContent('');
      setCsvPreviewResult(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'CSV içe aktarma sırasında hata oluştu');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleToggleArchive = async () => {
    try {
      if (classroom.status === 'ACTIVE') {
        await archiveClassroom(id);
        setActionSuccess('Sınıf arşivlendi.');
      } else {
        await restoreClassroom(id);
        setActionSuccess('Sınıf arşivden çıkarıldı.');
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Arşiv durumu değiştirilemedi');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Sınıf detayı yükleniyor...</div>;
  }

  if (error && !classroom) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-200">
        <p className="font-bold">Hata Oluştu:</p>
        <p className="text-sm mt-1">{error}</p>
        <Link href="/classrooms" className="mt-4 inline-block text-xs font-semibold underline">Sınıf Listesine Dön</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/classrooms" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2">
            <ArrowLeft className="w-4 h-4" /> Sınıf Listesine Dön
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{classroom.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              classroom.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {classroom.status === 'ACTIVE' ? 'Aktif Sınıf' : 'Arşivlendi'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {classroom.grade}. Sınıf {classroom.branch ? `(${classroom.branch})` : ''} — Akademik Yıl: {classroom.academicYear}
          </p>
        </div>

        <button
          onClick={handleToggleArchive}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
        >
          {classroom.status === 'ACTIVE' ? (
            <> <Archive className="w-4 h-4 text-slate-500" /> Sınıfı Arşivle </>
          ) : (
            <> <RefreshCw className="w-4 h-4 text-slate-500" /> Arşivden Çıkar </>
          )}
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Grid: Manual Add & CSV Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Add Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h3>Tekil Öğrenci Ekle</h3>
          </div>

          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Okul Numarası *
              </label>
              <input
                type="text"
                required
                value={schoolNumber}
                onChange={(e) => setSchoolNumber(e.target.value)}
                placeholder="Örn: 101"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Ad *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Öğrenci Adı"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Öğrenci Soyadı"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {addLoading ? 'Ekleniyor...' : 'Öğrenciyi Kaydet'}
            </button>
          </form>
        </div>

        {/* CSV Import */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3>Toplu CSV Öğrenci İçe Aktarımı</h3>
          </div>

          <p className="text-xs text-slate-500">
            CSV dosyanız <code className="bg-slate-100 px-1 py-0.5 rounded">schoolNumber, firstName, lastName</code> veya Türkçe <code className="bg-slate-100 px-1 py-0.5 rounded">okul_no, ad, soyad</code> sütunlarını içermelidir.
          </p>

          <div>
            <label className="block w-full cursor-pointer py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 text-center text-xs font-semibold text-slate-600 transition">
              <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <span>CSV Dosyası Seçin</span>
              <input type="file" accept=".csv" onChange={handleCSVFileChange} className="hidden" />
            </label>
          </div>

          {csvPreviewResult && (
            <div className="space-y-3 pt-2">
              <div className="text-xs flex justify-between font-semibold p-3 bg-slate-100 rounded-xl">
                <span className="text-slate-700">Toplam Satır: {csvPreviewResult.totalRows}</span>
                <span className="text-emerald-700">Geçerli: {csvPreviewResult.validCount}</span>
                <span className="text-red-600">Hatalı: {csvPreviewResult.invalidCount}</span>
              </div>

              {csvPreviewResult.validCount > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmCSVImport}
                  disabled={csvLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
                >
                  {csvLoading ? 'Aktarılıyor...' : `${csvPreviewResult.validCount} Geçerli Öğrenciyi İçe Aktar`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Sınıf Listesi ({classroom.roster?.length || 0} Öğrenci)</h2>
          </div>
        </div>

        {classroom.roster?.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Sınıfta kayıtlı öğrenci bulunmuyor. Tekil ekleme yapabilir veya CSV yükleyebilirsiniz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Okul No</th>
                  <th className="px-6 py-3">Ad</th>
                  <th className="px-6 py-3">Soyad</th>
                  <th className="px-6 py-3">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {classroom.roster.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{student.schoolNumber}</td>
                    <td className="px-6 py-4 font-medium">{student.firstName}</td>
                    <td className="px-6 py-4 font-medium">{student.lastName}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(student.createdAt).toLocaleDateString('tr-TR')}
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
