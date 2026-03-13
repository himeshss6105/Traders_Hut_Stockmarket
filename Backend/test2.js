const cp = require('child_process');
const fs = require('fs');
try {
  let output = cp.execSync('node server.js', { encoding: 'utf8' });
  fs.writeFileSync('out.txt', output);
} catch(e) {
  let err = (e.stdout ? e.stdout.toString() : '') + "\n" + (e.stderr ? e.stderr.toString() : '') + "\n" + e.message;
  fs.writeFileSync('out.txt', err);
}
