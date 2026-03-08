const fs = require('fs');
const lines = fs.readFileSync('public/index.html','utf8').split('\n');
let depth = 0, containerDepth = -1;
lines.forEach((line, i) => {
  const opens = (line.match(/<div[\s>]/g)||[]).length;
  const closes = (line.match(/<\/div>/g)||[]).length;
  depth += opens - closes;
  const L = i + 1;
  if (line.includes('id="view-container"')) { containerDepth = depth; console.log('CONTAINER L'+L+' depth='+depth); }
  if (line.includes('<!-- ANALYTICS VIEW')) console.log('  analytics-comment L'+L+' depth='+depth);
  if (line.includes('id="view-analytics"')) console.log('ANALYTICS L'+L+' depth='+depth+' (need '+containerDepth+')');
  if (line.includes('id="view-achievements"')) console.log('ACHIEVE L'+L+' depth='+depth);
  if (depth < containerDepth && containerDepth > 0) {
    console.log('!BELOW_CONTAINER L'+L+' depth='+depth+' -> '+line.trim());
    containerDepth = depth;
  }
});
console.log('Final depth:', depth);
