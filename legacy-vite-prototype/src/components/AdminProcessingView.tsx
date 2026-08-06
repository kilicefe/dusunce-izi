import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileCode,
  Sparkles,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { getAllProcessingJobs, getAIUsageLogs, runProcessingJob } from '../lib/processingPipeline';

export const AdminProcessingView: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'usage' | 'prompts'>('jobs');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsRefreshing(true);
    setJobs(getAllProcessingJobs());
    setLogs(getAIUsageLogs());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await runProcessingJob(jobId);
      loadData();
    } catch (e) {
      alert('İş yeniden çalıştırılamadı: ' + e);
    }
  };

  const totalCost = logs.reduce((acc, l) => acc + (l.estimatedCost || 0), 0);
  const totalTokens = logs.reduce((acc, l) => acc + (l.promptTokens || 0) + (l.evalTokens || 0), 0);
  const avgLatency = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / logs.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
            <Cpu className="w-4 h-4" /> ADMIN İŞLEME TANILARI & PROMPT YÖNETİMİ
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Arka Plan İşleme Kuyruğu & Telemetri</h1>
          <p className="text-sm text-slate-400 mt-1">
            Çoklu-modlu OCR, Transkripsiyon ve AI Nitel Analiz işleme hatlarını izleyin, prompt sürümlerini yönetin.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Toplam İş Kuyruğu</span>
          <span className="text-2xl font-bold text-slate-100">{jobs.length}</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Toplam AI İstek Tokeni</span>
          <span className="text-2xl font-bold text-indigo-400">{totalTokens.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Tahmini AI Maliyeti</span>
          <span className="text-2xl font-bold text-emerald-400">${totalCost.toFixed(4)}</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Ortalama Yanıt Süresi</span>
          <span className="text-2xl font-bold text-amber-400">{avgLatency} ms</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'jobs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          İşleme Hatları & Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'usage' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI API Kullanım Logları ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'prompts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Prompt Şablonları & Sürümleri
        </button>
      </div>

      {/* Content */}
      {activeTab === 'jobs' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Job ID & Türü</th>
                  <th className="p-3">Yanıt ID</th>
                  <th className="p-3">Durum</th>
                  <th className="p-3">Deneme</th>
                  <th className="p-3">Tarih</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Henüz işleme kuyruğunda kayıt yok.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono">
                        <div className="font-semibold text-slate-200">{job.jobType}</div>
                        <div className="text-[10px] text-slate-500">{job.id}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{job.studentResponseId.substring(0, 12)}...</td>
                      <td className="p-3">
                        {job.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                            COMPLETED
                          </span>
                        )}
                        {job.status === 'RUNNING' && (
                          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold animate-pulse">
                            RUNNING
                          </span>
                        )}
                        {job.status === 'QUEUED' && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                            QUEUED
                          </span>
                        )}
                        {job.status === 'FAILED' && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-3">{job.attemptCount} / {job.maximumAttempts}</td>
                      <td className="p-3 text-slate-400">{new Date(job.createdAt).toLocaleTimeString()}</td>
                      <td className="p-3 text-right">
                        {job.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                          >
                            Yeniden Dene
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">AI Kullanım & API Çağrı Geçmişi</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">{log.endpoint}</span>
                  <span className="text-slate-500 ml-2">({log.modelName})</span>
                  <div className="text-[10px] text-slate-400">
                    Prompt Tokens: {log.promptTokens} | Eval Tokens: {log.evalTokens}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-semibold">${log.estimatedCost?.toFixed(5)}</div>
                  <div className="text-[10px] text-slate-500">{log.latencyMs} ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Aktif Prompt Şablonları ve Sürümleri</h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              Şablon v1.0.0 Aktif
            </span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-indigo-400">Qualitative Analysis Prompt v1.0.0</div>
            <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-lg">
              Sen DÜŞÜNCE İZİ sisteminin uzman Fen Bilimleri Öğretmen Asistanısın...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
