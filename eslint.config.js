import config from '@agrodt/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {ignores: ['dist']},
  config
);
