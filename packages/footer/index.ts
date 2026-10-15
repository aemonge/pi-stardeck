import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';

import { activeQuotaProviders } from './src/quota.ts';
import { FOOTER_TELEMETRY_CHANNEL } from './src/protocol.ts';
import { buildFooterTelemetryMessage, collectTotalCost } from './src/telemetry.ts';

/**
 * Footer telemetry producer for the pi-stardeck deck. Renders nothing,
 * configures nothing, polls nothing: it walks the session branch for usage
 * cost and publishes deck-consumable snapshots on the footer-telemetry
 * channel after the events that can change them.
 */
export default function footerTelemetry(pi: ExtensionAPI): void {
  let context: ExtensionContext | undefined;

  const publish = () => {
    if (!context) return;
    const quota = activeQuotaProviders()
      .map((provider) => provider.snapshot())
      .find((snapshot) => snapshot !== undefined);
    pi.events.emit(
      FOOTER_TELEMETRY_CHANNEL,
      buildFooterTelemetryMessage(collectTotalCost(context), quota),
    );
  };

  pi.on('session_start', (_event, ctx) => {
    context = ctx;
    publish();
  });
  pi.on('message_end', publish);
  pi.on('model_select', publish);
  pi.on('session_compact', publish);
  pi.on('session_shutdown', () => {
    context = undefined;
  });
}
