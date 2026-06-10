import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Regra inviolável de arquitetura: src/engine/ é TS puro, sem React nem DOM.
  // A direção das dependências é UI → engine; o motor nunca importa da UI.
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'engine/ é TS puro: sem React.' },
            { name: 'react-dom', message: 'engine/ é TS puro: sem React/DOM.' },
            { name: 'react-dom/client', message: 'engine/ é TS puro: sem React/DOM.' },
          ],
          patterns: [
            {
              group: ['**/components/**', '**/hooks/**', '**/lib/**'],
              message: 'engine/ não importa da UI; a direção é UI → engine.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'engine/ é TS puro: sem DOM.' },
        { name: 'window', message: 'engine/ é TS puro: sem DOM.' },
        { name: 'navigator', message: 'engine/ é TS puro: sem DOM.' },
        { name: 'localStorage', message: 'engine/ é TS puro: sem DOM.' },
      ],
    },
  },
])
