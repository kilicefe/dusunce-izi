# Pilot Hardening

Bu dal, gerçek pilot öncesi kimlik doğrulama, PostgreSQL doğrulaması, öğrenci medyası ve arka plan işleme güvenliğini kapsar.

## Uygulanan kontroller

### Auth ve CI tabanı (ilk tur, korundu)

- Parolasız e-posta tabanlı test girişi kaldırıldı.
- Credentials sağlayıcısı yalnızca `ENABLE_TEST_AUTH=true` ve production dışı ortamlarda etkinleşir.
- Test girişi için `E2E_TEST_PASSWORD` zorunludur.
- Gerçek production ortamında Auth secret veya Google OAuth yapılandırması eksikse uygulama açık hata verir. Vercel Preview, Google secret'ları paylaşılmadığında sağlayıcı eklemeden ve her sunucu örneğinde kriptografik rastgele geçici auth secret kullanarak kapalı davranır; oturum üretilemez/sürdürülemez ve test credentials production build'inde yine açılamaz.
- Test kullanıcı arayüzü production ortamında gösterilmez.
- GitHub Actions, PostgreSQL 16 üzerinde migration, sentetik seed, type-check, Vitest, production build ve Playwright çalıştırır.
- `package-lock.json` eklendi; PR'daki `npm ci` adımı artık kilitli ve tekrar üretilebilir kurulum yapar.

### Özel medya depolama

- Görsel ve ses data URL'leri veritabanına yazılmadan önce sunucu tarafında allow-list MIME ve boyut kontrollerinden geçer.
- Medya, private Supabase Storage kovasına service-role istemcisiyle yazılır. Service-role anahtarı hiçbir `NEXT_PUBLIC_` değişkeninde veya istemci paketinde kullanılmaz.
- Veritabanı sadece `supabase://bucket/object-path` biçiminde opak referans tutar.
- Tarayıcıya en fazla 10 dakika, varsayılan 5 dakika geçerli imzalı URL verilir. Public bucket URL'si kullanılmaz.
- Öğrenci yalnızca mevcut yanıtına ait depolama referanslarını yeniden kullanabilir; başka bir yanıttan nesne referansı enjekte edemez.
- Yanıt medyası değiştirildiğinde kaldırılan private nesneler için silme işlemi yapılır.
- Legacy Base64 kayıtlarını private kovaya taşıyan `npm run migrate:legacy-media` backfill komutu eklendi.
- Readiness yalnız environment değişkenlerine bakmaz; yapılandırılan kovanın Supabase'de gerçekten var ve private olduğunu da doğrular. Yanlış kova adı veya public kova 503 üretir.

Supabase private bucket ve service-key davranışı için: [Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control).

### Hashed attempt token

- Production PostgreSQL yolunda 32 bayt kriptografik rastgele attempt token üretilir.
- Veritabanına token'ın kendisi değil, SHA-256 özeti (`attemptTokenHash`) yazılır.
- Bütün attempt sorguları gelen token'ı hashleyerek yapılır; hash istemciye serialize edilmez.
- Öğrenci tekrar giriş yaptığında önceki token yeniden kullanılmaz; yeni token üretilip hash atomik olarak döndürülür. Eski URL bu işlemden sonra geçersizdir.
- Development bellek adaptörü sadece production dışında eski test modelini kullanmaya devam eder.

### Kalıcı ve dağıtık işlem kuyruğu

- `ResponseProcessingJob` artık gerçek PostgreSQL kuyruğudur; submit ve reanalysis istekleri request içinde AI çalıştırmaz.
- Enqueue, benzersiz `idempotencyKey` ile tekrar çağrılabilir.
- Worker claim işlemi `FOR UPDATE SKIP LOCKED` kullanır; aynı iş iki worker tarafından aynı anda claim edilemez.
- İşler süreli lease ve heartbeat kullanır. Worker çökerse lease dolduğunda iş başka worker tarafından yeniden alınabilir.
- Hatalar 30 saniyeden başlayıp 15 dakikada sınırlanan üstel backoff ile yeniden denenir; `maximumAttempts` sonrası `FAILED` olur.
- AI çıktıları tek DB transaction'ında yazılır. `processingJobId` ile benzersiz snapshot, crash sonrası aynı işin DB çıktılarının ikinci kez yazılmasını engeller.
- Yetkili worker girişi `GET/POST /api/internal/processing/drain?limit=1` yoludur. `Authorization: Bearer <PROCESSING_WORKER_SECRET>` zorunludur; `CRON_SECRET` da desteklenir.
- `/api/readiness`, PostgreSQL, private storage, AI sağlayıcısı veya worker secret yapılandırmalarından biri eksikse 503 döndürür.

