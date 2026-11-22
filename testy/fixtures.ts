import { randomUUID } from 'node:crypto';
import { test as base, expect, type APIRequestContext } from '@playwright/test';

export interface DaneKlienta {
  email: string;
  haslo: string;
}

export const nowyKlient = (): DaneKlienta => ({ email: `test-${randomUUID()}@sklep.test`, haslo: `Haslo-${randomUUID()}` });

interface Fixtures {
  apiKlienta: APIRequestContext;
  apiAdmina: APIRequestContext;
  /** Nowy klient zalogowany w przeglądarce testu (jak fixture `klient` z rozdziału 8). */
  klient: DaneKlienta;
}

export const test = base.extend<Fixtures>({
  klient: async ({ page }, use) => {
    const dane = nowyKlient();
    await expect(await page.request.post('/api/users', { data: dane })).toBeOK();
    await expect(await page.request.post('/api/login', { data: dane })).toBeOK();
    await use(dane);
    await page.request.delete('/api/users/me');
  },
  apiKlienta: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    const dane = nowyKlient();
    await expect(await api.post('/api/users', { data: dane })).toBeOK();
    await expect(await api.post('/api/login', { data: dane })).toBeOK();
    await use(api);
    await api.delete('/api/users/me');
    await api.dispose();
  },
  apiAdmina: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    await expect(await api.post('/api/login', { data: { email: 'admin@sklep.test', haslo: 'Admin123!' } })).toBeOK();
    await use(api);
    await api.dispose();
  },
});

export { expect };
