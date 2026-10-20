import { vi } from 'vitest';

export function mockDownload() {
  const create = vi.fn<(file: Blob) => string>().mockReturnValue('blob:history-test');
  const revoke = vi.fn();
  const saved: { filename: string; href: string }[] = [];
  const originalUrl = URL;

  vi.stubGlobal(
    'URL',
    class extends originalUrl {
      static createObjectURL = create;

      static revokeObjectURL = revoke;
    },
  );

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push({ filename: this.download, href: this.href });
  });

  return { create, revoke, saved };
}
