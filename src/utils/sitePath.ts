const configuredBase = import.meta.env.BASE_URL;
const normalizedBase = configuredBase === '/' ? '' : configuredBase.replace(/\/$/, '');

export const sitePath = (path: string) => {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${normalizedBase}${path}`;
};
