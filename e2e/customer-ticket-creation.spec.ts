import { test, expect } from '@playwright/test';
import { generateTicketData, generateSpecificTicketData } from './test-helpers';

test.describe('Customer Ticket Creation Flow', () => {
  test('should create a new ticket as a guest customer', async ({ page }) => {
    // Generate ticket data using LLM
    const ticketData = await generateTicketData();
    
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
    
    // Fill in ticket details with generated data
    await page.getByLabel('Subject').fill(ticketData.subject);
    await page.getByLabel('Description').fill(ticketData.description);
    
    // Select category from dropdown
    await page.getByLabel('Category').selectOption(ticketData.category);
    
    // Select priority
    await page.getByLabel('Priority').selectOption(ticketData.priority);
    
    // Create the ticket
    await page.getByRole('button', { name: /create/i }).click();
    
    // After successful creation, we should be redirected to /customer
    await expect(page).toHaveURL(/.*customer/);

    // Click History in the sidebar to ensure we're on the history page
    await page.getByRole('link', { name: 'History' }).click();
    
    // Verify the newly created ticket appears in the history
    await expect(page.getByText(ticketData.subject)).toBeVisible();
  });

  test('should handle production system outage report', async ({ page }) => {
    const ticketData = await generateSpecificTicketData('productionIssue');
    
    await page.goto('/');
    await page.getByRole('link', { name: /customer login/i }).click();
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'New Ticket' }).click();
    await page.getByLabel('Subject').fill(ticketData.subject);
    await page.getByLabel('Description').fill(ticketData.description);
    await page.getByLabel('Category').selectOption(ticketData.category);
    await page.getByLabel('Priority').selectOption(ticketData.priority);
    
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText(ticketData.subject)).toBeVisible();
  });

  test('should handle feature exploration request', async ({ page }) => {
    const ticketData = await generateSpecificTicketData('featureExploration');
    
    await page.goto('/');
    await page.getByRole('link', { name: /customer login/i }).click();
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'New Ticket' }).click();
    await page.getByLabel('Subject').fill(ticketData.subject);
    await page.getByLabel('Description').fill(ticketData.description);
    await page.getByLabel('Category').selectOption(ticketData.category);
    await page.getByLabel('Priority').selectOption(ticketData.priority);
    
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText(ticketData.subject)).toBeVisible();
  });

  test('should handle security vulnerability report', async ({ page }) => {
    const ticketData = await generateSpecificTicketData('securityReport');
    
    await page.goto('/');
    await page.getByRole('link', { name: /customer login/i }).click();
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'New Ticket' }).click();
    await page.getByLabel('Subject').fill(ticketData.subject);
    await page.getByLabel('Description').fill(ticketData.description);
    await page.getByLabel('Category').selectOption(ticketData.category);
    await page.getByLabel('Priority').selectOption(ticketData.priority);
    
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText(ticketData.subject)).toBeVisible();
  });

  test('should handle documentation clarification request', async ({ page }) => {
    const ticketData = await generateSpecificTicketData('documentationQuery');
    
    await page.goto('/');
    await page.getByRole('link', { name: /customer login/i }).click();
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'New Ticket' }).click();
    await page.getByLabel('Subject').fill(ticketData.subject);
    await page.getByLabel('Description').fill(ticketData.description);
    await page.getByLabel('Category').selectOption(ticketData.category);
    await page.getByLabel('Priority').selectOption(ticketData.priority);
    
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page).toHaveURL(/.*customer/);
    
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText(ticketData.subject)).toBeVisible();
  });
}); 