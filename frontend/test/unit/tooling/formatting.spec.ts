import { ESLint } from 'eslint';
import { format, resolveConfig } from 'prettier';
import { describe, expect, it } from 'vitest';

const filePath = 'src/formatting-example.ts';
const compactSource = [
  "import 'theme.css';",
  'export interface Summary { total: number; }',
  'export function getTotal(summary: Summary) {',
  '  const total = summary.total;',
  '  return total;',
  '}',
  'export function getEmptyTotal() {',
  '  return 0;',
  '}',
  '',
].join('\n');

describe('Padrão de espaçamento do frontend', () => {
  it('rejeita imports, tipos, funções e retorno sem separação visual', async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText(compactSource, { filePath });

    expect(result.errorCount).toBeGreaterThan(0);
    expect(
      result.messages.every(
        (message) => message.ruleId === '@stylistic/padding-line-between-statements',
      ),
    ).toBe(true);
  });

  it('corrige as separações automaticamente', async () => {
    const eslint = new ESLint({ fix: true });
    const [result] = await eslint.lintText(compactSource, { filePath });

    expect(result.errorCount).toBe(0);
    expect(result.output).toContain("import 'theme.css';\n\nexport interface");
    expect(result.output).toContain('const total = summary.total;\n\n  return total;');
    expect(result.output).toContain('}\n\nexport function getEmptyTotal');
  });

  it('mantém o resultado estável ao combinar ESLint e Prettier', async () => {
    const eslint = new ESLint({ fix: true });
    const [fixed] = await eslint.lintText(compactSource, { filePath });
    const config = await resolveConfig(filePath);
    const formatted = await format(fixed.output ?? compactSource, {
      ...config,
      parser: 'typescript',
    });
    const [checked] = await eslint.lintText(formatted, { filePath });

    expect(checked.errorCount).toBe(0);
    expect(checked.output).toBeUndefined();
    expect(await format(formatted, { ...config, parser: 'typescript' })).toBe(formatted);
  });

  it('exige separação entre propriedade e método da classe', async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText(
      'export class Counter {\n  value = 0;\n  getValue() { return this.value; }\n}\n',
      { filePath },
    );

    expect(
      result.messages.some(
        (message) => message.ruleId === '@stylistic/lines-between-class-members',
      ),
    ).toBe(true);
  });
});
