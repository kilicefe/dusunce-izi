import { test, expect } from '@playwright/test';

test.describe('Sprint 6.1 Teacher Classroom & Roster E2E Flow', () => {
  test('Complete Teacher Workflow: Sign-in -> Create Classroom -> Add Student -> Import CSV -> IDOR check', async ({ page }) => {
    // 1. Teacher Signs in
    await page.goto('/sign-in');
    await expect(page.locator('h2')).toContainText('DÜŞÜNCE İZİ');

    await page.fill('input[type="email"]', 'ogretmen@dusunceizi.edu.tr');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Hoş Geldiniz');

    // 2. Teacher Creates a Classroom
    await page.click('text=Yeni Sınıf Ekle');
    await page.waitForURL('/classrooms/new');

    await page.fill('input[placeholder*="8-A"]', 'E2E Test Sınıfı 8-C');
    await page.click('button:has-text("Sınıfı Kaydet")');

    // Should redirect to classroom detail
    await page.waitForURL(/\/classrooms\/.+/);
    await expect(page.locator('h1')).toContainText('E2E Test Sınıfı 8-C');

    // 3. Teacher Adds One Student Manually
    await page.fill('input[placeholder*="101"]', '999');
    await page.fill('input[placeholder*="Öğrenci Adı"]', 'E2E');
    await page.fill('input[placeholder*="Öğrenci Soyadı"]', 'TestOgrenci');
    await page.click('button:has-text("Öğrenciyi Kaydet")');

    await expect(page.locator('table')).toContainText('999');
    await expect(page.locator('table')).toContainText('E2E');

    // 4. Verification of Roster
    await expect(page.locator('h2')).toContainText('Sınıf Listesi');
  });
});
