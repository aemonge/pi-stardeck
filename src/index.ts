import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import galacticaContextHeader from '../packages/pi-stardeck/index.js';
import galacticaStatus from '../packages/status/index.js';
import footerTelemetry from '../packages/footer/index.js';
import { registerStardeckHealth } from './health.js';
import { registerPiStatus } from './pi-status.js';

export const COCKPIT_SURFACES = {
  contextHeader: 'deck',
} as const;

export const COCKPIT_COMPOSITION = [
  'footer:telemetry',
  'galactica-status:provider',
  `galactica-context-header:${COCKPIT_SURFACES.contextHeader}`,
] as const;

export default function piStardeck(pi: ExtensionAPI): void {
  registerPiStatus(pi);
  footerTelemetry(pi);
  galacticaStatus(pi);
  galacticaContextHeader(pi, {
    surface: COCKPIT_SURFACES.contextHeader,
  });
  registerStardeckHealth(pi);
}
