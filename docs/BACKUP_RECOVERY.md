# DÜŞÜNCE İZİ - Yedekleme, Kurtarma ve Veri Saklama Politikası

Bu doküman, veri kaybını önlemek, felaket durumunda sistemi hızla ayağa kaldırmak ve veri saklama süreçlerini yönetmek için hazırlanmıştır.

---

## 1. Veri Tabanı Yedekleme (Database Backup Strategy)
- **Supabase Otomatik Günlük Yeddeler (Daily Backups)**: Point-in-Time Recovery (PITR) özelliği aktif hale getirilmeli ve 7 ile 14 gün arasında geri dönülebilir olmalıdır.
- **Manuel SQL Yedeği Alma**:
  ```bash
  pg_dump -h db.your-project.supabase.co -U postgres -d postgres -F c -b -v -f dusunce_izi_backup_$(date +%Y%m%d).dump
  ```

---

## 2. Depolama / Görsel ve Ses Dosyası Yedekleri
- Öğrenci el yazısı görselleri ve ses kayıtları Supabase Storage bucket içerisinde saklanır.
- Bucket nesneleri için Cross-Region Replication veya günlük versiyonlu yedekleme etkinleştirilir.

---

## 3. Felaket Kurtarma (Disaster Recovery Plan)
1. **Veri Tabanı Çökmesi**:
   - Supabase Dashboard üzerinden en son sağlıklı snapshot restore edilir.
   - `npx prisma migrate status` ile taşıma durumu doğrulanır.
2. **AI İşleme Hattı Kesintisi**:
   - Gemini API veya sunucu bağlantı hatalarında, sistem yanıtları `SUBMITTED` durumunda güvenle saklar.
   - İnternet/API erişimi düzeldiğinde İnceleme Kuyruğundan veya Yönetici Paneli'nden "Toplu Yeniden Analiz Et" tetiklenebilir.

---

## 4. Saklama ve Temizleme Politikaları
- **Sınav ve Yanıt Verileri**: Eğitim öğretim yılı boyunca saklanır.
- **Medya Dosyaları**: Depolama tasarrufu ve gizlilik gereği 180 gün sonra otomatik arşivlenir/silinir.
- **KVKK Unutulma Hakkı (Anonymization)**: Talebe istinaden `anonymizeStudentData(studentId)` çalıştırılarak isim ve okul no bilgisi kalıcı olarak maskelenir.
