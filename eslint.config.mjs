import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';

const obsidianRecommended = obsidianmd.configs.recommended.map((config) => {
    if (config.rules?.['obsidianmd/validate-manifest'] && !config.files) {
        return {
            ...config,
            files: ['**/*.ts', '**/*.tsx'],
        };
    }
    return config;
});

export default tseslint.config(
    {
        ignores: [
            'node_modules/**',
            'main.js',
            '*.map',
        ],
    },
    ...obsidianRecommended,
    {
        files: ['**/*.ts'],
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
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    }
);