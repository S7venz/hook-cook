import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // eslint-plugin-react-hooks 7.x ajoute des règles "compiler-style"
      // (set-state-in-effect, impure-render, react-compiler) qui présupposent
      // l'usage de React Compiler. On reste sur React 19 standard, donc on
      // les désactive — ce sont des opinions trop strictes pour ce projet.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/react-compiler': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      // Règle non chargée (plugin react absent) — on l'ignore explicitement
      // pour que les commentaires `eslint-disable react/no-unknown-property`
      // historiques ne déclenchent pas d'erreur.
      'react/no-unknown-property': 'off',
    },
  },
])
