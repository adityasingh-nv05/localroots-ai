// Flat config using the presets shipped with eslint-config-next 16.
// UNVERIFIED in this sandbox: run `npm run lint` to confirm the import paths.
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'public/**'] },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
