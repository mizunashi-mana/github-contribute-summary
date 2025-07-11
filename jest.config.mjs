import jsoncParser from 'jsonc-parser';
import nextJest from 'next/jest.js';
import { pathsToModuleNameMapper } from 'ts-jest';
import fs from 'fs';

const { compilerOptions } = jsoncParser.parse(fs.readFileSync('./tsconfig.json', 'utf-8'));

const createJestConfig = nextJest({
  dir: './',
});

export default createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  coveragePathIgnorePatterns: [
    '<rootDir>/test/',
    '<rootDir>/node_modules/',
  ],
});
