export function downloadBlob(file: Blob, filename: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
