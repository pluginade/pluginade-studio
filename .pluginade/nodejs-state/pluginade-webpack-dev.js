import { readdirSync } from 'fs';
import { exec } from 'child_process';
import { join } from 'path';
import installNpm from './pluginade-install.js';

async function webpackDevMode() {
  await installNpm();

  // Define the plugin directory path
  const plugindir = process.cwd();

  // Loop through each wp-module in the plugin
  const wpModulesDir = join(plugindir, 'wp-modules');
  const modules = readdirSync(wpModulesDir, { withFileTypes: true });

  modules.forEach((module) => {
    const moduleDir = join(wpModulesDir, module.name);
    const packageJsonPath = join(moduleDir, 'package.json');

    if (module.isDirectory() && readdirSync(moduleDir).includes('package.json')) {
      // Run the build script for this module
      exec('npm run dev', { cwd: moduleDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing npm run dev in ${moduleDir}: ${error}`);
          return;
        }
        console.log(`Output from ${moduleDir}:\n${stdout}`);
      });
    }
  });
}
webpackDevMode();