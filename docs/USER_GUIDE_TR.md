# DÜŞÜNCE İZİ - Öğretmen Kullanım Kılavuzu

Bu kullanım kılavuzu, DÜŞÜNCE İZİ sistemini sınıflarınızda etkin şekilde kullanabilmeniz için adım adım hazırlanmıştır.

---

## İçindekiler
1. [Giriş ve Hesaba Erişim](#1-giriş-ve-hesaba-erişim)
2. [Sınıf ve Öğrenci Listesi Yönetimi](#2-sınıf-ve-öğrenci-listesi-yönetimi)
3. [Açık Uçlu Sınav Oluşturma](#3-açık-uçlu-sınav-oluşturma)
4. [Kavram, Yanılgı ve HOTS Tanımlama](#4-kavram-yanılgı-ve-hots-tanımlama)
5. [Sınav Yayımlama, Bağlantı ve QR Kod](#5-sınav-yayımlama-bağlantı-ve-qr-kod)
6. [Öğrenci Sınav Deneyimi ve Güvenli Giriş](#6-öğrenci-sınav-deneyimi-ve-güvenli-giriş)
7. [İnceleme Kuyruğu (Teacher Review Queue)](#7-inceleme-kuyruğu-teacher-review-queue)
8. [Analitik ve Raporlama Paneli](#8-analitik-ve-raporlama-paneli)
9. [Dışa Aktarma (CSV ve Yazdırılabilir PDF)](#9-dışa-aktarma-csv-ve-yazdırılabilir-pdf)
10. [KVKK ve Veri Gizliliği Kontrolleri](#10-kvkk-ve-veri-gizliliği-kontrolleri)

---

## 1. Giriş ve Hesaba Erişim
- Öğretmen e-posta adresiniz veya kurumsal Google hesabınız ile sisteme giriş yapın.
- Sol navigasyon menüsünden Dashboard (Gösterge Paneli), Sınıflar, Sınavlar ve İnceleme Kuyruğu bölümlerine erişebilirsiniz.

---

## 2. Sınıf ve Öğrenci Listesi Yönetimi
1. **Sınıf Ekleme**: "Sınıflar" sekmesinden `Sınıf Ekle` butonuna tıklayın. Sınıf adı (ör. *8-A Fen Bilimleri*), kademe ve akademik yılı girin.
2. **Öğrenci Listesi İçe Aktarma (CSV)**: Hazırladığınız CSV dosyasında `OkulNo`, `Ad`, `Soyad` sütunlarını ekleyerek tek tıkla toplu içe aktarabilirsiniz.
3. **Anonim Güvenlik**: Öğrenciler sınav portalına girerken yalnızca okul numaralarını kullanırlar; kişisel şifre gerekmez.

---

## 3. Açık Uçlu Sınav Oluşturma
1. "Sınavlar" sekmesinden `Yeni Sınav Oluştur` butonuna tıklayın.
2. Sınav başlığı, ders, ünite ve konu bilgilerini doldurun.
3. Soruları ekleyin. Her soru için öğrenci yanıt modlarını seçin:
   - **Metin (Doğrudan Klavye)**
   - **El Yazısı / Çizim Görseli (Kamera/Fotoğraf)**
   - **Sesli Açıklama (Mikrofon)**
   - **Çoklu Temsil (Çoklu Mod)**

---

## 4. Kavram, Yanılgı ve HOTS Tanımlama
Yapay zekanın nitel analizi doğru yapabilmesi için her soruya pedagogical pedagojik kriterler ekleyin:
- **Beklenen Kavramlar**: Temel (Essential), Destekleyici (Supporting) veya Seçmeli kavramları girin.
- **Kavram Yanılgıları**: Sık karşılaşılan yanılgı kodlarını ve açıklamalarını girin (ör. *MIS-01: Isı ile sıcaklığın aynı kavram sanılması*).
- **HOTS (Üst Düzey Düşünme Becerileri)**: Analiz, Değerlendirme, Yaratma, Nedensellik vb. boyutları işaretleyin.
- **Argümantasyon Kriterleri**: İddia, Kanıt, Gerekçe gereksinimlerini belirleyin.

---

## 5. Sınav Yayımlama, Bağlantı ve QR Kod
- Hazırladığınız sınavı `Yayımla` butonuna basarak aktifleştirin.
- Sistem otomatik olarak:
  - Benzersiz erişim bağlantısı (URL)
  - 6 haneli Sınav Kodu
  - İndirilebilir ve tahtaya yansıtılabilir **QR Kod** üretir.

---

## 6. Öğrenci Sınav Deneyimi ve Güvenli Giriş
- Öğrenci bağlantıyı açar veya QR kodu okutur.
- Okul numarasını girerek sınav oturumunu başlatır.
- Soruları metin yazarak, kağıda çizdiğinin fotoğrafını çekerek veya ses kaydı alarak yanıtlar.
- Bağlantı kopmalarına karşı yanıtlar yerel cihazda anlık taslak olarak korunur.

---

## 7. İnceleme Kuyruğu (Teacher Review Queue)
- Yapay zeka (Gemini 2.5 Pro) öğrenci yanıtlarını OCR, ses deşifresi ve nitel analiz ile işler.
- Üretilen analizler pedagojik doğrulama için **İnceleme Kuyruğuna** düşer.
- Öğretmen olarak:
  - **Onayla (Approve)**: Yapay zeka tespitlerini olduğu gibi kabul edin.
  - **Düzelterek Onayla (Edit & Approve)**: Seviye, yanılgı veya argümantasyon puanlarını güncelleyin.
  - **Reddet (Reject)**: Yanıltıcı veya uygunsuz yanıtları analitikten hariç tutun.

---

## 8. Analitik ve Raporlama Paneli
- **Kavramsal Anlama Dağılımı**: Seviye 0 ile Seviye 3 arasındaki öğrenci dağılımlarını görün.
- **Kavram Yanılgısı Analizi**: Sınıfta en sık tekrarlanan bilimsel yanlış anlamaları grafiklerle inceleyin.
- **HOTS Matrisi**: Üst düzey düşünme becerilerindeki gelişim ve eksiklikleri izleyin.
- **Öğretimsel Öneriler (Instructional Recommendations)**: Yapay zeka ve öğretmen doğrulamalarıyla üretilen sınıf içi mikro müdahale ve ders planı adımlarını inceleyin.

---

## 9. Dışa Aktarma (CSV ve Yazdırılabilir PDF)
- **Öğretmen Detaylı CSV**: Tüm öğrenci isimleri, yanıt detayları ve puan matrisi. (Formül enjeksiyon korumalıdır).
- **Anonimleştirilmiş Araştırma CSV**: Öğrenci PII verilerinden arındırılmış, pseudonymous ID'li veri seti.
- **Rapor Yazdır / PDF**: A4 formatına tam uyumlu, sınıf ve öğrenci gelişim karneleri.

---

## 10. KVKK ve Veri Gizliliği Kontrolleri
- İstediğiniz zaman öğrenci kayıtlarını anonimleştirebilir veya medya dosyalarını (ses/görsel) veri saklama politikası gereği silebilirsiniz.
