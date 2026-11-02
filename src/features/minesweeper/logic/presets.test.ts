import { describe, expect, it } from 'vitest';
import { PRESETS, presetToValues } from './presets.ts';
import { validateSetup } from './validateSetup.ts';

describe('PRESETS', () => {
  it.each(PRESETS.map((preset) => [preset.name, preset.config] as const))(
    'AC2: %s stays inside the setup ranges',
    (_, config) => {
      expect(validateSetup(presetToValues(config))).toEqual({ ok: true, config });
    },
  );
});
