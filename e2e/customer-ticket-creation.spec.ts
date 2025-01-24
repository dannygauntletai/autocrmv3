import { test, expect } from '@playwright/test';

test.describe('Customer Ticket Creation Flow', () => {
  test('should create a new ticket as a guest customer', async ({ page }) => {
    // Generate a random ticket title to verify later
    const randomTitle = `Test Ticket ${Math.random().toString(36).substring(7)}`;
    
    // Navigate to home page
    await page.goto('/');
    
    // Click customer login link
    await page.getByRole('link', { name: /customer login/i }).click();
    
    // Click continue as guest
    await page.getByRole('button', { name: /continue as guest/i }).click();
    
    // Verify we're on the /customer page
    await expect(page).toHaveURL(/.*customer/);
    
    // Click New Ticket in the sidebar
    await page.getByRole('link', { name: 'New Ticket' }).click();
    
    // Fill in ticket details
    await page.getByLabel('Subject').fill(randomTitle);
    await page.getByLabel('Description').fill('This is a test ticket description');
    
    // Select first category (team) from dropdown
    await page.getByLabel('Category').selectOption({ index: 1 }); // Index 1 because index 0 is "Select a category"
    
    // Select priority (defaults to low, but let's explicitly set it)
    await page.getByLabel('Priority').selectOption('low');
    
    // Create the ticket
    await page.getByRole('button', { name: /create/i }).click();
    
    // After successful creation, we should be redirected to /customer
    await expect(page).toHaveURL(/.*customer/);

    // Click History in the sidebar to ensure we're on the history page
    await page.getByRole('link', { name: 'History' }).click();
    
    // Verify the newly created ticket appears in the history
    await expect(page.getByText(randomTitle)).toBeVisible();
  });
}); 