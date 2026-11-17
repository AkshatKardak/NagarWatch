module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/helpers/setupMocks.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/seeds/**',
    '!src/testdns.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 20,
      statements: 20,
    },
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        types: ['node', 'jest'],
      },
    }],
  },
};