### AI çıktı sözleşmesi ve rapor tutarlılığı

- Gemini'ye Zod analiz sözleşmesinden üretilen, desteklenmeyen JSON Schema anahtarları temizlenmiş structured-output şeması gönderilir.
- HOTS şeması yalnız soruda hedeflenen becerileri içerir; bu hem sağlayıcı şema karmaşıklığını düşürür hem de modelin soruyla ilgisiz alanlar üretmesini engeller.
- Öğretmen raporu tamamlanmayı geçici workflow statüsünden değil kalıcı `submittedAt` alanından hesaplar; `PROCESSING` ve `NEEDS_TEACHER_REVIEW` durumları teslimi sayaçtan düşürmez.
- “İncelendi” sayısı ve CSV yalnız öğretmenin onayladığı analizleri kullanır. CSV çok sorulu denemelerde bütün onaylı yanıtların ortalamasını alır ve yalnız gerçekten saptanan kavram yanılgılarını dışa aktarır.
- Bir denemedeki bütün yanıtlar onaylandığında durum `TEACHER_REVIEWED` olur.

### Öğretmen arayüzü ve veri görünürlüğü

- `/dashboard` ve bütün `/classrooms` rotaları aynı öğretmen kabuğunu kullanır. Logo ana sayfaya döner; sınıf liste, yeni sınıf ve sınıf detay ekranlarında ana menü kaybolmaz.
- Ana menü aktif rotayı `aria-current="page"` ile belirtir. Mobilde öğretmen için üç kompakt sekme, yöneticide dört sekme tek satırda gösterilir.
- Oturumu olmayan kullanıcı korumalı öğretmen rotasına doğrudan geldiğinde genel React hata ekranına düşmek yerine `/sign-in` sayfasına yönlendirilir.
- Sınıf, öğrenci, sınav, attempt, yanıt ve öğretmen incelemesi mutasyonları ilgili dashboard/liste/detay rotalarını `revalidatePath` ile yeniler. Kullanıcı geri döndüğünde eski sınıf, öğrenci veya yanıt sayaçlarını görmez.
- Öğretmen inceleme kuyruğu `DRAFT` ve `IN_PROGRESS` denemelerdeki taslak öğrenci yanıtlarını göstermez. Yalnız teslim edilmiş veya işleme/inceleme aşamasına geçmiş denemeler görünür.

