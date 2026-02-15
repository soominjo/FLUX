import { test, expect } from '@playwright/test'

test.describe('FLUX Smoke Tests', () => {
  test('login page loads and displays key elements', async ({ page }) => {
    await page.goto('/login')

    // Page should load without errors
    await expect(page).toHaveURL(/\/login/)

    // App should render (not a blank page)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login since user is not authenticated
    await expect(page).toHaveURL(/\/login/)
  })

  test('signup page is accessible', async ({ page }) => {
    await page.goto('/signup')

    await expect(page).toHaveURL(/\/signup/)

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('unknown routes redirect to login', async ({ page }) => {
    await page.goto('/nonexistent-page')

    // Catch-all route should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
