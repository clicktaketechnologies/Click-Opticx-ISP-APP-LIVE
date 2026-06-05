
const fs = require('fs');

function replaceFile(path, search, replace) {
  let content = fs.readFileSync(path, 'utf8');
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Updated ' + path);
  }
}

replaceFile('pages/admin/SystemDiagnostic.tsx', 
  '<div className=\g-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl\>',
  '<div className=\g-white border border-slate-100 rounded-3xl overflow-x-auto shadow-xl\>'
);

replaceFile('pages/AICallingAdmin.tsx',
  '<div className=\lex-1 overflow-y-auto custom-scrollbar bg-white\>',
  '<div className=\lex-1 overflow-auto custom-scrollbar bg-white\>'
);

replaceFile('pages/AuthControlCenter.tsx',
  '<div className=\overflow-hidden border border-slate-100 rounded-2xl shadow-sm\>',
  '<div className=\overflow-x-auto border border-slate-100 rounded-2xl shadow-sm\>'
);
replaceFile('pages/AuthControlCenter.tsx',
  '<div className=\overflow-hidden border border-slate-100 rounded-2xl shadow-sm\>',
  '<div className=\overflow-x-auto border border-slate-100 rounded-2xl shadow-sm\>'
);

replaceFile('pages/CustomerPortal.tsx',
  '<div className=\overflow-hidden border border-slate-100 rounded-[2.5rem] bg-slate-50/30\>',
  '<div className=\overflow-x-auto border border-slate-100 rounded-[2.5rem] bg-slate-50/30\>'
);

replaceFile('pages/StaffManagement.tsx',
  '<div className=\	able-container !border-none !shadow-2xl !rounded-[3rem] overflow-hidden flex-1 flex flex-col\>',
  '<div className=\	able-container !border-none !shadow-2xl !rounded-[3rem] overflow-x-auto flex-1 flex flex-col\>'
);

replaceFile('pages/UserAppManagement.tsx',
  '<div className=\lex-1 overflow-y-auto custom-scrollbar bg-slate-50/50\>',
  '<div className=\lex-1 overflow-auto custom-scrollbar bg-slate-50/50\>'
);

