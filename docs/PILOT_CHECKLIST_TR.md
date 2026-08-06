# DÜŞÜNCE İZİ - Okul Pilot Uygulama Kontrol Listesi (Pilot-Readiness Checklist)

Bu kontrol listesi, bir okulda veya sınıfta gerçek öğrencilerle sınav uygulamadan önce tamamlanması gereken teknik ve operasyonel adımları içerir.

---

## 1. Hazırlık ve Konfigürasyon Kontrolleri
- [x] **Öğretmen Hesabı ve Girişi**: Öğretmen hesabı oluşturuldu ve giriş doğrulandı.
- [x] **Sınıf Listesi Yükleme**: Öğrenci numaraları ve isimleri CSV ile eksiksiz yüklendi.
- [x] **Sınav İnceleme ve Önizleme**: Öğretmen sınavı oluşturdu, beklenen kavramları ve yanılgıları girdi, öğrenci görünümünü önizledi.
- [x] **QR Kod ve Erişim Bağlantısı**: Sınav yayımlandı, QR kod akıllı tahtada test edildi.

## 2. Öğrenci Cihazı ve Ağ Kontrolleri
- [x] **Kamera Erişimi**: Mobil cihazlar ve tabletlerde el yazısı fotoğrafı çekme izni doğrulandı.
- [x] **Mikrofon Erişimi**: Sesli açıklama kaydı için tarayıcı mikrofon izinleri test edildi.
- [x] **Okul Ağ Bağlantısı**: Okul Wi-Fi veya hücresel bağlantısında WebSocket ve API isteklerinin engellenmediği doğrulandı.
- [x] **Taslak ve Kopma Dayanıklılığı**: İnternet kesintisinde öğrenci yanıtlarının kaybolmadığı (yerel taslak saklama) doğrulandı.

## 3. Yapay Zeka ve Analiz Hattı
- [x] **Gemini 2.5 Pro API Anahtarı**: Üretim ortamında API anahtarı tanımlandı ve kota limitleri kontrol edildi.
- [x] **OCR & Deşifre Doğruluğu**: Türkçe el yazısı ve Türkçe ses deşifresi örnek verilerle test edildi.
- [x] **Öğretmen Onay Akışı**: Yapay zeka çıktılarının İnceleme Kuyruğuna eksiksiz düştüğü ve öğretmen düzenlemesine izin verdiği doğrulandı.

## 4. Güvenlik, Etik ve Yasal Bildirimler
- [x] **KVKK / Aydınlatma Metni**: Öğrencilere ve velilere yönelik bilgilendirme ve veri işleme açık rıza formu kontrol edildi.
- [x] **Yapay Zeka Sorumluluk Reddi**: AI çıktılarının öneri niteliğinde olduğu, nihai değerlendirmenin öğretmen sorumluluğunda olduğu vurgulandı.
- [x] **Kağıt B Planı (Contingency Plan)**: Bağlantı veya elektrik kesintisi durumunda uygulanacak fiziksel kağıt sınav alternatifi hazır bulunduruldu.
