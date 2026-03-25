const fs = require('fs');
const path = 'pages/UserManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix Financials Display
const oldFinancials = '{user.balance > 0 ? `Due: Rs. ${user.balance.toLocaleString()}` : \'Settled\'}';
const newFinancials = '{user.balance > 0 ? `Due: Rs. ${user.balance.toLocaleString()}` : user.balance < 0 ? `Credit: Rs. ${Math.abs(user.balance).toLocaleString()}` : \'Settled\'}';
if (content.indexOf(oldFinancials) !== -1) {
    content = content.replace(oldFinancials, newFinancials);
    console.log('Fixed Financials');
} else {
    console.log('Could not find Financials string');
}

// 2. Fix executeBulkDelete call (using a more flexible match)
if (content.indexOf('await db.bulkDeleteUsers(') !== -1) {
   // Use regex with global/multiline for safety
   const deleteRegex = /await db\.bulkDeleteUsers\(\s+Array\.from\(selectedIds\),\s+\(current, total, name\) => setProcessingState\(p => \(\{ \.\.\.p, current, total, itemName: name \}\)\)\s+\);/m;
   if (deleteRegex.test(content)) {
       content = content.replace(deleteRegex, `await db.bulkDeleteUsers(
         Array.from(selectedIds),
         creditRefundAction,
         (current, total, name) => setProcessingState(p => ({ ...p, current, total, itemName: name }))
      );`);
       console.log('Fixed bulkDeleteUsers call');
   } else {
       console.log('Could not match bulkDeleteUsers with regex');
   }
}

fs.writeFileSync(path, content);
