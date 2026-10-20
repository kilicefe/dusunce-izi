# İzole manuel kabul ortamı

20 Ekim 2026'da, kullanıcının onayıyla gezinme değişikliklerinin gerçek Google
oturumuyla denenebilmesi için kuruldu. Bu ortam canlı uygulama değildir.

## Hedefler ve izolasyon

- Vercel projesi: `kilicefes-projects/dusunce-izi`.
- Yalnız Preview dalı: `codex/navigation-feedback`.
- Sabit adres: `https://dusunce-izi-git-codex-navigation-feedback-kilicefes-projects.vercel.app`.
- Supabase: `efekilic's Org` içinde `dusunce-izi-preview`
  (`yjinvsfmzwfprudzjvio`, `eu-west-1`, PostgreSQL 17).
- Oluşturma anında Supabase fiyat teklifi aylık 0 USD idi. Ücretsiz proje
  duraklatılabilir; bu bir üretim sürekliliği garantisi değildir.
- Canlı öğrenci/sınıf/sınav verileri ve üretim sırları kopyalanmadı.

## Veritabanı kurulumu

Boş veritabanına depodaki üç değişmemiş SQL migration'ı sırasıyla uygulandı:

1. `20260806000000_init`
2. `20260814000000_pilot_media_tokens_queue`
3. `20260814170000_secure_public_schema_rls`

Yerel çalıştırma aracının ağ erişimi engeli nedeniyle `prisma migrate deploy`
tamamlanamadı. Bunun yerine yetkili Supabase migration bağlantısıyla, boş `public`
şeması ön koşulu altında tek transaction kullanıldı. `_prisma_migrations`
tablosuna gerçek dosya SHA-256 değerleri ve tamamlanma kayıtları aynı transaction
içinde yazıldı; başarısız bir uygulama tamamlanmış olarak işaretlenmedi.
Supabase geçmiş kaydı: `preview_existing_prisma_migrations`.

| Migration | SHA-256 |
| --- | --- |
| `20260806000000_init` | `aa90cef924717f3a1b202d61c4ce613e2b053a89e7219ab307627daf7deba6de` |
| `20260814000000_pilot_media_tokens_queue` | `b6820dc612ad8c259521375ea2fa8c26188526ad93d0c3e518ecfc938b68bcf9` |
| `20260814170000_secure_public_schema_rls` | `7b1fbb5949fb66b64f9faacf4fc23b6362ce199fca8b0060a6eea994d16440fb` |

50 tablonun tümünde RLS açık; `anon`/`authenticated` rollerinin tablo grant
sayısı sıfır. Security Advisor yalnız beklenen 50 `rls_enabled_no_policy` bilgi
notu döndürdü, uyarı/hata döndürmedi. Bu modelde erişim, tarayıcı Data API'siyle
değil uygulamanın yetki denetimi yapan sunucu eylemleriyle gerçekleşir.

`dusunce_izi_app`, yalnız 49 uygulama tablosu üzerinde CRUD yetkili sunucu
rolüdür; Prisma migration geçmişine erişim, CREATE DATABASE, CREATE ROLE veya
superuser yetkisi verilmedi. Mevcut üretim mimarisiyle uyumlu olarak BYPASSRLS
kullanır: öğretmen sahiplik kontrolleri uygulamada zorunlu kalır. Oluşturulan
geçici migration rolü `NOLOGIN` yapıldı ve şema oluşturma yetkisi kaldırıldı.
Şifreler bağımsız, kriptografik rastgele üretildi; bu belgeye veya repoya yazılmadı.

Runtime, doğrulanmış Shared Transaction Pooler adresini kullanır:

