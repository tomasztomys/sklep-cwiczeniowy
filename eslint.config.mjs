import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['wzorzec/', 'ksiazka/', 'akceptacja/', 'node_modules/', 'test-results/', 'playwright-report/', 'publiczne/'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { ...tseslint.configs.disableTypeChecked.languageOptions, globals: globals.node },
  },
  {
    files: ['testy/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Fixture używany dla efektu, np. `klient`, jest celowo nieużywany (jak w rozdziale 8 książki).
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['sprawdzTylkoCeloweUsterki', 'sprawdzPrzyciskiIKomunikaty'] }],
    },
  },
);
