/** Jest config — mirrors api-mrt: ts-jest, node env, paths alias */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', esModuleInterop: true } }],
  },
  testTimeout: 60000,
};
