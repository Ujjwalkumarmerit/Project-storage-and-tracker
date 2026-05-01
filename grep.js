const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.jsx', 'utf-8').split('\n');
lines.forEach((l, i) => { if (l.includes('C.navy')) console.log(i + 1, l); });
