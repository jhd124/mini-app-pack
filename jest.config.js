module.exports = {
    transform: {
      '.ts': 'ts-jest',
    },
    globals: {
      'ts-jest': {
        diagnostics: false,
      },
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/'
    ],
    modulePathIgnorePatterns: ['/dist/'],
    // setupFiles: ['<rootDir>/src/config/jest/setup.ts'],
  };