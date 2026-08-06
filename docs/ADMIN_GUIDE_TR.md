# DÜŞÜNCE İZİ - Yönetici ve Sistem Yönetim Kılavuzu

Bu doküman, DÜŞÜNCE İZİ platformunun sistem yöneticileri ve BT birimleri için teknik konfigürasyon, izleme ve bakım adımlarını içerir.

---

## 1. Mimari ve Bileşen Özeti
- **Ön Yüz (Frontend)**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Veri Tabanı (Database)**: PostgreSQL (Prisma ORM) & Esnek In-Memory/Local Storage Fallback.
- **Yapay Zeka Hizmeti**: Gemini 2.5 Pro (`@google/genai` SDK) & Multimodal İşleme Hattı.
- **Medya İşleme**: OCR (Tesseract / Vision API), Ses Deşifresi (Whisper / Native Transcriber API).

---

## 2. Sağlık ve Performans İzleme (Observability & Health Checks)
Sistem iki ana sağlık denetimi rotası sunar:
- `/api/health`: Temel uygulama çalışma durumu.
- `/api/health/ready`: Veri tabanı latansı, medya depolama ve AI sağlayıcı bağlantı durumu.

### İzlenen Metrikler
1. **İşleme Kuyruğu (Processing Queue)**: Aktif, tamamlanan ve başarısız iş sayıları.
2. **Yapay Zeka Maliyet ve Kota İzleme**: Günlük token harcamaları ve tahmini maliyet ($).
3. **Hata Günlükleri (Correlation ID)**: Her istek ve arka plan görevi benzersiz bir korelasyon kimliği ile kaydedilir.

---

## 3. Yapay Zeka Sağlayıcı ve Kota Yönetimi
`.env` dosyasında AI konfigürasyon parametrelerini yönetebilirsiniz:
```env
GEMINI_API_KEY="YOUR_GEMINI_KEY"
AI_MODEL="gemini-2.5-pro"
AI_MAX_RETRIES=3
AI_DAILY_TOKEN_LIMIT=1000000
```
- API anahtarları asla istemci tarafında (browser) açık edilmez.
- `processingPipeline.ts` üzerinden otomatik üst üste deneme (exponential backoff) ve hata toleransı sağlanır.

---

## 4. Güvenlik ve Yetkilendirme Sertleştirmesi
1. **Rate Limiting (İstek Sınırlama)**: Sınav girişleri ve yapay zeka analiz istekleri IP ve Oturum bazında dakikada maksimum 30 istek ile sınırlandırılmıştır.
2. **Prompt Injection Koruması**: Öğrenci serbest metin yanıtlarında yer alan `<system>` veya talimat sıfırlama ifadeleri `sanitizePromptInput` ile temizlenir.
3. **CSV Formula Injection Koruması**: Dışa aktarılan dosyalarda `=`, `+`, `-`, `@` ile başlayan hücre değerleri güvenli kesme tırnağı (`'`) ile nötralize edilir.
4. **IDOR ve Yetki Denetimi**: Her öğretmen yalnızca kendi oluşturduğu sınıf ve sınav verilerine erişebilir.

---

## 5. Veri Saklama ve Temizlik Politikaları (Retention Service)
`retentionService.ts` arka plan servisi aşağıdaki temizlik operasyonlarını yürütür:
- **Medya Saklama Süresi**: Varsayılan 180 gün (Süre sonunda ses ve görsel dosyaları sunucudan silinir).
- **Rapor ve Dışa Aktarım Temizliği**: Varsayılan 30 gün.
- **Soft Delete Tasfiyesi**: Silinmiş olarak işaretlenen kayıtlar 30 gün sonra kalıcı olarak temizlenir.
- **Kuru Çalıştırma (Dry-Run)**: Temizlik yapmadan önce etkilenen kayıt sayıları simüle edilebilir.

---

## 6. Olay ve Hata Yönetimi (Incident Response)
- Sistem hatası durumunda `observabilityService.ts` tarafından loglanan `correlationId` ile hata takibi yapılır.
- Başarısız olan AI işleme süreçleri İnceleme Kuyruğunda "Yeniden Analiz Et" butonu ile manuel olarak tekrar tetiklenebilir.
