const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

content = content.replace(
  /color: v === "ghost" \? C\.slate : C\.white,/g,
  'color: v === "ghost" ? C.slate : "#FFFFFF",'
);

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('Fixed btn color');
