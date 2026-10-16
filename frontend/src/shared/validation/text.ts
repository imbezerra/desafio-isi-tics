export function normalizeTextSpaces(value: string) {
  return value.replace(/^ +| +$/g, '').replace(/ +/g, ' ');
}
