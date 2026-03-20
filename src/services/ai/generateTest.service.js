export const generateTestScript = async ({ url, scenario, selectors, title }, testId) => {
    const targetUrl = url || 'https://practicetestautomation.com/practice-test-login/';
    const userSelector = selectors?.username || '#username';
    const passSelector = selectors?.password || '#password';
    const btnSelector = selectors?.submit || '#submit';

    return `
import { test, expect } from '@playwright/test';

test.describe('${title || 'Login Test Suite'}', () => {

    test('Positive: Login using valid credentials', async ({ page }) => {
        try {
            await page.goto('${targetUrl}');

            await page.fill('${userSelector}', 'student');
            await page.fill('${passSelector}', 'Password123');

            await page.click('${btnSelector}');

            await expect(page).toHaveURL(/logged-in-successfully/);
            await expect(page.locator('h1')).toContainText('Logged In Successfully');
            await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();

            await page.screenshot({
                path: 'runtime/artifacts/${testId}/positive-success.png'
            });

        } catch (error) {
            await page.screenshot({
                path: 'runtime/artifacts/${testId}/positive-failure.png'
            });
            throw error;
        }
    });

    test('Negative: Login with invalid password', async ({ page }) => {
        try {
            await page.goto('${targetUrl}');

            await page.fill('${userSelector}', 'student');
            await page.fill('${passSelector}', 'WrongPassword!!!');

            await page.click('${btnSelector}');

            const errorMessage = page.locator('#error');

            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText('Your password is invalid!');

            await page.screenshot({
                path: 'runtime/artifacts/${testId}/invalid-password.png'
            });

        } catch (error) {
            await page.screenshot({
                path: 'runtime/artifacts/${testId}/invalid-password-failure.png'
            });
            throw error;
        }
    });

    test('Negative: Login with invalid username', async ({ page }) => {
        try {
            await page.goto('${targetUrl}');

            await page.fill('${userSelector}', 'fakeUser999');
            await page.fill('${passSelector}', 'Password123');

            await page.click('${btnSelector}');

            const errorMessage = page.locator('#error');

            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText('Your username is invalid!');

            await page.screenshot({
                path: 'runtime/artifacts/${testId}/invalid-username.png'
            });

        } catch (error) {
            await page.screenshot({
                path: 'runtime/artifacts/${testId}/invalid-username-failure.png'
            });
            throw error;
        }
    });

});
    `;
};