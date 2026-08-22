import { test, expect } from '@playwright/test';

test.describe('Sprint 6.1 Teacher Classroom & Roster E2E Flow', () => {
  test('Complete Teacher Workflow: Sign-in -> Create Classroom -> Add Student', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'DÜŞÜNCE İZİ' })).toBeVisible();

    await page.getByLabel('E-posta').fill('ogretmen@dusunceizi.edu.tr');
    await page.getByLabel('Test parolası').fill(process.env.E2E_TEST_PASSWORD || 'pilot-e2e-password');
    await page.getByRole('button', { name: 'Test oturumu aç' }).click();

    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Hoş Geldiniz');

    await page.getByText('Yeni Sınıf Ekle').click();
    await page.waitForURL('/classrooms/new');

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
  });
});
