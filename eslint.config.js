// @ts-check
// ESLint 9 (configuración plana). Reemplaza a .eslintrc.json desde la OT-035 fase 5 (angular-eslint 22 exige ESLint 9);
// mismas reglas que antes. El .eslintrc.json viejo quedó en _respaldos/2026-11-13_ot035-fase5.
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
    { ignores: ['projects/**/*', 'dist/**/*', 'node_modules*/**/*'] },
    {
        files: ['**/*.ts'],
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
        processor: angular.processInlineTemplates,
        rules: {
            '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
            '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }]
        }
    },
    {
        files: ['**/*.html'],
        extends: [...angular.configs.templateRecommended],
        rules: {}
    }
);
