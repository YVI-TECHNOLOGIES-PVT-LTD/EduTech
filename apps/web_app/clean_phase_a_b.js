import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToDelete = [
  'src/config/navigation.config.ts',
  'src/components/navigation/Sidebar.tsx',
  'src/routes/appRoutes.ts',
  'src/routes/attendanceRoutes.ts',
  'src/routes/studentRoutes.ts',
  'src/layouts/DashboardLayout.tsx',
];

let deleted = 0;
filesToDelete.forEach((f) => {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Deleted: ${f}`);
    deleted++;
  }
});

['src/routes', 'src/components/navigation'].forEach((dir) => {
  const p = path.join(__dirname, dir);
  if (fs.existsSync(p) && fs.readdirSync(p).length === 0) {
    fs.rmdirSync(p);
    console.log(`Removed empty directory: ${dir}`);
  }
});

console.log(`Phase A & B consolidation complete! Deleted ${deleted} files.`);
