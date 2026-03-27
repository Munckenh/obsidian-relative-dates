import tsparser from '@typescript-eslint/parser';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        ignores: [
            'main.js',
        ],
    },
    ...obsidianmd.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parser: tsparser,
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            'no-trailing-spaces': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'comma-dangle': ['error', 'always-multiline'],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
        },
    },
    {
        files: ['*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-trailing-spaces': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'comma-dangle': ['error', 'always-multiline'],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
        },
    },
]);