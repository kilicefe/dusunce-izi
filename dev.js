import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const filteredArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--host') {
    if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
      const hostVal = rawArgs[i + 1];
      filteredArgs.push('-H', hostVal);
      i++;
    } else {
      filteredArgs.push('-H', '0.0.0.0');
    }
  } else if (arg.startsWith('--host=')) {
    const hostVal = arg.split('=')[1] || '0.0.0.0';
    filteredArgs.push('-H', hostVal);
  } else {
    filteredArgs.push(arg);
  }
}

if (!filteredArgs.includes('-p') && !filteredArgs.includes('--port')) {
  filteredArgs.push('-p', '3000');
}

const child = spawn('npx', ['next', 'dev', ...filteredArgs], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
