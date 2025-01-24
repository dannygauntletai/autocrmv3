import { test, expect } from '@playwright/test';

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as supervisor
    await page.goto('/login');
    await page.fill('input[type="email"]', 'supervisor@example.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('/queue');
  });

  test('should handle bulk status updates', async ({ page }) => {
    // Select multiple tickets
    await page.getByRole('checkbox').first().click();
    await page.getByRole('checkbox').nth(1).click();
    
    // Verify toolbar appears
    await expect(page.getByText('2 tickets selected')).toBeVisible();
    
    // Update status
    await page.getByRole('button', { name: 'Status' }).click();
    await page.getByRole('button', { name: 'Resolved' }).click();
    
    // Verify success and toolbar disappears
    await expect(page.getByText('2 tickets selected')).not.toBeVisible();
    
    // Verify tickets were updated
    await expect(page.getByText('Resolved')).toHaveCount(2);
  });

  test('should handle bulk priority updates', async ({ page }) => {
    // Select tickets
    await page.getByRole('checkbox').first().click();
    
    // Update priority
    await page.getByRole('button', { name: 'Priority' }).click();
    await page.getByRole('button', { name: 'High' }).click();
    
    // Verify update
    await expect(page.getByText('High')).toBeVisible();
  });

  test('should handle bulk assignments', async ({ page }) => {
    // Select tickets
    await page.getByRole('checkbox').first().click();
    
    // Assign to employee
    await page.getByRole('button', { name: 'Assign' }).click();
    await page.getByRole('button', { name: 'John Smith' }).click();
    
    // Verify assignment
    await expect(page.getByText('Assigned')).toBeVisible();
  });

  test('should clear selection', async ({ page }) => {
    // Select tickets
    await page.getByRole('checkbox').first().click();
    await page.getByRole('checkbox').nth(1).click();
    
    // Clear selection
    await page.getByRole('button', { name: 'Clear selection' }).click();
    
    // Verify toolbar disappears
    await expect(page.getByText('2 tickets selected')).not.toBeVisible();
    
    // Verify checkboxes are unchecked
    await expect(page.getByRole('checkbox').first()).not.toBeChecked();
    await expect(page.getByRole('checkbox').nth(1)).not.toBeChecked();
  });
}); 