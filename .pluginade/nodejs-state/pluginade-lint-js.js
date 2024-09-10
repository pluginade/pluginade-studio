import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import installNpm from './pluginade-install.js';

async function lintJs() {
  await installNpm();

  const plugindir = process.cwd();
  let eslintFileName;

  if (fs.existsSync(path.join(plugindir, '.eslintrc'))) {
    eslintFileName = path.join(plugindir, '.eslintrc');
  } else {
    eslintFileName = path.join(plugindir, 'node_modules/@wordpress/scripts/config/.eslintrc.js');
  }

  const fix = process.argv.includes('--fix');

  console.log( 'Fixing:', fix );

  try {
    const command = `npx wp-scripts lint-js "${plugindir}" --config ${eslintFileName} ${fix ? '--fix' : ''}`;
    execSync(command, { stdio: 'inherit' });
    process.exit(0);
  } catch (error) {
    process.exit(error.status);
  }
}
lintJs();