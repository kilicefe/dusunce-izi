# Pilot Hardening

Bu dal, gerçek pilot öncesi doğrulama ve güvenlik iyileştirmelerini içerir.

## İlk tur

- Parolasız e-posta tabanlı test girişi kaldırıldı.
- Credentials sağlayıcısı yalnızca `ENABLE_TEST_AUTH=true` ve production dışı ortamlarda etkinleşir.
- Test girişi için `E2E_TEST_PASSWORD` zorunludur.
- Production ortamında Google OAuth yapılandırması eksikse uygulama açık hata verir.
- GitHub Actions üzerinde gerçek PostgreSQL 16 servisiyle migration, seed, build, Vitest ve Playwright akışı eklendi.
- Test kullanıcı arayüzü production ortamında gösterilmez.

## Henüz çözülmeyen pilot engelleri

- Öğrenci görsel ve sesleri hâlen Base64/data URL olarak veritabanına yazılabiliyor; gerçek özel nesne depolamaya taşınmalı.
- Attempt token değerleri doğrudan saklanıyor; hash tabanlı oturum yaklaşımına geçirilmeli.
- Development bellek adaptörleri production dışı ortamda kullanılabiliyor; pilot doğrulaması gerçek PostgreSQL CI üzerinden yapılmalıdır.
- Arka plan işlem kuyruğu kalıcı ve dağıtık olarak ayrıca doğrulanmalıdır.
