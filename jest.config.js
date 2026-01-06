module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest', {
        tsconfig: './tsconfig.test.json'
      }
    ]
  },
  moduleNameMapper: {
    "uuid": "<rootDir>/__mocks__/uuid.js",
  },
};
