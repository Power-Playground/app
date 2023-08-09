module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  overrides: [
    {
      plugins: ['react', '@typescript-eslint'],
      files: ['*.ts', '*.tsx'],
      rules: {
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error', {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_'
          }
        ],
        // TODO fix start
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/dist', '**/dist/**'],
                message: 'Don not import from dist',
                allowTypeImports: false
              },
              {
                group: ['**/src', '**/src/**'],
                message: 'Don not import from src',
                allowTypeImports: false
              }
            ]
          }
        ],
        // JSX
        'jsx-quotes': ['error', 'prefer-single'],
        'react/prop-types': 'off',
        'react/jsx-indent': ['error', 2],
        'react/jsx-indent-props': ['error', 'first'],
        'react/jsx-tag-spacing': ['error', {
          closingSlash: 'never',
          beforeSelfClosing: 'always',
          afterOpening: 'never',
          beforeClosing: 'never',
        }],
      }
    },
  ],
  settings: {
    react: {
      version: '18'
    }
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react', '@typescript-eslint', 'simple-import-sort'],
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false }
    ],
    '@typescript-eslint/no-namespace': 'off',
    'no-unused-vars': 'off',
    'simple-import-sort/imports': ['error', {
      groups: [
        // Style imports.
        ['^.+\\.s?css$'],
        // Side effect imports.
        ['^\\u0000'],
        // Style imports.
        ['^\/\/'],
        // Packages. `react` related packages come first.
        ['^react', '^@?\\w'],
        // Parent imports. Put `..` last.
        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
        // Other relative imports. Put same-folder imports and `.` last.
        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
      ],
    }],
    'simple-import-sort/exports': 'error',
    'semi': ['error', 'never'],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-before-blocks': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],
    'no-multi-spaces': ['error', {
      ignoreEOLComments: true
    }],
    'block-spacing': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'indent': ['error', 2, {
      SwitchCase: 1,
      VariableDeclarator: 'first',
      // ignore jsx node, template literal expression
      ignoredNodes: ['JSXElement *', 'TemplateLiteral *']
    }]
  }
}
