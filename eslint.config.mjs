import tsparser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default [
    {
        files: ['src/**/*.ts'],
        plugins: {
            '@typescript-eslint': tseslint,
            'obsidianmd': obsidianmd,
        },
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        rules: {
            ...obsidianmd.configs.recommended,
            ...tseslint.configs.recommended.rules,
            'obsidianmd/ui/sentence-case': 'warn',
            'no-trailing-spaces': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'comma-dangle': ['error', 'always-multiline'],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
        },
    }
];
