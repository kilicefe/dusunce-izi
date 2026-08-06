import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Mic,
  Filter,
  ArrowUpDown,
  Search,
  ChevronRight,
  Sparkles,
  Edit3,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { getTeacherReviewQueue } from '../lib/db';

interface TeacherReviewQueueViewProps {
  teacherId: string;
  onSelectReview: (responseId: string) => void;
}

export const TeacherReviewQueueView: React.FC<TeacherReviewQueueViewProps> = ({
  teacherId,
  onSelectReview,
}) => {
  const [filter, setFilter] = useState<'all' | 'unreviewed' | 'low_confidence' | 'reviewed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'confidence_asc' | 'newest' | 'oldest'>('confidence_asc');
  const [queueItems, setQueueItems] = useState<any[]>([]);

  useEffect(() => {
    loadQueue();
  }, [teacherId, filter]);

  const loadQueue = () => {
    const items = getTeacherReviewQueue(teacherId, filter);
    setQueueItems(items);
  };

  const filteredItems = queueItems
    .filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.exam?.title?.toLowerCase().includes(q) ||
        item.question?.title?.toLowerCase().includes(q) ||
        item.student?.firstName?.toLowerCase().includes(q) ||
        item.student?.schoolNumber?.includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'confidence_asc') return (a.confidence || 0) - (b.confidence || 0);
      if (sortBy === 'newest') return new Date(b.review.reviewedAt).getTime() - new Date(a.review.reviewedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.review.reviewedAt).getTime() - new Date(b.review.reviewedAt).getTime();
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            ÖĞRETMEN DEĞERLENDİRME HAVUZU (PHASE 4)
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Yapay Zekâ Yanıt İnceleme Kuyruğu</h1>
          <p className="text-sm text-slate-400 mt-1">
            Öğrencilerin gönderdiği çoklu-modlu yanıtlar için üretilen AI nitel analiz sonuçlarını onaylayın veya düzenleyin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 block">Bekleyen</span>
            <span className="text-xl font-bold text-amber-400">
              {queueItems.filter((i) => i.review.status === 'PENDING').length}
            </span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 block">Düşük Güven</span>
            <span className="text-xl font-bold text-rose-400">
              {queueItems.filter((i) => (i.confidence || 1) < 0.80).length}
            </span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 block">Onaylanan</span>
            <span className="text-xl font-bold text-emerald-400">
              {queueItems.filter((i) => i.review.status === 'APPROVED' || i.review.status === 'APPROVED_WITH_CHANGES').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tümü ({queueItems.length})
          </button>
          <button
            onClick={() => setFilter('unreviewed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'unreviewed' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            İnceleme Bekleyenler
          </button>
          <button
            onClick={() => setFilter('low_confidence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'low_confidence' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Düşük Güven ({"<0.80"})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'reviewed' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            İncelenmiş
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci veya sınav ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 text-sm text-slate-200 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-lg border border-slate-700 focus:outline-none"
          >
            <option value="confidence_asc">En Düşük Güven Önce</option>
            <option value="newest">En Yeni Gönderilen</option>
            <option value="oldest">En Eski Gönderilen</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      {filteredItems.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          Seçilen filtreye uygun inceleme bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const confidencePct = Math.round((item.confidence || 0.85) * 100);
            const status = item.review?.status || 'PENDING';

            return (
              <div
                key={item.review.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {item.exam?.title || 'Sınav'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Soru #{item.question?.questionOrder || 1}: {item.question?.title}
                    </span>
                    {status === 'APPROVED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Onaylandı
                      </span>
                    )}
                    {status === 'APPROVED_WITH_CHANGES' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Düzenlendi & Onaylandı
                      </span>
                    )}
                    {status === 'REJECTED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Reddedildi
                      </span>
                    )}
                    {status === 'PENDING' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> İnceleme Bekliyor
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <span>No: {item.student?.schoolNumber}</span>
                    <span className="text-slate-500">•</span>
                    <span>{item.student?.firstName} {item.student?.lastName}</span>
                  </div>

                  {/* Response Modes Present */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <span className="text-slate-500">Yanıt İçeriği:</span>
                    {item.response?.textResponse?.content && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        <FileText className="w-3 h-3 text-sky-400" /> Metin
                      </span>
                    )}
                    {item.response?.imageResponses && item.response.imageResponses.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        <ImageIcon className="w-3 h-3 text-amber-400" /> El Yazısı / Görsel (OCR)
                      </span>
                    )}
                    {item.response?.audioResponse && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        <Mic className="w-3 h-3 text-emerald-400" /> Ses (Transkript)
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Confidence & Action */}
                <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-0.5">AI Güven Puanı</div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            confidencePct >= 85
                              ? 'bg-emerald-500'
                              : confidencePct >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-200">%{confidencePct}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectReview(item.response.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-indigo-900/30"
                  >
                    <span>İncele ve Değerlendir</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
