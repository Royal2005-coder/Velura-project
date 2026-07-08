const { exec } = require('child_process');
exec('npx vite --host --port 5174', { cwd: __dirname + '/../admin-web' }, (err, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
});
