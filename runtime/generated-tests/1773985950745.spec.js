
import { test, expect } from '@playwright/test';

test.describe('Practice login test', () => {

    test('Positive: Login using valid credentials', async ({ page }) => {
        try {
            await page.goto('https://practicetestautomation.com/practice-test-login/');

            await page.fill('#username', 'student');
            await page.fill('#password', 'Password123');

            await page.click('#submit');

            await expect(page).toHaveURL(/logged-in-successfully/);
            await expect(page.locator('h1')).toContainText('Logged In Successfully');
            await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();

            await page.screenshot({
                path: 'runtime/artifacts/1773985950745/positive-success.png'
            });

        } catch (error) {
            await page.screenshot({
                path: 'runtime/artifacts/1773985950745/positive-failure.png'
            });
            throw error;
        }
    });

    test('Negative: Login with invalid password', async ({ page }) => {
        try {
            await page.goto('https://practicetestautomation.com/practice-test-login/');

            await page.fill('#username', 'student');
            await page.fill('#password', 'WrongPassword!!!');

            await page.click('#submit');

            const errorMessage = page.locator('#error');

            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText('Your password is invalid!');

            await page.screenshot({
                path: 'runtime/artifacts/1773985950745/invalid-password.png'
            });

        } catch (error) {
            await page.screenshot({
                path: 'runtime/artifacts/1773985950745/invalid-password-failure.png'
            });
            throw error;
        }
    });

    test('Negative: Login with invalid username', async ({ page }) => {
        try {
            await page.goto('https://practicetestautomation.com/practice-test-login/');

            await page.fill('#username', 'fakeUser999');
            await page.fill('#password', 'Password123');

            await page.click('#submit');

            const errorMessage = page.locator('#error');

            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText('Your username is invalid!');

            await page.screenshot({
                path: 'runtime/artifacts/1773985950745/invalid-username.png'
            });

        } catch (error) {
            await page.screenshot({
                path: 'runtime/artifacts/1773985950745/invalid-username-failure.png'
            });
            throw error;
        }
    });

});
    