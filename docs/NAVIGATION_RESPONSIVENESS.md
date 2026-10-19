# Öğretmen ekranlarında gezinme geri bildirimi

## Değişiklikler

- Öğretmen menüsü, ana sayfa bağlantıları, sınıf/sınav kartları ve geri dönüş bağlantıları ortak `TeacherLink` bileşenini kullanır.
- Next.js `useLinkStatus` bağlantının gerçek bekleme durumunu yönetir. Beklerken tıklanan bağlantıda “Açılıyor…” görünür ve ekran okuyucuya nazik bir durum bildirimi gönderilir. Yeni sekme, klavye, geri/ileri ve iptal davranışı özel bir tıklama engelleyicisiyle değiştirilmez.
- Gösterge paneli, sınıflar ve sınavlar için `loading.tsx` sınırları eklendi. Veriler beklenirken içerik alanında yer tutucu ve açıklama görünür. Bu bileşenler öğrenci bilgisi içermez.
- Göstergeler bağlantının boyutunu değiştirmez; hareket azaltma tercihi olan kullanıcılar için animasyon oynatılmaz.
- `getCurrentUser`, React `cache` ile aynı Server Component isteğindeki yinelenen oturum okumalarını paylaşır. İstekler arasında kullanıcı/rol önbelleği yoktur; sunucu eylemlerinin kendi yetki kontrolleri kaldırılmamıştır.

## Doğrulama

19 Ekim 2026, uygulama/test değişiklikleri `c2fb2b0`:

- [PostgreSQL CI çalışması](https://github.com/kilicefe/dusunce-izi/actions/runs/39248440537): **101/101 birim ve entegrasyon testi**, TypeScript ve tam üretim derlemesi başarılı. PostgreSQL 16 üzerinde migrasyonlar ve sentetik seed başarıyla uygulandı; canlı veritabanına bağlanılmadı.
- **6/6 Chromium E2E testi başarılı**, tekrar denemeye ihtiyaç olmadı. Mevcut güvenli test girişiyle öğretmen oturumu, sınıf oluşturma, öğrenci ekleme, ana sayfaya dönüş ve mobil menü çalıştı. Oturumsuz sınıf erişimi giriş ekranına döndü.
- Yeni gezinme testleri: masaüstü ve 390 × 844 mobil boyutta geciktirilmiş istekte “Açılıyor…” geri bildirimi, hedefe varışta temizlenmesi, aktif menü, yatay taşma olmaması, tarayıcı geri dönüşü, geciken ilk tıklamayı takip eden ikinci gezinmenin kazanması ve Enter ile ana sayfaya dönüş.
- CI'nin `navigation-screenshots` çıktısındaki dört gerçek tarayıcı ekran görüntüsü indirildi ve görsel olarak incelendi. Masaüstü/mobil bekleme göstergesi okunaklı; mobil sınıf ekranı taşmıyor. Çıktı yalnızca sentetik veri içerir ve 7 gün saklanır. CI'nin PostgreSQL/auth yaklaşımı korunarak yalnızca bu kanıt yükleme adımı eklendi.
- Yeni birim testleri ayrıca bağlantı özelliklerinin korunmasını, erişilebilir/hareket azaltma tercihine uygun yer tutucuları, oturum kapatmayı ve öğretmen/yönetici yetki sınırlarını denetler.
- [Vercel önizleme derlemesi](https://vercel.com/kilicefes-projects/dusunce-izi/G2EwCEGoMg4nKrrDPBkF5HDwGKwp) başarılı. Yeni önizleme tarayıcıda bizzat açıldı; `/classrooms` erişimi `/sign-in` sayfasına yönlendi. Bu önizlemede Google sağlayıcısı yapılandırılmadığından öğretmen ekranlarında **manuel oturumlu gezinme tamamlanamadı**. Kimlik doğrulama gevşetilmedi ve üretime test girişi eklenmedi.
- Yerel Windows üretim paketleme/localhost erişim sorunları nedeniyle nihai derleme ve oturumlu tarayıcı testleri bulutta yapıldı. E2E, mevcut CI tasarımı gereği geliştirme sunucusunda test kimliğiyle çalışır; ayrı başarılı üretim build'i, gerçek Google OAuth akışının test edildiği anlamına gelmez.

Değişiklikler [taslak PR #2](https://github.com/kilicefe/dusunce-izi/pull/2) içinde, güncel `codex/pilot-hardening` dalının üzerine yerleştirildi. O daldaki medya güvenliği düzeltmeleri korunmuştur.

## Yayına alma ve kabul kontrolü

Veritabanı migrasyonu, yeni anahtar veya auth/CI yapılandırması değişikliği gerekmez. Bu değişiklikler henüz canlıya gönderilmedi.

1. PR #2'nin en güncel CI ve Vercel durumunu kontrol et. Kod ve genişletilmiş test paketi `c2fb2b0` üzerinde geçti; sonraki doküman değişiklikleri de CI'yi yeniden tetikler.
2. Manuel kabul için önce ayrı test verileri kullanan bir önizlemeye Google OAuth yapılandır. Gerekli callback adresini açıkça onaylat; üretim sırlarını/verisini önizlemeye gelişigüzel kopyalama. Önizlemeyi üretime yükselterek veya test kimliğini üretimde açarak bu sınırı atlama.
3. Bu ortamda ana sayfa → sınıflar → sınıf detayı → sınavlar → inceleme/analitik → ana sayfa gezintisini, gerçek Google oturumunu ve farklı öğretmenlerin veri ayrımını manuel kontrol et. Safari/Firefox ve yeni sekmede açma henüz bu turda denenmedi.
4. Onaydan sonra normal PR/üretim dağıtım sürecini kullan; veritabanı migrasyonu gerekmez. Canlıda giriş, menü, geri dönüş ve gösterge temizlenmesi için kısa bir salt okunur kontrol yap. Sorunda önceki Ready deployment'a dön; bu paket için veri geri alma işlemi gerekmez.

Bu paket algılanan beklemeyi iyileştirir ve tekrarlı oturum okumalarını azaltır; üretimde belirli bir milisaniye veya yüzdelik hızlanma ölçülmüş değildir. Sunucu/veritabanı bölgesi, soğuk başlangıç ve sorgu süreleri ayrıca ölçülmelidir. Önceki işlev/güvenlik incelemesindeki diğer bulgular bu paketle çözülmüş sayılmaz.

Oturumsuz erişim testinde doğru yönlendirme gerçekleşirken sunucu günlüğünde `UNAUTHORIZED` kaydı oluşur (layout ve sayfanın eşzamanlı yetki kontrolleri); bu günlük gürültüsü ayrıca ele alınabilir. CI ayrıca mevcut Actions sürümleri için Node 20 kullanımdan kaldırma uyarısı veriyor; araç sürümü yükseltmesi bu gezinme paketinden ayrı tutuldu.

## Teknik kaynaklar

- [Next.js: useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status)
- [Next.js: loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [React: istek kapsamlı cache](https://react.dev/reference/react/cache)
