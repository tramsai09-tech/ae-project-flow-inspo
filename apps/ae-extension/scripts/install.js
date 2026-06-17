const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTENSION_NAME = 'com.aemotiontools.panel';
const SOURCE_DIR = path.join(__dirname, '..'); // The ae-extension folder

// Determine the Adobe CEP extensions directory based on OS
let cepExtensionsPath;
if (os.platform() === 'win32') {
  cepExtensionsPath = path.join(process.env.APPDATA, 'Adobe', 'CEP', 'extensions');
} else if (os.platform() === 'darwin') {
  cepExtensionsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Adobe', 'CEP', 'extensions');
} else {
  console.error('Unsupported OS for automatic CEP installation.');
  process.exit(1);
}

const targetDir = path.join(cepExtensionsPath, EXTENSION_NAME);

// Utility to recursively copy a directory
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      // Skip node_modules to avoid copying massive unneeded folders
      if (childItemName === 'node_modules' || childItemName === 'panel') {
        if (childItemName === 'panel') {
           // We only want to copy the built dist/panel, not the source React app
           return;
        }
        return; 
      }
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // Only copy if it's not a dev config file
    if (!src.endsWith('package.json') && !src.endsWith('tsconfig.json')) {
       fs.copyFileSync(src, dest);
    }
  }
}

try {
  console.log(`Installing ${EXTENSION_NAME} to ${cepExtensionsPath}...`);
  
  // Ensure the target CEP directory exists
  if (!fs.existsSync(cepExtensionsPath)) {
    fs.mkdirSync(cepExtensionsPath, { recursive: true });
  }

  // Clear previous installation
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // First, we need to ensure the React app is built
  const distPanelPath = path.join(SOURCE_DIR, 'dist', 'panel');
  if (!fs.existsSync(distPanelPath)) {
    console.error('ERROR: You must build the React panel first!');
    console.log('Run `pnpm build` in the ae-extension/panel directory.');
    process.exit(1);
  }

  // Create the extension folder
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy standard extension files
  console.log('Copying CSXS manifest...');
  copyRecursiveSync(path.join(SOURCE_DIR, 'CSXS'), path.join(targetDir, 'CSXS'));
  
  console.log('Copying ExtendScript JSX bridge...');
  copyRecursiveSync(path.join(SOURCE_DIR, 'jsx'), path.join(targetDir, 'jsx'));
  
  console.log('Copying CSInterface host stub...');
  copyRecursiveSync(path.join(SOURCE_DIR, 'host'), path.join(targetDir, 'host'));

  // Copy .debug if it exists
  const debugPath = path.join(SOURCE_DIR, '.debug');
  if (fs.existsSync(debugPath)) {
    fs.copyFileSync(debugPath, path.join(targetDir, '.debug'));
  }

  // Copy the built React app into the panel directory
  console.log('Copying compiled React panel...');
  copyRecursiveSync(distPanelPath, path.join(targetDir, 'panel'));

  console.log('\n✅ Installation successful!');
  console.log('You can now launch After Effects and find the panel under Window > Extensions > Motion Tools');

  // Important compatibility note for unsigned extensions
  if (os.platform() === 'win32') {
    console.log('\nNote: Make sure PlayerDebugMode is enabled in your Windows Registry to load unsigned extensions.');
  }

} catch (err) {
  console.error('Failed to install extension:', err);
}
