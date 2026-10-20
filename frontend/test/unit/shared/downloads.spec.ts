import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { downloadBlob } from '../../../src/shared/downloads';
import { mockDownload } from '../../helpers/mock-download';

describe('Download compartilhado de arquivos', () => {
  it('baixa o mesmo Blob com nome definido e libera o endereço temporário', async () => {
    const mock = mockDownload();
    const blob = new Blob(['conteúdo exato']);

    downloadBlob(blob, 'historico.csv');
    expect(mock.create).toHaveBeenCalledExactlyOnceWith(blob);
    expect(mock.saved).toEqual([{ filename: 'historico.csv', href: 'blob:history-test' }]);
    expect(document.querySelector('a[download]')).toBeNull();
    await waitFor(() => expect(mock.revoke).toHaveBeenCalledExactlyOnceWith('blob:history-test'));
  });
});