Queue locking ve transaction yaklaşımı için: [PostgreSQL 16 SELECT / SKIP LOCKED](https://www.postgresql.org/docs/16/sql-select.html), [Prisma raw queries and transactions](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries).

## Migration ve deployment sırası

1. **Yedek ve ön kontrol**
   - Pilot veritabanının snapshot/backup'ını alın.
   - Migration geçmişini `npx prisma migrate status` ile doğrulayın.
   - İlk migration daha önce `prisma migrate deploy` ile uygulandıysa ikinci migration eklemeli olarak çalışır.
   - Ortam geçmişte `prisma db push` ile oluşturulduysa tablo çakışması olabilir. Bu durumda doğrudan deploy etmeyin; önce gerçek şemayı çıkarıp migration baseline/reconciliation yapın.

2. **Private bucket oluşturma**
   - Supabase Dashboard'da `pilot-media` (veya `SUPABASE_MEDIA_BUCKET`) adlı **private** bucket oluşturun.
   - Görsel MIME allow-list: `image/jpeg`, `image/png`, `image/webp`; üst sınır 10 MiB.
   - Ses MIME allow-list: `audio/webm`, `audio/mpeg`, `audio/mp4`, `audio/ogg`, `audio/wav`; üst sınır 25 MiB.
   - Tarayıcı için `anon`/`authenticated` upload veya select policy eklemeyin. Bu uygulama bütün depolama erişimini yetkilendirilmiş sunucu kodundan yapar.

3. **Secret ve environment değişkenleri**
   - Mevcut auth/DB değişkenlerine ek olarak aşağıdakileri deployment secret store'a yazın:
     - `SUPABASE_URL`
     - Tercihen `SUPABASE_SECRET_KEY` (`sb_secret_...`, yalnız sunucu). Geçiş döneminde legacy `SUPABASE_SERVICE_ROLE_KEY` de desteklenir; ikisini birlikte tanımlamayın.
     - `SUPABASE_MEDIA_BUCKET=pilot-media`
     - `PROCESSING_WORKER_SECRET` veya platformun `CRON_SECRET` değeri (en az 32 rastgele karakter)
     - `GEMINI_API_KEY`
     - İsteğe bağlı: `MEDIA_SIGNED_URL_TTL_SECONDS`, `MEDIA_MAX_IMAGE_BYTES`, `MEDIA_MAX_AUDIO_BYTES`, `PROCESSING_JOB_LEASE_SECONDS`

4. **Kod ve şema dağıtımı**
   - `npm ci`
   - `npx prisma generate`
   - `npx prisma migrate deploy`
   - İkinci migration, ilk migration'da eksik olan sınav/yanıt/işleme tablolarını ve `attemptTokenHash`, queue lease/index ve idempotent snapshot alanlarını oluşturur. İlk migration'daki enum'ları yeniden oluşturmamalıdır; hedefli test bu zinciri korur.
   - Üçüncü migration (`20260814170000_secure_public_schema_rls`) 50 Prisma/pilot tablosunda RLS'yi etkinleştirir, mevcutsa `anon`/`authenticated` tablo grant'lerini kaldırır ve eski profil trigger fonksiyonunun public RPC olarak çağrılmasını engeller. Rol varlığı `pg_roles` üzerinden koşullu denetlendiği için migration Supabase rollerini içermeyen standart PostgreSQL 16 CI üzerinde de uygulanır; roller yapay olarak oluşturulmaz.
   - Supabase'te migration rolü `postgres` olmalıdır. Runtime `DATABASE_URL` için kullanılan `dusunce_izi_app` rolü DDL çalıştırmaz; yalnız sunucu bağlantısı için `BYPASSRLS` alır.
   - Öğretmen arayüzü/route-shell düzeltmesi yeni bir veritabanı migration'ı gerektirmez. Mevcut migration zinciri değişmeden uygulama deployment'ı yapılır.

5. **Supabase Data API yüzeyini kapatma**
   - Prisma tabloları `public` şemasında kaldığı için Supabase Data API bunları otomatik olarak görür. Pilot trafiğini açmadan önce bütün uygulama tablolarında RLS'yi etkinleştirin.
   - Bu uygulama Data API üzerinden tablo erişimi kullanmaz; `anon` veya `authenticated` için uygulama tablolarına policy eklemeyin ve doğrudan tablo yetkilerini kaldırın.
   - Prisma'nın kullandığı yalnız-sunucu PostgreSQL rolü `BYPASSRLS` yetkisine sahip olmalı veya tabloların sahibi olmalıdır. Bu rolün bağlantı bilgisi yalnız deployment secret store'da tutulmalıdır.
   - RLS migration'ından önce aynı rol ile `SELECT 1`, `npx prisma migrate status`, oturum açma ve dashboard sorgularını doğrulayın. RLS sonrasında Supabase security advisor'da `rls_disabled_in_public` hatası kalmamalıdır. Data API erişimini bilerek tamamen kapattığımız için `rls_enabled_no_policy` bilgi kayıtları beklenir.
   - Eski prototip tablolarının mevcut RLS policy'lerini bu migration içinde değiştirmeyin; bunlar ayrı bir politika/performance incelemesidir.

6. **Legacy medya backfill**
   - Uygulama trafiğini bakım moduna alın veya medya yanıt yazımlarını kısa süre durdurun.
   - `npm run migrate:legacy-media` çalıştırın.
   - Komut data URL'leri private kovaya taşır ve DB referanslarını atomik koşullu update ile değiştirir.
   - Komut `blob:`, `/uploads/...` veya başka desteklenmeyen referans bulursa non-zero çıkar; bu satırları elle incelemeden devam etmeyin.

7. **Worker/scheduler dağıtımı**
   - En az dakikada bir `/api/internal/processing/drain?limit=10` çağıran scheduler kurun.
   - Header: `Authorization: Bearer <PROCESSING_WORKER_SECRET>`.
   - Vercel Hobby planı dakikalık Cron'u reddeder. Bu ortamda ana scheduler, `pg_cron` + `pg_net` kullanan Supabase Cron'dur; secret Supabase Vault'ta tutulur. `vercel.json` her gün 03:00 UTC çalışan emniyet çağrısını korur.
   - `pg_cron` ve `pg_net` uzantılarını migration rolüyle etkinleştirin. `PRODUCTION_BASE_URL`, `PROCESSING_WORKER_SECRET` ve admin bağlantısı verilerek `npm run configure:production-scheduler` komutu idempotent biçimde çalıştırılabilir.
   - Uzun AI işleri platform request süresini aşarsa aynı queue API'sini kullanan ayrı sürekli worker çalıştırın; birden fazla worker güvenle paralel çalışabilir.

8. **Doğrulama ve trafik açma**
   - `/api/readiness` için 200 bekleyin.
   - Readiness yanıtından önce `SUPABASE_MEDIA_BUCKET` değerinin Dashboard'daki private kova adıyla birebir eşleştiğini doğrulayın; yalnız anahtarların tanımlı olması yeterli değildir.
   - Yeni bir öğrenci girişinden sonra DB'de yalnızca 64 karakterlik `attemptTokenHash` bulunduğunu doğrulayın.
   - Görsel ve ses yanıtı yükleyip DB'de `supabase://` referansı, tarayıcıda süreli signed URL oluştuğunu doğrulayın.
   - Bir attempt submit edin; işin `QUEUED -> RUNNING -> COMPLETED` ilerlediğini ve teacher review kaydı oluştuğunu doğrulayın.
   - Öğretmen hesabıyla `/dashboard -> /classrooms -> /classrooms/new -> /classrooms/{id}` akışını izleyin; her adımda logo ve ana menünün görünür, aktif menü işaretinin doğru olduğunu doğrulayın.
   - 390×844 mobil görünümde menünün tek satırda kaldığını, form alanlarının taşmadığını ve logo ile dashboard'a dönülebildiğini doğrulayın.
   - Teslim edilmemiş (`IN_PROGRESS`) bir attempt'in öğretmen inceleme kuyruğunda görünmediğini; submit sonrası sayfa yenilenmeden doğru sayaçların geldiğini doğrulayın.
   - Önerilen salt-okunur kontroller:

```sql
SELECT count(*) AS invalid_attempt_hashes
FROM "ExamAttempt"
WHERE length("attemptTokenHash") <> 64;

SELECT count(*) AS insecure_media_references
FROM (
  SELECT "storageUrl" FROM "ImageResponse"
  UNION ALL
  SELECT "storageUrl" FROM "AudioResponse"
) media
WHERE "storageUrl" NOT LIKE 'supabase://%';

SELECT "status", count(*)
FROM "ResponseProcessingJob"
GROUP BY "status"
ORDER BY "status";
```

## 16 Ağustos 2026 üretim doğrulaması

- Vercel projesi `kilicefes-projects/dusunce-izi` oluşturuldu ve `https://dusunce-izi.vercel.app` alan adına bağlandı.
- Supabase `EduAnalytics` projesi `ACTIVE_HEALTHY`; pilot medya/token/queue ve RLS migration'ları kayıtlıdır.
- `/api/readiness` HTTP 200 döndürdü: database, mediaStorage, processingWorker ve aiProvider kontrolleri `true`.
- İki `ExamAttempt` kaydında geçersiz hash yok; bir görsel ve bir ses kaydında güvensiz medya referansı yok; `pilot-media` private.
- Altı `ResponseProcessingJob` `COMPLETED` durumunda.
- `dusunce-izi-processing-drain` Supabase Cron işi dakikada bir aktif. Worker secret rotasyonundan sonraki iki HTTP çağrısı 200 döndü.
- Vercel production build Next.js 16.3.1 ile geçti; `npm audit` sıfır güvenlik açığı, TypeScript sıfır hata ve Vitest 82 başarılı / 1 koşullu atlanan test bildirdi.
- 22 Ağustos 2026'da ayrı Google Cloud `dusunce-izi-production` projesinde gerçek Web OAuth istemcisi oluşturuldu; production origin/callback tanımlandı, anahtarlar Vercel'de Sensitive saklandı ve deployment `dpl_3FcWj1YzQF6RzcrdQ4NgUsUW57EM` canlı alana başarıyla alias edildi.
- Aynı gün fiziksel production smoke testinde Google test kullanıcısı öğretmen paneline ulaştı; `T9003` sentetik öğrencisinin iki yanıtlı attempt'i `SUBMITTED`, token'ı yalnız 64 karakterlik hash, WebM sesi private `supabase://pilot-media/...` referansı ve iki idempotent processing işiyle doğrulandı. Geçersiz roster numarasının redakte React hatasına dönüşmesi tipli server-action hata sonucu ve iki regresyon testiyle giderildi.
- Gerçek `MediaRecorder`, tarayıcı format seçimi ve mikrofon hata durumlarını içeren son production deployment `dpl_G1emvVJAAZxFEAENfc8rryPFmFTJ` olarak yayımlandı; canlı UI'da roster uyarısı, öğretmen oturumu, sınıf/sınav modülleri ve ses kayıt paneli konsol hatası olmadan açıldı.
- Öğretmen gezinme ve veri görünürlüğü düzeltmeleri 22 Ağustos 2026'da `dpl_AnZU8uy8aHAs6atLmZ2wzdTADxVj` deployment'ı olarak production'a alındı. Fiziksel smoke testte dashboard → sınıflar → yeni sınıf → sınıf detayı → logo ile dashboard, sınav listesi ve inceleme kuyruğu akışları hatasız çalıştı; 2 sınıf / 1 öğrenci / 1 attempt sayaçları tutarlıydı, `IN_PROGRESS` yanıt inceleme kuyruğuna girmedi ve tarayıcı konsolunda hata oluşmadı. `/api/readiness` database, mediaStorage, processingWorker ve aiProvider kontrollerinin tamamı `true` olacak şekilde HTTP 200 döndürdü.

## Rollback sınırları

- Token hash migrasyonundan sonra ham attempt token DB'den geri üretilemez. Eski uygulama sürümüne şema rollback'i yapılmamalıdır; gerekiyorsa tüm aktif öğrenci attempt token'ları yeni girişle döndürülmelidir.
- Medya backfill sonrasında eski uygulama `supabase://` referanslarını gösteremez. Uygulama rollback'i gerekiyorsa yeni uygulamanın media proxy/signed-URL katmanı korunmalıdır.
- Queue migration geri alınmadan önce `QUEUED`, `RUNNING` ve `RETRY_SCHEDULED` işleri boşaltılmalı veya kontrollü biçimde iptal edilmelidir.

## Hedefli test kapsamı

- Attempt token entropy, deterministik hash ve ham token'ın persistence nesnesinde bulunmaması.
- MIME allow-list, Base64 doğrulaması ve storage path traversal reddi.
- Worker bearer secret doğrulaması ve retry backoff sınırı.
- Ardışık migration dosyalarında aynı PostgreSQL enum'unun yeniden oluşturulmaması.
- RLS migration'ında 50 tablonun tamamının korunması, browser rollerinin grant'lerinin kaldırılması ve istemci policy'si oluşturulmaması.
- Gerçek PostgreSQL CI üzerinde idempotent enqueue, tek worker claim, retry, yeniden claim ve completion zinciri.
- Mevcut auth testleri, type-check, production build ve Playwright akışı korunur.
- Gemini structured-output şemasının zorunlu analiz zarfını koruması, hedeflenmeyen HOTS alanlarını göndermemesi ve sağlayıcıda gerçek istekle kabul edilmesi.
- İşleme statüsü değişmiş teslimlerin analitikte tamamlanmış sayılması, yalnız öğretmen onaylarının incelenmiş sayılması ve çok sorulu CSV ortalaması.
- Readiness'in eksik/public Supabase medya kovasını reddetmesi.
- Sınıf alt rotalarında öğretmen kabuğunun korunması, mobil menünün erişilebilir adları ve oturumsuz doğrudan rota yönlendirmesi için Playwright regresyonları.
- Öğrenci sınava başladıktan sonra öğretmen rotalarının yenilenmesi ve `IN_PROGRESS` yanıtların inceleme kuyruğundan dışlanması için hedefli Vitest regresyonları.

## Kalan riskler ve operasyonel gereksinimler

- Supabase security advisor, RLS migration'ı uygulanmayan yeni ortamlarda 50 `public` tablo için `rls_disabled_in_public` hatası verir; varsayılan grant'ler bu tabloları `anon` ve `authenticated` rollerine açabilir. Bu durum pilot trafiğini açmayı engelleyen bir release gate'tir.
- Supabase secret/service-role anahtarı Storage genelinde yüksek yetkilidir. Secret yalnız sunucuda tutulmalı, erişimi deployment rolleriyle sınırlandırılmalı ve düzenli döndürülmelidir. Bu yetkiyle oluşturulan nesnelerde `owner_id` beklenmez; nesne yetkilendirmesi uygulamanın server-side attempt/teacher kontrollerine dayanır.
- EduAnalytics ortamında `dusunce_izi_backend` adlı modern secret key oluşturuldu; Dashboard reveal servisi hata verdiği için mevcut local süreç geçici olarak legacy `service_role` fallback'ini kullanıyor. Modern anahtar okunup secret store'a taşındıktan sonra legacy anahtar devreden çıkarılmalı; kullanılmayacaksa yeni anahtar silinmelidir.
- Signed URL süre dolana kadar kullanılabilir; acil erişim kesme gerektiğinde nesne silinmelidir. CDN invalidation anlık olmayabilir.
- Queue DB çıktıları idempotenttir ancak at-least-once teslimatta worker lease kaybettikten sonra dış AI çağrısı tekrarlanabilir ve ek maliyet doğurabilir. Queue backlog, yaşlı `RUNNING` işler, retry oranı ve AI maliyeti için alarm kurulmalıdır.
- Scheduler/worker kesintisi kullanıcı submit'ini kaybetmez fakat analiz gecikir. Vercel Hobby Cron yalnız günlük emniyet çağrısıdır; dakikalık Supabase Cron ve `net._http_response` sonuçları izlenmelidir. `FAILED` işler için operasyonel dead-letter inceleme ve manuel requeue prosedürü gerekir.
- Canlı sentetik ses fixture işinde Gemini üç kez `500 INTERNAL` döndürdü; durable queue 30/60 saniyelik retry/backoff'u uygulayıp işi `FAILED` yaptı, eşzamanlı metin işi `COMPLETED` kaldı. Bu sonuç sağlayıcı hata oranı, retry tüketimi, son `FAILED` durumları ve manuel requeue için alarm/prosedür gereksinimini somutlaştırır.
- Backfill yalnız Base64 data URL'lerini otomatik taşır. `blob:` veya yerel dosya yolu referansları kaynak dosyaya erişim gerektirdiği için manuel kurtarma ister.
- Dosya türü/boyut kontrolü vardır; malware taraması, içerik moderasyonu ve EXIF temizleme henüz yoktur. Pilot veri politikasına göre bunlar ayrıca değerlendirilmelidir.
- Dependency release gate'i tamamlandı: Next.js 16.3.1, React 19.2.8, Auth.js beta.32 ve Playwright 1.62.1'e yükseltildi; `npm audit` sıfır bulgu ve production build başarıyla tamamlandı. Yeni major sürüm nedeniyle pilotta hata oranı ve Auth callback logları yakından izlenmelidir.
- `VERCEL_ENV=production` veya Vercel dışı production build gerçek `AUTH_SECRET`, `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` olmadan bilerek başarısız olur. Vercel Preview bu secret'ları devralmıyorsa build geçer ancak Google sağlayıcısı hiç eklenmez; kalıcı env secret yerine örnek başına rastgele secret kullanıldığı için giriş ve oturum sürekliliği kapalı kalır. Preview üzerinde OAuth smoke testi isteniyorsa ayrı Preview istemcisi/callback'i, Preview-scoped Sensitive Google env'leri ve kalıcı Preview `AUTH_SECRET` tanımlanmalıdır. Canlı ortamda gerçek anahtarlar ve `https://dusunce-izi.vercel.app/api/auth/callback/google` callback'i yapılandırıldı; yerel test credentials sağlayıcısı production'da açılamaz. OAuth uygulaması External + Testing durumunda kaldığı için yalnız test kullanıcısı eklenen öğretmenler giriş yapabilir; pilot genişlemeden önce yayınlama/doğrulama süreci tamamlanmalıdır.
- `GEMINI_API_KEY` olmadan uygulama geliştirme fallback'iyle sınırlı analiz üretebilir fakat readiness 503 kalır; pilot kabulü gerçek model anahtarı ve maliyet/kota alarmlarıyla yapılmalıdır.
- Öğrenci portalındaki ses düğmesi gerçek mikrofon `MediaRecorder` akışına geçirildi; desteklenen WebM/Opus, WebM veya MP4 türü seçilir, süre kaydedilir ve stream/track'ler temizlenir. Mikrofon erişimi hassas kullanıcı izni gerektirdiği için gerçek cihaz kaydı otomasyonda açılmadı; pilot cihaz/tarayıcı matrisinde izin reddi, gerçek kayıt ve transkripsiyon kabul testi sürmektedir.
- Çok sayıda HOTS becerisinin aynı soruda hedeflendiği uç durum Gemini structured-output şema karmaşıklık sınırına yaklaşabilir. Pilot soru şablonlarında beceri sayısı sınırlandırılmalı ve desteklenen azami seçim için sağlayıcı regresyon testi eklenmelidir.
- Öğretmen kabuğuyla sarılan dashboard ve sınıf rotalarında oturumsuz doğrudan erişim `/sign-in` sayfasına yönlendirilir. `/admin` gibi kabuğu ayrı kalan korumalı rotalarda aynı davranış ayrıca regresyon testiyle izlenmelidir.
- EduAnalytics local doğrulaması Google AI Studio'daki mevcut `eduanaltc360` anahtarını yalnız process environment içinde kullandı; yeni `dusunce-izi-backend` anahtar isteği Google tarafından `suspicious request` olarak reddedildi. Pilot deployment öncesinde uygulamaya özel anahtar oluşturulmalı veya mevcut anahtarın diğer tüketicileri envanterlenip kontrollü rotasyon yapılmalı; anahtar hiçbir kaynak dosyasına yazılmamalıdır.
- Production dışı bellek adaptörleri geliştirici testleri için kalır. Pilot kabulü yalnız gerçek PostgreSQL CI ve production-benzeri ortam üzerinden yapılmalıdır.
- Eski prototip tabloları (`profiles`, `siniflar`, `sinavlar`, `sorular`, `cevaplar` ve ilişkili tablo) mevcut Supabase RLS politikalarını kullanır. Performance Advisor bu yüzeyde `auth_rls_initplan`, çoklu permissive policy ve eksik FK index uyarıları verir; Prisma pilot tablolarından ayrı bir politika/performance bakım turu gereklidir.
