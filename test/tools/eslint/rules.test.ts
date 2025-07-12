import { ESLint } from 'eslint';

describe('snapshot tests for ESLint rules', () => {
  test('should match the snapshot of rules for app files', async () => {
    const eslint = getESLint();
    const config = await calculateConfigForSnapshot(eslint, 'src/app/page.tsx');

    expect(config).toMatchSnapshot();
  });

  test('should match the snapshot of rules for test files', async () => {
    const eslint = getESLint();
    const config = await calculateConfigForSnapshot(eslint, 'test/tools/eslint/rules.test.ts');

    expect(config).toMatchSnapshot();
  });

  test('should match the snapshot of rules for config files', async () => {
    const eslint = getESLint();
    const config = await calculateConfigForSnapshot(eslint, 'eslint.config.js');

    expect(config).toMatchSnapshot();
  });
});

function getESLint(): ESLint {
  return new ESLint({
    cwd: process.cwd(),
    fix: false,
  });
}

async function calculateConfigForSnapshot(eslint: ESLint, filePath: string) {
  const config: {
    parser: string;
    languageOptions: {
      parser: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } = await eslint.calculateConfigForFile(filePath);

  return {
    ...config,
    defaultLanguageOptions: undefined,
    language: undefined,
    plugins: undefined,
    languageOptions: {
      ...config.languageOptions,
      parser: undefined,
      parserOptions: undefined,
    },
    settings: undefined,
  };
}
