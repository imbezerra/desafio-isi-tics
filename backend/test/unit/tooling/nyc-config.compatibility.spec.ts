import { createRequire } from 'node:module';
import { resolve } from 'node:path';

type NycConfigLoader = {
  loadNycConfig(options: { cwd: string; nycrcPath: string }): Promise<Record<string, unknown>>;
};

describe('compatibilidade do override YAML da cobertura', () => {
  it('carrega a configuração YAML pelo consumidor real do Istanbul', async () => {
    const load = createRequire(__filename);
    const { loadNycConfig } = load('@istanbuljs/load-nyc-config') as NycConfigLoader;
    const backendRoot = resolve(__dirname, '../../..');

    const configuration = await loadNycConfig({
      cwd: backendRoot,
      nycrcPath: 'test/fixtures/nyc-compatibility.yml',
    });

    expect(configuration).toMatchObject({
      cwd: backendRoot,
      all: true,
      extension: ['.ts'],
      include: ['src/**/*.ts'],
      exclude: ['test/**'],
    });
  });
});
