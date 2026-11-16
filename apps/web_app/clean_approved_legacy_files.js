const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'src/main - Copy.tsx',
  'src/vite-env.d - Copy.ts',
  'package-lock.json',
  'src/routes/admissionRoutes.ts',
  'src/app/router/AppRoutes.tsx',
  'src/app/router/index.tsx',
  'src/layouts/ParentLayout.tsx',
  'src/layouts/AdminLayout.tsx',
  'src/layouts/FacultyLayout.tsx',
  'src/layouts/FinanceLayout.tsx',
  'src/layouts/ExamAdminLayout.tsx',
  'src/modules/admission/layouts/ParentAdmissionLayout.tsx',
  'src/modules/admission/layouts/AdmissionWorkspaceLayout.tsx',
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

// Remove empty folders if empty
['src/routes', 'src/app/router', 'src/modules/admission/layouts'].forEach((dir) => {
  const p = path.join(__dirname, dir);
  if (fs.existsSync(p) && fs.readdirSync(p).length === 0) {
    fs.rmdirSync(p);
    console.log(`Removed empty directory: ${dir}`);
  }
});

console.log(`\nCleanup completed! Deleted ${deleted} files.`);
