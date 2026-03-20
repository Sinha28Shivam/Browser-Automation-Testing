import { test, expect } from '@playwright/test';

test.describe('Practice test login', () => {

    test('Positive: valid credentials', async ({ page }) => {
        try {
            await page.goto('https://practicetestautomation.com/practice-test-login/');
            await page.fill('#username', 'student');
            await page.fill('#password', 'Password123');
            await page.click('#submit');
            await expect(page).toHaveURL(/logged-in-successfully/);
            await expect(page.locator('h1')).toContainText('Logged In Successfully');
            await page.screenshot({ path: 'runtime/artifacts/1774012409535/positive-success.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/1774012409535/positive-failure.png' });
            throw error;
        }
    });

    test('Negative: invalid password', async ({ page }) => {
        try {
            await page.goto('https://practicetestautomation.com/practice-test-login/');
            await page.fill('#username', 'student');
            await page.fill('#password', 'WrongPassword!!!');
            await page.click('#submit');
            const err = page.locator('#error');
            await expect(err).toBeVisible();
            await expect(err).toContainText('Your password is invalid!');
            await page.screenshot({ path: 'runtime/artifacts/1774012409535/invalid-password.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/1774012409535/invalid-password-failure.png' });
            throw error;
        }
    });

    test('Negative: invalid username', async ({ page }) => {
        try {
            await page.goto('https://practicetestautomation.com/practice-test-login/');
            await page.fill('#username', 'fakeUser999');
            await page.fill('#password', 'Password123');
            await page.click('#submit');
            const err = page.locator('#error');
            await expect(err).toBeVisible();
            await expect(err).toContainText('Your username is invalid!');
            await page.screenshot({ path: 'runtime/artifacts/1774012409535/invalid-username.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/1774012409535/invalid-username-failure.png' });
            throw error;
        }
    });
});
