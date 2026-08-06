import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, Printer, ExternalLink, QrCode as QrIcon } from 'lucide-react';

interface QRCodeViewProps {
  examTitle: string;
  classroomName: string;
  publicUrl: string;
  shortCode: string;
  onClose?: () => void;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  examTitle,
  classroomName,
  publicUrl,
  shortCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (canvasRef.current && publicUrl) {
      QRCode.toCanvas(canvasRef.current, publicUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      }).catch((err) => console.error('QR code error:', err));
    }
  }, [publicUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shortCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${shortCode}-${examTitle.slice(0, 15).replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(publicUrl, { type: 'svg', margin: 2 });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${shortCode}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('SVG download failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-lg mx-auto print:bg-white print:border-none print:shadow-none print:text-slate-900 text-white">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold print:hidden">
          <QrIcon className="w-3.5 h-3.5" /> Yayında Sınav Katılım Kartı
        </div>
        <h3 className="text-xl font-bold text-slate-100 print:text-slate-900">{examTitle}</h3>
        <p className="text-sm text-slate-400 print:text-slate-600 font-medium">{classroomName}</p>
      </div>

      {/* QR Code Canvas Frame */}
      <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-inner border border-slate-200 mb-6 w-fit mx-auto">
        <canvas ref={canvasRef} className="block" />
        <div className="mt-3 text-center">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Sınav Katılım Kodu</span>
          <span className="text-2xl font-mono font-black tracking-widest text-indigo-700">{shortCode}</span>
        </div>
      </div>

      {/* Access Details */}
      <div className="bg-slate-800/80 rounded-lg p-3 text-xs space-y-2 mb-6 border border-slate-700/50 print:border-slate-300 print:bg-slate-50 print:text-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400 font-medium shrink-0">Bağlantı:</span>
          <span className="truncate font-mono text-indigo-300 print:text-indigo-700">{publicUrl}</span>
          <button
            onClick={handleCopyLink}
            className="shrink-0 p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition print:hidden"
            title="Bağlantıyı kopyala"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400 font-medium shrink-0">Kısa Kod:</span>
          <span className="font-mono font-bold text-amber-400 print:text-amber-700">{shortCode}</span>
          <button
            onClick={handleCopyCode}
            className="shrink-0 p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition print:hidden"
            title="Kodu kopyala"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 print:hidden">
        <button
          onClick={handleDownloadPNG}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5" /> PNG İndir
        </button>
        <button
          onClick={handleDownloadSVG}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5" /> SVG İndir
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition col-span-2"
        >
          <Printer className="w-3.5 h-3.5" /> Yazdır / PDF Kaydet
        </button>
      </div>
    </div>
  );
};
