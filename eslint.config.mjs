import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: [
            '**/*.js',
            '**/*.mjs',
            '**/*.json',
        ],
    },
    ...obsidianmd.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                createFragment: 'readonly',
                activeDocument: 'readonly',
                createSpan: 'readonly',
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
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
);