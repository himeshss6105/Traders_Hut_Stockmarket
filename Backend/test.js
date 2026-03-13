try {
  require('child_process').execSync('node server.js', { stdio: 'pipe' });
} catch (e) {
  console.log("Status:", e.status);
  console.log("Stdout:", e.stdout ? e.stdout.toString() : '');
  console.log("Stderr:", e.stderr ? e.stderr.toString() : '');
  console.log("Error:", e.message);
}
