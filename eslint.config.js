import globals from 'globals';
    import react from 'eslint-plugin-react';
    import reactHooks from 'eslint-plugin-react-hooks';
    import reactRefresh from 'eslint-plugin-react-refresh';

    export default [
      {
        ignores: ['dist']
      },
      {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: {
              jsx: true
            }
          },
          globals: {
            ...globals.browser,
            ...globals.node,
            document: 'readonly',
            window: 'readonly',
            console: 'readonly',
            setTimeout: 'readonly',
            clearTimeout: 'readonly',
            setInterval: 'readonly',
            clearInterval: 'readonly',
            Blob: 'readonly',
            URL: 'readonly',
            File: 'readonly',
            FileReader: 'readonly',
            FormData: 'readonly',
            navigator: 'readonly',
            localStorage: 'readonly',
            sessionStorage: 'readonly',
            location: 'readonly',
            history: 'readonly'
          }
        },
        settings: {
          react: {
            version: 'detect'
          }
        },
        plugins: {
          react,
          'react-hooks': reactHooks,
          'react-refresh': reactRefresh
        },
        rules: {
          ...react.configs.recommended.rules,
          'react/react-in-jsx-scope': 'off',
          'react/prop-types': 'off',
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'off',
          'react-refresh/only-export-components': 'off',
          'no-unused-vars': ['warn', {
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }],
          'no-case-declarations': 'off',
          'no-undef': 'error',
          'react/no-unescaped-entities': 'off'
        }
      }
    ];