import { devices } from '@playwright/test';
import { createAppPlaywrightConfig } from '@swfactory/platform/config/playwright';

export default createAppPlaywrightConfig({
  title: 'Minesweeper',
  // Visible right after sign-in (the board only after Start).
  signedInContent: { role: 'button', name: 'Start' },
  // Story 009 / ADR 0005: the same software WebGL (SwiftShader) on macOS and ubuntu CI.
  // Recent Chromium on Linux needs --enable-unsafe-swiftshader for the software fallback.
  // No effect on 2D tests. Applies to every project (also chromium-3d).
  launchArgs: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  extraProjects: [
    {
      // Story 008/AC4: the flows of 005 (flag, long press, keyboard, lose, win) once more with
      // the 3D view chosen (minesweeper.spec.ts selects it in its beforeEach).
      name: 'chromium-3d',
      testMatch: 'minesweeper.spec.ts',
      grep: /AC(6|8|9|10):/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
