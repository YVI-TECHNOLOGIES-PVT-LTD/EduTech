module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        'perf',
        'style',
        'revert',
      ],
    ],
  },
};
