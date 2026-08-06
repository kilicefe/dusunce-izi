/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DÜŞÜNCE İZİ - Yapay Zekâ Destekli Çok Modlu Açık Uçlu Değerlendirme ve Öğrenci Düşünme Analizi Sistemi
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ClassroomsView } from './components/ClassroomsView';
import { ExamListView } from './components/ExamListView';
import { ExamBuilderView } from './components/ExamBuilderView';
import { PublicExamView } from './components/PublicExamView';
import { TeacherResponsesView } from './components/TeacherResponsesView';
import { TeacherReviewQueueView } from './components/TeacherReviewQueueView';
import { TeacherReviewDetailView } from './components/TeacherReviewDetailView';
import { AdminProcessingView } from './components/AdminProcessingView';
import { ExamAnalyticsView } from './components/analytics/ExamAnalyticsView';
import { PlaceholderView } from './components/PlaceholderView';
import { AuthModal } from './components/AuthModal';
import { Exam } from './types/database';
import { getExams } from './lib/db';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [selectedExamForResponses, setSelectedExamForResponses] = useState<Exam | null>(null);
  const [selectedResponseForReview, setSelectedResponseForReview] = useState<string | null>(null);
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3 | 4>(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [publicToken, setPublicToken] = useState<string | null>(null);

  const { isTeacher, user } = useAuth();
  const currentTeacherId = user?.id || 't-101';

  // Check URL pathname for public student exam link e.g. /exam/token
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/exam/')) {
      const token = path.replace('/exam/', '');
      if (token) {
        setPublicToken(token);
      }
    }
  }, []);

  // If a student opens a public exam link
  if (publicToken) {
    return (
      <PublicExamView
        token={publicToken}
        onStudentVerified={(exam, schoolNumber) => {
          alert(`Sınav oturumu doğrulandı. Öğrenci No: ${schoolNumber}, Sınav: ${exam.title}`);
        }}
      />
    );
  }

  const handleNavigateNewExam = () => {
    setEditingExamId(null);
    setBuilderStep(1);
    setActiveTab('new-exam');
  };

  const handleNavigateEditExam = (examId: string) => {
    setEditingExamId(examId);
    setBuilderStep(1);
    setActiveTab('new-exam');
  };

  const handleNavigatePreviewExam = (examId: string) => {
    setEditingExamId(examId);
    setBuilderStep(3);
    setActiveTab('new-exam');
  };

  const handleNavigatePublishExam = (examId: string) => {
    setEditingExamId(examId);
    setBuilderStep(4);
    setActiveTab('new-exam');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar */}
        {isTeacher && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (tab === 'new-exam') {
                setEditingExamId(null);
                setBuilderStep(1);
              }
              setActiveTab(tab);
            }}
          />
        )}

        {/* View Switcher */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'classrooms' && <ClassroomsView />}

          {activeTab === 'exams' && (
            <ExamListView
              currentTeacherId={currentTeacherId}
              onNavigateNew={handleNavigateNewExam}
              onNavigateEdit={handleNavigateEditExam}
              onNavigatePreview={handleNavigatePreviewExam}
              onNavigatePublish={handleNavigatePublishExam}
              onNavigateResponses={(exam) => {
                setSelectedExamForResponses(exam);
                setActiveTab('responses');
              }}
            />
          )}

          {activeTab === 'new-exam' && (
            <ExamBuilderView
              currentTeacherId={currentTeacherId}
              examId={editingExamId}
              initialStep={builderStep}
              onBackToList={() => setActiveTab('exams')}
            />
          )}

          {activeTab === 'responses' && (() => {
            const allTeacherExams = getExams({ teacherId: currentTeacherId });
            const currentExam = selectedExamForResponses || allTeacherExams[0];

            if (!currentExam) {
              return (
                <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
                  Henüz tanımlı bir sınav bulunmuyor. Yanıtları incelemek için önce bir sınav oluşturunuz.
                </div>
              );
            }

            return (
              <TeacherResponsesView
                exam={currentExam}
                teacherId={currentTeacherId}
                onBack={() => setActiveTab('exams')}
              />
            );
          })()}

          {activeTab === 'reviews' && (
            selectedResponseForReview ? (
              <TeacherReviewDetailView
                studentResponseId={selectedResponseForReview}
                teacherId={currentTeacherId}
                onBack={() => setSelectedResponseForReview(null)}
              />
            ) : (
              <TeacherReviewQueueView
                teacherId={currentTeacherId}
                onSelectReview={(responseId) => setSelectedResponseForReview(responseId)}
              />
            )
          )}

          {activeTab === 'admin-processing' && <AdminProcessingView />}

          {activeTab === 'analyses' && <ExamAnalyticsView />}

          {activeTab === 'settings' && (
            <PlaceholderView tab={activeTab} onNavigate={(tab) => setActiveTab(tab)} />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-4 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DÜŞÜNCE İZİ v1.0.0 — Yapay Zekâ Destekli Öğrenci Düşünme Analizi Sistemi</span>
          <span className="text-slate-400">Gizlilik Odaklı & Anonim Analiz Mimarisi</span>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
