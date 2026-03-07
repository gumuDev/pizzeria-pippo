import { test, expect } from '@playwright/test'

test('la pantalla de login carga correctamente', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/pizza/i)  // ajusta según el título de tu app
})