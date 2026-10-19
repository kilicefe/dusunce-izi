# Öğretmen ekranlarında gezinme geri bildirimi

## Değişiklikler

- Öğretmen menüsü, ana sayfa bağlantıları, sınıf/sınav kartları ve geri dönüş bağlantıları ortak `TeacherLink` bileşenini kullanır.
- Next.js `useLinkStatus` bağlantının gerçek bekleme durumunu yönetir. Beklerken tıklanan bağlantıda “Açılıyor…” görünür ve ekran okuyucuya nazik bir durum bildirimi gönderilir. Yeni sekme, klavye, geri/ileri ve iptal davranışı özel bir tıklama engelleyicisiyle değiştirilmez.
- Gösterge paneli, sınıflar ve sınavlar için `loading.tsx` sınırları eklendi. Veriler beklenirken içerik alanında yer tutucu ve açıklama görünür. Bu bileşenler öğrenci bilgisi içermez.
- Göstergeler bağlantının boyutunu değiştirmez; hareket azaltma tercihi olan kullanıcılar için animasyon oynatılmaz.
- `getCurrentUser`, React `cache` ile aynı Server Component isteğindeki yinelenen oturum okumalarını paylaşır. İstekler arasında kullanıcı/rol önbelleği yoktur; sunucu eylemlerinin kendi yetki kontrolleri kaldırılmamıştır.

## Doğrulama

- 100 birim/regresyon testi geçti; bağımsız PostgreSQL gerektiren 1 test atlandı.
- TypeScript kontrolü geçti.
- Üretim derlemesinde webpack derlemesi ve TypeScript aşaması geçti. Tam paketleme, Windows'ta `/_global-error` çıktı klasörü oluşturulurken `EPERM` ile durdu. Temiz/kısa klasör denemesinde bağımlılık bağlantısı oluşturma erişimi de reddedildi; tam üretim build'i başarılı sayılmadı.
- Yeni testler: bekleme göstergesinin görünmesi/temizlenmesi, bağlantı özelliklerinin korunması, erişilebilir yer tutucular, oturum kapatma ve öğretmen/yönetici yetki sınırları.
- `e2e/navigation_feedback.spec.ts`, geciktirilmiş sınıf isteğinde geri bildirimi, hedefe varışta temizlenmesini ve tarayıcı geri dönüşünü denetler. Gerçek PostgreSQL ve sentetik test hesabı kullanan mevcut CI akışına dahildir; bu yerel çalışmada E2E yürütülmedi.
- Gerçek gezinme bileşenlerini kullanan, canlı veriden bağımsız yerel görsel test sunucusu hazırlandı. Tarayıcı localhost'a bağlanamadığı için yeni görünümün fiziksel tarayıcı doğrulaması tamamlanamadı. Bu, canlı sitenin erişilemez olduğu anlamına gelmez.

## Yayına alma ve kabul kontrolü

Veritabanı migrasyonu, yeni anahtar veya auth/CI yapılandırması değişikliği gerekmez. Bu değişiklikler henüz canlıya gönderilmedi.

1. Mevcut PostgreSQL CI akışını, yeni E2E testi dahil çalıştır.
2. Önizlemede öğretmen oturumuyla ana sayfa → sınıflar → sınıf detayı → sınavlar → inceleme/analitik → ana sayfa gezintisini dene.
3. Yavaş ağda bağlantı göstergesinin veya sayfa yer tutucusunun görünmesini, hedef sayfa açılınca kaybolmasını kontrol et.
4. Hızlı ardışık tıklama, tarayıcı geri/ileri, yeni sekmede açma, klavye ve 390 piksel mobil görünümü dene. Yatay taşma ve takılı kalan gösterge olmamalı.
5. Oturumsuz erişimin giriş sayfasına döndüğünü ve farklı öğretmen hesaplarının birbirinin verisini göremediğini doğrula.

Bu paket algılanan beklemeyi iyileştirir ve tekrarlı oturum okumalarını azaltır; üretimde belirli bir milisaniye veya yüzdelik hızlanma ölçülmüş değildir. Sunucu/veritabanı bölgesi, soğuk başlangıç ve sorgu süreleri ayrıca ölçülmelidir. Önceki işlev/güvenlik incelemesindeki diğer bulgular bu paketle çözülmüş sayılmaz.

## Teknik kaynaklar

- [Next.js: useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status)
- [Next.js: loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [React: istek kapsamlı cache](https://react.dev/reference/react/cache)
