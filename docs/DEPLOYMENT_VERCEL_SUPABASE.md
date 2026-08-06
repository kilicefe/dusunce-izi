# DÜŞÜNCE İZİ - Vercel & Supabase Canlıya Alma (Deployment) Rehberi

Bu rehber, DÜŞÜNCE İZİ uygulamasını Supabase (PostgreSQL & Storage) ve Vercel üzerinde üretime (Production) canlıya alma adımlarını detaylandırır.

---

## 1. Supabase Kurulumu ve Veri Tabanı Hazırlığı
1. **Supabase Projesi Oluşturma**:
   - [Supabase Dashboard](https://supabase.com) üzerinden yeni bir proje oluşturun.
   - Veri tabanı şifrenizi (Database Password) güvenli bir yere kaydedin.
2. **Veri Tabanı Bağlantısı (Connection String)**:
   - Supabase settings -> Database bölümünden Transaction Pooler ve Session Pooler bağlantı URL'lerini alın:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```
3. **Prisma Taşıma (Migration)**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## 2. Vercel Dağıtım Kurulumu
1. **Depoyu Vercel'e Bağlama**:
   - Vercel Dashboard -> `Add New Project` -> GitHub deponuzu seçin.
   - Framework Preset: `Vite` veya `Next.js` (veya custom Serverless Node.js build).
2. **Çevre Değişkenleri (Environment Variables)**:
   Vercel Settings -> Environment Variables bölümüne aşağıdaki değişkenleri ekleyin:
   ```env
   APP_URL="https://dusunce-izi.vercel.app"
   NODE_ENV="production"
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   GEMINI_API_KEY="AIzaSy..."
   NEXTAUTH_SECRET="super-secret-key..."
   NEXTAUTH_URL="https://dusunce-izi.vercel.app"
   ```
3. **Build Script Kontrolü**:
   `package.json` build komutunuzun `vite build` ve `prisma generate` adımlarını içerdiğinden emin olun.

---

## 3. Dağıtım Sonrası Doğrulama (Post-Deployment Check)
1. `https://dusunce-izi.vercel.app/api/health` adresine giderek sistem durumunu kontrol edin.
2. Test öğretmeni ile giriş yapıp örnek bir sınav yayımlayın.
3. Mobil cihaz ile QR kodu okutup öğrenci yanıtı gönderin ve AI analiz hattını doğrulayın.
