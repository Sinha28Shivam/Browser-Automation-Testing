const { test, expect } = require('@playwright/test');

test.describe('Login Test', () => {
  const selectors = {
    "username": "#username",
    "password": "#password",
    "submit": "#submit"
  };

  test('Positive Test: Valid Credentials', async ({ page }) => {
    await page.goto('https://practicetestautomation.com/practice-test-login/');
    await page.fill(selectors.username, 'username');
    await page.fill(selectors.password, 'password');
    await page.click(selectors.submit);
    await expect(page).toContainText('You are logged in!');
  });

  test('Negative Test: Invalid Username', async ({ page }) => {
    await page.goto('https://practicetestautomation.com/practice-test-login/');
    await page.fill(selectors.username, 'invalid_username');
    await page.fill(selectors.password, 'password');
    await page.click(selectors.submit);
    await expect(page).toContainText('Your username is invalid!');
  });

  test('Negative Test: Invalid Password', async ({ page }) => {
    await page.goto('https://practicetestautomation.com/practice-test-login/');
    await page.fill(selectors.username, 'username');
    await page.fill(selectors.password, 'invalid_password');
    await page.click(selectors.submit);
    await expect(page).toContainText('Your password is invalid!');
  });

  test('Negative Test: Empty Credentials', async ({ page }) => {
    await page.goto('https://practicetestautomation.com/practice-test-login/');
    await page.click(selectors.submit);
    await expect(page).toContainText('Username and password cannot be empty!');
  });
});