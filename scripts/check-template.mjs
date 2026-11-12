// Runs the app skeleton's own checks (story 011 review finding 1): its unit tests and its typecheck.
// templates/app is deliberately not a workspace, so no other script sees it. The root node_modules
// resolves @swfactory/platform from there. Vitest writes a cache into templates/app/node_modules;
// it is removed again so the skeleton stays clean (and /new-app never copies it).
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEMPLATE = join(ROOT, 'templates', 'app');
const BIN = join(ROOT, 'node_modules', '.bin');
const cacheDir = join(TEMPLATE, 'node_modules');
const hadCache = existsSync(cacheDir);

function run(command, args, cwd) {
  const win = process.platform === 'win32';
  // Node >= 23 refuses to spawn .cmd shims without a shell (EINVAL hardening), so on
  // Windows run the shim through shell: true. With a shell the command must be quoted:
  // an unquoted path with a space reads as command + arguments (story 022, finding L1).
  const target = join(BIN, win ? `${command}.cmd` : command);
  const result = spawnSync(win ? `"${target}"` : target, args, {
    cwd,
    stdio: 'inherit',
    shell: win,
  });
  return result.status === 0;
}

const ok =
  run('vitest', ['run'], TEMPLATE) &&
  run('tsc', ['-p', join(TEMPLATE, 'tsconfig.app.json'), '--noEmit'], ROOT);

if (!hadCache) rmSync(cacheDir, { recursive: true, force: true });
if (!ok) {
  console.error('check-template: FAILED (templates/app)');
  process.exit(1);
}
console.log('check-template: ok templates/app (unit tests + typecheck)');
