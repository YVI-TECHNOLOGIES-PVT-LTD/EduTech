module.exports = {
  extends: [require.resolve('./base.js')],
  env: {
    browser: true,
    es2022: true,
  },
  rules: {
    'no-console': 'warn',
    'no-empty': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-useless-escape': 'warn',
    'no-case-declarations': 'warn',
    'no-control-regex': 'warn',
  },
};
