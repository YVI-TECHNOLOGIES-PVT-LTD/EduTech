import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirsToRemove = [
  'src/features/auth',
  'src/features/admission-portal',
  'src/features/landing',
  'src/features/crm',
  'src/features/dashboard',
];

function removeRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
        console.log(`Deleted file: ${curPath}`);
      }
    });
    fs.rmdirSync(dirPath);
    console.log(`Removed folder: ${dirPath}`);
  }
}

let removedCount = 0;
dirsToRemove.forEach((relDir) => {
  const fullPath = path.join(__dirname, relDir);
  if (fs.existsSync(fullPath)) {
    removeRecursive(fullPath);
    removedCount++;
  }
});

console.log(`\nPhase C consolidation complete! Removed ${removedCount} feature directories.`);
