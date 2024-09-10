import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

export default async function npmInstall() {
  // Define the plugin directory
  const plugindir = process.cwd();
  process.chdir(plugindir);

  // Check if there's a package.json file and its name
  if (
    (fs.existsSync('package.json') && JSON.parse(fs.readFileSync('package.json')).name === 'pluginade-scripts') ||
    !fs.existsSync('package.json')
  ) {
    // Copy package.json from .pluginade to the plugin directory root
    fs.copyFileSync('.pluginade/package.json', 'package.json');
  }

  // Install pluginade npm dependencies
  if (!fs.existsSync('node_modules') || fs.readdirSync('node_modules').length === 0) {
    console.log(`Running npm install in pluginade root at ${process.cwd()}...`);

    // Sync the WP external global packages
    execSync('. /usr/src/pluginade/pluginade-scripts/sync-wp-global-packages.sh', { stdio: 'inherit' });

    execSync('npm install', { stdio: 'inherit' });
  }

  // Loop through each wp-module in the plugin
  fs.readdirSync(path.join(plugindir, 'wp-modules')).forEach(dir => {
    const modulePath = path.join(plugindir, 'wp-modules', dir);
    const packageJsonPath = path.join(modulePath, 'package.json');

    // If the module has a package.json file
    if (fs.existsSync(packageJsonPath)) {
      process.chdir(modulePath);

      console.log(`Confirming npm dependencies for ${modulePath}`);

      // Sync the WP external global packages
      execSync('. /usr/src/pluginade/pluginade-scripts/sync-wp-global-packages.sh', { stdio: 'inherit' });

      // Run npm install for this module
      if (!fs.existsSync('node_modules') || fs.readdirSync('node_modules').length === 0) {
        console.log('Running npm install...');
        execSync('npm install', { stdio: 'inherit' });
      }

      process.chdir(plugindir); // Go back to the original plugin directory
    }
  });
}