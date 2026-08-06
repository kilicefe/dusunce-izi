import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'DÜŞÜNCE İZİ — Açık Uçlu Sınav ve Öğrenme Analizi',
  description: 'Açık Uçlu Soru ve Pedagojik Analiz Platformu',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full bg-slate-50">
      <body className="h-full font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
