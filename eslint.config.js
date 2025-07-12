import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'coverage/**/*',
    ],
  },
  js.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: true,
  }),
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react': react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // React specific rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Module rules
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./', '../', 'src/*', 'test/*'],
              message:
                '@で始まる絶対パスを使用してください',
            },
          ],
        },
      ],
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
          },
        },
      ],
      'import/no-anonymous-default-export': 'error',
    },
  },
  {
    files: ['src/app/**/*.{js,jsx,ts,tsx}', '*.{js,mjs,ts}'],
    rules: {
      'no-restricted-exports': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    files: ['**/*.test.{js,ts}', 'test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
