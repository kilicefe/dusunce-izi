# DÜŞÜNCE İZİ — Vercel ve Supabase üretim dağıtımı

Bu belge 22 Ağustos 2026 tarihinde doğrulanan üretim topolojisini ve tekrar edilebilir dağıtım sırasını açıklar.

## Üretim topolojisi

- Uygulama: `https://dusunce-izi.vercel.app`
- Sunucu: Vercel Next.js Functions, Node.js 24
- Veritabanı ve özel medya: Supabase `EduAnalytics` (`eu-west-1`)
- Google OAuth: Google Cloud `Dusunce Izi Production` (`dusunce-izi-production`)
- Runtime veritabanı bağlantısı: Supabase Transaction Pooler, port `6543`
- Kuyruk: PostgreSQL `ResponseProcessingJob`
- Ana zamanlayıcı: Supabase Cron, dakikada bir
- Emniyet zamanlayıcısı: Vercel Cron, her gün 03:00 UTC

Vercel Hobby planı dakikalık Cron kabul etmez. Bu nedenle `vercel.json` yalnız günlük emniyet çağrısını içerir; pilot gecikmesini sağlayan dakikalık iş Supabase Cron'dur.

## 1. Supabase hazırlığı

1. Yedek alın ve migration geçmişini doğrulayın.
2. Aşağıdaki uygulama migration'larını sırayla uygulayın:
   - `20260806000000_init`
   - `20260814000000_pilot_media_tokens_queue`
   - `20260814170000_secure_public_schema_rls`
   - Son migration Supabase'in `anon` ve `authenticated` rollerini yalnız mevcutlarsa hedefler. Böylece aynı migration standart PostgreSQL doğrulama ortamında rol oluşturma yan etkisi olmadan çalışır; Supabase'te browser-role grant'leri kaldırılmaya devam eder.
3. `pilot-media` kovasını private oluşturun. `anon` veya `authenticated` için upload/read policy eklemeyin.
4. Scheduler için `pg_net` ve `pg_cron` uzantılarını etkinleştirin. Canlı ortamda bu adım Supabase migration geçmişine `enable_processing_scheduler_extensions` olarak yazılmıştır.
5. Security Advisor'ı çalıştırın. Sunucuya özel 50 tabloda `rls_enabled_no_policy` bilgi kaydı beklenir; kritik/yüksek uyarı kabul edilmez.

Runtime bağlantısı yalnız sunucu rolüyle Transaction Pooler kullanır:

```env
DATABASE_URL="postgresql://<app-role>.<ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

Migration komutlarında aynı URL'yi kullanmayın. DDL için `postgres` migration rolü ve Session Pooler (`5432`) ya da Supabase migration aracı kullanılmalıdır.

## 2. Vercel environment değişkenleri

Production hedefinde aşağıdakiler tanımlanmalıdır:

```text
DATABASE_URL
AUTH_SECRET
AUTH_URL=https://dusunce-izi.vercel.app
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_APP_URL=https://dusunce-izi.vercel.app
ENABLE_TEST_AUTH=false
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_MEDIA_BUCKET=pilot-media
PROCESSING_WORKER_SECRET
CRON_SECRET
MEDIA_SIGNED_URL_TTL_SECONDS=300
```

`AUTH_SECRET`, Google secret, Gemini anahtarı, Supabase service-role anahtarı ve worker secret Vercel'de **Sensitive** tutulur. `PROCESSING_WORKER_SECRET` ile `CRON_SECRET` aynı en az 32 karakterlik rastgele değer olmalıdır. Hiçbiri `NEXT_PUBLIC_` öneki taşımamalıdır.

Production'da `ENABLE_TEST_AUTH=true` ayarlamayın ve `E2E_TEST_PASSWORD` tanımlamayın. Kod bu sağlayıcıyı production'da yine de devre dışı bırakır.

Preview deployment'lara production Google secret'larını otomatik kopyalamayın. Preview'da `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` yoksa build tamamlanır fakat Google sağlayıcısı eklenmez ve giriş kapalı kalır. Preview üzerinde giriş testi gerekiyorsa ayrı OAuth istemcisi, preview callback URL'si ve yalnız Preview hedefli Sensitive env değerleri kullanın. `VERCEL_ENV=production` için Google OAuth zorunluluğu değişmez.

## 3. Google OAuth

Google Cloud'da Web application türünde istemci oluşturun:

- Authorized JavaScript origin: `https://dusunce-izi.vercel.app`
- Authorized redirect URI: `https://dusunce-izi.vercel.app/api/auth/callback/google`

Google Auth Platform marka ve kitle ayarlarında uygulama adı `Düşünce İzi` olmalıdır. Pilot yalnız davetli hesaplarla yürütülecekse uygulamayı External + Testing konumunda tutup öğretmenleri test kullanıcısı ekleyin; daha geniş kullanım için doğrulama/yayın sürecini tamamlayın.

Canlı ortamda bu istemci 22 Ağustos 2026'da `dusunce-izi-production` projesinde oluşturuldu. `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` Vercel Production hedefinde Sensitive olarak saklandı ve ardından production yeniden dağıtıldı. İstemci secret'ını belgeye, `.env` dosyasına veya CI çıktısına yazmayın.

## 4. Dağıtım

```bash
npm ci
npm run lint
npm test
npm run build
vercel link --yes --project dusunce-izi
vercel deploy --prod --yes
```

