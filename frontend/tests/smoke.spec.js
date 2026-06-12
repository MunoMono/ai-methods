import { test, expect } from '@playwright/test'

const routes = [
  {
    path: '/',
    heading: 'Critical testamentary traces of contested design knowledge using multimodal machine learning and visual analytics',
    assertions: async (page) => {
      await expect(page.getByText('Powered by IBM Granite')).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: 'Research workflow' })).toBeVisible()
    }
  },
  {
    path: '/corpus',
    heading: 'Corpus explorer',
    assertions: async (page) => {
      await expect(page.getByText('Current corpus contract')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Reset filters' })).toBeVisible()
    }
  },
  {
    path: '/tracer',
    heading: 'Evidence tracer',
    assertions: async (page) => {
      await expect(page.getByRole('heading', { level: 3, name: 'Research query' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Trace evidence' })).toBeVisible()
    }
  },
  {
    path: '/visual-analytics',
    heading: 'Visual analytics',
    assertions: async (page) => {
      await expect(page.getByText('Partial evidence surface')).toBeVisible()
      await expect(page.getByRole('heading', { level: 3, name: 'UMAP projection' })).toBeVisible()
    }
  },
  {
    path: '/sessions',
    heading: 'Session recorder',
    assertions: async (page) => {
      await expect(page.getByText('Recent sessions')).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Confidence' })).toBeVisible()
    }
  },
  {
    path: '/experiments',
    heading: 'Experimental log',
    assertions: async (page) => {
      await expect(page.getByRole('heading', { level: 3, name: 'Training loss curves' })).toBeVisible()
      await expect(page.getByText('Training run provenance')).toBeVisible()
    }
  },
  {
    path: '/ml-dashboard',
    heading: 'ML processing dashboard',
    assertions: async (page) => {
      await expect(page.getByRole('button', { name: 'Refresh stats' })).toBeVisible()
      await expect(page.getByText('Granite archive chat')).toBeVisible()
    }
  }
]

for (const route of routes) {
  test(`smoke ${route.path}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible()
    await expect(page.locator('main, .app-content')).toBeVisible()
    await route.assertions(page)
  })
}