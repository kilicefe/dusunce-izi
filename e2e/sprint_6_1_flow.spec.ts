import { test, expect } from '@playwright/test';

test.describe('Sprint 6.1 Teacher Classroom & Roster E2E Flow', () => {
  test('Protected teacher routes redirect signed-out users to sign-in', async ({ page }) => {
    await page.goto('/classrooms');
    await page.waitForURL('/sign-in');
    await expect(page.getByRole('heading', { name: 'DÜŞÜNCE İZİ' })).toBeVisible();
  });

  test('Complete Teacher Workflow: Sign-in -> Create Classroom -> Add Student', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'DÜŞÜNCE İZİ' })).toBeVisible();

    await page.getByLabel('E-posta').fill('ogretmen@dusunceizi.edu.tr');
    await page.getByLabel('Test parolası').fill(process.env.E2E_TEST_PASSWORD || 'pilot-e2e-password');
    await page.getByRole('button', { name: 'Test oturumu aç' }).click();

    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Hoş Geldiniz');
    await expect(page.getByRole('navigation', { name: 'Ana menü' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Düşünce İzi ana sayfa' })).toBeVisible();

    await page.getByText('Yeni Sınıf Ekle').click();
    await page.waitForURL('/classrooms/new');
    await expect(page.getByRole('navigation', { name: 'Ana menü' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sınıflarım ve Öğrenciler' })).toHaveAttribute('aria-current', 'page');

    await page.fill('input[placeholder*="8-A"]', 'E2E Test Sınıfı 8-C');
    await page.getByRole('button', { name: 'Sınıfı Oluştur' }).click();

    await page.waitForURL(/\/classrooms\/.+/);
    await expect(page.locator('h1')).toContainText('E2E Test Sınıfı 8-C');

    await page.fill('input[placeholder*="101"]', '999');
    await page.fill('input[placeholder*="Öğrenci Adı"]', 'E2E');
    await page.fill('input[placeholder*="Öğrenci Soyadı"]', 'TestOgrenci');
    await page.getByRole('button', { name: 'Öğrenciyi Kaydet' }).click();

    await expect(page.locator('table')).toContainText('999');
    await expect(page.locator('table')).toContainText('E2E');
    await expect(page.getByRole('heading', { name: 'Sınıf Listesi' })).toBeVisible();

    await page.getByRole('link', { name: 'Düşünce İzi ana sayfa' }).click();
    await page.waitForURL('/dashboard');
    await expect(page.getByText('E2E Test Sınıfı 8-C')).toBeVisible();
  });

  test('Teacher navigation stays compact and usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-in');
    await page.getByLabel('E-posta').fill('ogretmen@dusunceizi.edu.tr');
    await page.getByLabel('Test parolası').fill(process.env.E2E_TEST_PASSWORD || 'pilot-e2e-password');
    await page.getByRole('button', { name: 'Test oturumu aç' }).click();
    await page.waitForURL('/dashboard');

    const navigation = page.getByRole('navigation', { name: 'Ana menü' });
    await expect(navigation.getByRole('link', { name: 'Ana Sayfa' })).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Sınıflar' })).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Sınavlar' })).toBeVisible();

    await navigation.getByRole('link', { name: 'Sınıflar' }).click();
    await page.waitForURL('/classrooms');
    await expect(page.getByRole('link', { name: 'Düşünce İzi ana sayfa' })).toBeVisible();
  });
});
