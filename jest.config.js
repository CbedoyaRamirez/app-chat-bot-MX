module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/dist/',
    '.module.ts',
    '<rootDir>/src/main.ts',
    '<rootDir>/src/environments/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|marked|@testing-library)'
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/environments/**',
  ],
  moduleNameMapper: {
    '@app/(.*)': '<rootDir>/src/app/$1',
    '@environments/(.*)': '<rootDir>/src/environments/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
    },
  },
};