```text
postgresql://<app-role>.<preview-ref>:<secret>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

Sonraki schema değişikliklerinde normal `prisma migrate deploy` için yetkili
migration bağlantısı ve Session Pooler (`5432`) kullanılmalıdır; runtime
rolüne DDL yetkisi eklenmemelidir. Önce migration geçmişi/checksum doğrulanmalıdır.

## Google ve Vercel yapılandırması

Google Cloud `dusunce-izi-production` projesinde, mevcut canlı istemci
değiştirilmeden ayrı `Düşünce İzi Preview – navigation-feedback` istemcisi
oluşturuldu. Aynı Cloud projesindeki kitle/onay ekranı ayarları paylaşılır;
ayrı istemci, ayrı bir Google Cloud projesi anlamına gelmez.

- Origin: sabit Preview adresi.
- Callback: sabit Preview adresi + `/api/auth/callback/google`.
- OAuth yalnız mevcut Google test kullanıcılarına açıktır.

Aşağıdakiler yalnız `codex/navigation-feedback` Preview dalına bağlandı:

- Secret: `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Config: `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST=true`,
  `ENABLE_TEST_AUTH=false`.

Üretim değişkenleri korunur. `E2E_TEST_PASSWORD` tanımlanmaz; üretim build'inde
test sağlayıcısı açılmaz. Değişken güncellemesinden sonra mevcut test deployment'ı
`--target preview` ile yeniden derlemek gerekir; eski deployment yeni değişkenleri
kendiliğinden almaz. Test deployment'ı üretime promote edilmemelidir.

## Kabul ve kapsam sınırı

- CI'nin gerçek PostgreSQL + kapalı-kapsam test auth yaklaşımı değişmedi.
- Bu ortam öncelikle gerçek Google girişi ve öğretmen gezinmesi içindir.
- 20 Ekim'de `dpl_Ee69xhPJk8sn6eYRNjPPqmhVAzu5` Preview dağıtımı Ready oldu.
  Gerçek Google oturumuyla gösterge paneli açıldı; sentetik sınıf, öğrenci ve
  taslak sınav oluşturuldu. Sınıftan ana sayfaya dönüş, sınav detayından boş
  incelemeye geçiş/geri dönüş ve analitik ekranı gerçek tarayıcıda doğrulandı.
  Ayrıntılı sonuçlar [gezinme belgesindedir](NAVIGATION_RESPONSIVENESS.md).
- Medya kovası, ayrı Storage sunucu anahtarı, yapay zekâ anahtarı ve dakikalık
  processing scheduler henüz bu Preview ortamında kurulmadı. Bu yüzden medya,
  OCR/transkripsiyon, AI değerlendirmesi ve tam readiness doğrulaması bu ortamda
  tamamlanmış sayılamaz. Kuyruk tablolarının varlığı, çalışan worker kanıtı değildir.
- Yalnız sentetik sınıf, öğrenci ve sınav verileri kullanılmalıdır.
- Mobil gezinmenin CI testi geçti; gerçek Google oturumundaki son mobil
  görsel kontrol ve çıkış/yeniden giriş turu, uygulama içi tarayıcı oturumunun
  kapanması nedeniyle tamamlanamadı. Yeni Chrome oturumu Vercel girişini bekliyor;
  Deployment Protection kapatılmadı.
- Test verileri yalnız bu ortamda bırakıldı: `QA Önizleme 8-A • 20 Ekim`,
  okul numarası `QA20261020` olan `Deneme Öğrencisi` ve yayımlanmamış
  `QA Gezinme Sınavı • 20 Ekim`. Canlı verilerin kopyası değildir.
- Mevcut deployment Functions bölgesi `iad1`, veritabanı `eu-west-1` idi.
  Bölge farkı gecikme yaratabilir; bölge değişikliği bu kurulumda uygulanmadı.
- Başka bir öğretmenin oturumuyla veri ayrımı, Safari/Firefox ve gerçek mikrofon
  kaydı ayrı kabul testleri olarak kalır.

Kaynaklar: [Prisma migration tablosu](https://github.com/prisma/prisma-engines/blob/main/schema-engine/ARCHITECTURE.md),
[Supabase bağlantı modları](https://supabase.com/docs/guides/database/connecting-to-postgres),
[RLS bilgi notunun açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
