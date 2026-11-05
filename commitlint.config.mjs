// Conventional Commits: feat|fix|chore|docs|refactor|test|ci|perf|build|style|revert(scope)?: subject
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [1, 'always', 100],
  },
};
