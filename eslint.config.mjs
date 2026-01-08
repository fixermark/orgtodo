// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // If the developer says any, they mean any.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);