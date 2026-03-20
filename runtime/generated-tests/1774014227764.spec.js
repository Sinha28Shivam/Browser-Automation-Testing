import { test, expect } from '@playwright/test';

test.describe('Flipkart AC Search Add to Cart', () => {

    test('Positive: valid credentials', async ({ page }) => {
        try {
            await page.goto('https://www.flipkart.com');
            await page.fill('input[name='q']', 'student');
            await page.fill('#password', 'Password123');
            await page.click('#submit');
            await expect(page).toHaveURL(/logged-in-successfully/);
            await expect(page.locator('h1')).toContainText('Logged In Successfully');
            await page.screenshot({ path: 'runtime/artifacts/1774014227764/positive-success.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/1774014227764/positive-failure.png' });
            throw error;
        }
    });

    test('Negative: invalid password', async ({ page }) => {
        try {
            await page.goto('https://www.flipkart.com');
            await page.fill('input[name='q']', 'student');
            await page.fill('#password', 'WrongPassword!!!');
            await page.click('#submit');
            const err = page.locator('#error');
            await expect(err).toBeVisible();
            await expect(err).toContainText('Your password is invalid!');
            await page.screenshot({ path: 'runtime/artifacts/1774014227764/invalid-password.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/1774014227764/invalid-password-failure.png' });
            throw error;
        }
    });

    test('Negative: invalid username', async ({ page }) => {
        try {
            await page.goto('https://www.flipkart.com');
            await page.fill('input[name='q']', 'fakeUser999');
            await page.fill('#password', 'Password123');
            await page.click('#submit');
            const err = page.locator('#error');
            await expect(err).toBeVisible();
            await expect(err).toContainText('Your username is invalid!');
            await page.screenshot({ path: 'runtime/artifacts/1774014227764/invalid-username.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/1774014227764/invalid-username-failure.png' });
            throw error;
        }
    });
});