`.vercelignore`, yerel `.next*`, `node_modules`, test çıktıları ve `.env.*` dosyalarının deployment paketine girmesini engeller.

Environment değişikliği mevcut deployment'ı değiştirmez; her secret veya URL değişiminden sonra yeniden production deploy gerekir.

## 5. Dakikalık worker zamanlayıcısı

Supabase Vault'ta iki secret tutulur:

- `dusunce_izi_processing_base_url`
- `dusunce_izi_processing_worker_secret`

`dusunce-izi-processing-drain` adlı Cron işi dakikada bir aşağıdaki uç noktayı çağırır:

```text
GET https://dusunce-izi.vercel.app/api/internal/processing/drain?limit=10
Authorization: Bearer <PROCESSING_WORKER_SECRET>
```

Uzantılar etkin ve admin/migration bağlantısı hazır olduğunda yapılandırma betiği tekrar çalıştırılabilir:

```bash
PRODUCTION_BASE_URL=https://dusunce-izi.vercel.app \
PROCESSING_WORKER_SECRET=<secret> \
DATABASE_URL=<admin-session-pooler-url> \
npm run configure:production-scheduler
```

Betik Vault secret'larını günceller, aynı isimli Cron işini idempotent biçimde yeniler ve secret değerlerini loglamaz.

## 6. Doğrulama

Dağıtımdan sonra:

1. `GET /api/readiness` HTTP 200 ve bütün bayraklar `true` olmalıdır.
2. `/` oturumsuz kullanıcıyı `/sign-in` sayfasına yönlendirmelidir.
3. Google giriş callback'i production alan adına dönmelidir.
4. Supabase `cron.job_run_details` son çalışmayı `succeeded`, `net._http_response` son çağrıyı HTTP 200 göstermelidir.
5. Yeni öğrenci attempt'inde yalnız 64 karakterlik `attemptTokenHash` saklanmalıdır.
6. Medya kayıtları `supabase://pilot-media/...` biçiminde olmalı, kova public olmamalıdır.
7. Submit edilen kuyruk işi `QUEUED -> RUNNING -> COMPLETED` ilerlemelidir.

16 Ağustos 2026 veri/queue doğrulamasında readiness HTTP 200 döndü; iki attempt hash'i geçerliydi, iki medya kaydı güvenliydi, altı kuyruk işi tamamlanmıştı ve dakikalık scheduler anahtar rotasyonundan sonraki çağrılarda HTTP 200 aldı. 22 Ağustos 2026'da gerçek Google OAuth anahtarları Vercel'e taşındı ve deployment `dpl_3FcWj1YzQF6RzcrdQ4NgUsUW57EM` production alan adına başarıyla alias edildi.

22 Ağustos 2026 uçtan uca canlı smoke testinde test kullanıcısı Google OAuth ile `/dashboard` sayfasına ulaştı. `RYB5N9` sınavında `T9003` sentetik öğrencisi iki metin ve bir sentetik WebM ses yanıtı gönderdi; attempt `SUBMITTED`, token hash uzunluğu 64, ses referansı `supabase://pilot-media/...` ve iki processing işi kalıcı kuyrukta doğrulandı. Geçersiz öğrenci numarasının production'da redakte React hatası göstermemesi için beklenen giriş hataları tipli server-action sonucu yapıldı ve iki regresyon testi eklendi. Gerçek `MediaRecorder` düzeltmesini içeren son deployment `dpl_G1emvVJAAZxFEAENfc8rryPFmFTJ` production alan adına alias edildi.

## Kalan operasyonel riskler

- Vercel Hobby Cron yalnız günlük çalışır; dakikalık Supabase Cron kapatılırsa işleme ertesi emniyet çağrısına kadar gecikir. Cron ve HTTP yanıtları için alarm kurulmalıdır.
- Supabase service-role anahtarı Storage genelinde yüksek yetkilidir; modern `sb_secret_...` anahtarına kontrollü geçiş ve rotasyon planlanmalıdır.
- Eski prototip tablolarında performans danışmanı uyarıları vardır. Bunlar Prisma pilot tablolarından ayrıdır fakat veri API yüzeyi ve RLS politikaları ayrı bir bakım turunda sadeleştirilmelidir.
- Ses düğmesi gerçek tarayıcı `MediaRecorder` akışını, desteklenen MIME seçimini, kayıt süresini ve stream temizliğini kullanır. Pilot cihaz/tarayıcı matrisinde mikrofon izni, gerçek kayıt ve sağlayıcı transkripsiyonu ayrıca kabul testinden geçirilmelidir.
- Malware taraması, içerik moderasyonu ve EXIF temizleme henüz yoktur.
- Google OAuth uygulaması External + Testing durumundadır; yalnız Google Auth Platform'a eklenen test kullanıcıları giriş yapabilir. Pilot dışına açılmadan önce yayınlama/doğrulama gereksinimleri tamamlanmalıdır.
- Canlı sentetik ses fixture işi Gemini'dan üç kez `500 INTERNAL` alarak kontrollü biçimde `FAILED` oldu; metin işi `COMPLETED` kaldı. Kuyruk teslimi kaybetmedi ve retry sınırını uyguladı; `RETRY_SCHEDULED`/`FAILED` alarmı, sağlayıcı hata oranı takibi ve manuel requeue prosedürü pilot operasyonunun parçası olmalıdır.
