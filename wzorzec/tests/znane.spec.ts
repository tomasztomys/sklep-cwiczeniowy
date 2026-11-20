import { test, expect } from './fixtures.ts';

test.fail(
  'newsletter da się obsłużyć z klawiatury',
  { tag: '@a11y', annotation: { type: 'issue', description: 'docs/bledy/dostepnosc-newsletter.md' } },
  async ({ page }) => {
    await page.goto('/');
    const newsletter = page.getByText('Zapisz się do newslettera');
    await newsletter.focus();
    await expect(newsletter).toBeFocused({ timeout: 1000 });
  },
);
