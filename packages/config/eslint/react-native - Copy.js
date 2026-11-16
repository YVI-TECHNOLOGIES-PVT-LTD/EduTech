module.exports = {
  extends: [require.resolve('./base.js')],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  globals: {
    __DEV__: 'readonly',
    fetch: 'readonly',
    FormData: 'readonly',
    window: 'readonly',
  },
  rules: {
    'no-console': 'warn',
  },
};
