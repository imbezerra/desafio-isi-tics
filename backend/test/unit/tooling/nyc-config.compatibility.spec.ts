import { createRequire } from 'node:module';
import { resolve } from 'node:path';

type CarregadorNyc = {
  loadNycConfig(opcoes: { cwd: string; nycrcPath: string }): Promise<Record<string, unknown>>;
};

describe('compatibilidade do override YAML da cobertura', () => {
  it('carrega a configuração YAML pelo consumidor real do Istanbul', async () => {
    const carregar = createRequire(__filename);
    const { loadNycConfig } = carregar('@istanbuljs/load-nyc-config') as CarregadorNyc;
    const raizBackend = resolve(__dirname, '../../..');

    const configuracao = await loadNycConfig({
      cwd: raizBackend,
      nycrcPath: 'test/fixtures/nyc-compatibility.yml',
    });

    expect(configuracao).toMatchObject({
      cwd: raizBackend,
      all: true,
      extension: ['.ts'],
      include: ['src/**/*.ts'],
      exclude: ['test/**'],
    });
  });
});
