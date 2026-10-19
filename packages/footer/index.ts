import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';

import { activeQuotaProviders } from './src/quota.ts';
import { startZaiQuotaProvider } from './src/quota-zai.ts';
import { FOOTER_TELEMETRY_CHANNEL } from './src/protocol.ts';
import { buildFooterTelemetryMessage, collectTotalCost } from './src/telemetry.ts';

/**
 * Footer telemetry producer for the pi-stardeck deck. Renders nothing,
 * configures nothing: it walks the session branch for usage cost and
 * publishes deck-consumable snapshots on the footer-telemetry channel
 * after the events that can change them. The z.ai quota provider rides
 * the same cadence — session start, model change, and its own 5-minute
 * interval — with snapshots cached between ticks.
 */
export default function footerTelemetry(pi: ExtensionAPI): void {
  let context: ExtensionContext | undefined;
  const zai = startZaiQuotaProvider();

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

  // Fire-and-forget refresh then republish: the fetch resolves between
  // events, and the publish lands the lit gauge without waiting for the
  // next message.
  const refreshQuota = () => {
    void zai.refresh().then(() => publish());
  };

  pi.on('session_start', (_event, ctx) => {
    context = ctx;
    refreshQuota();
    publish();
  });
  pi.on('message_end', publish);
  pi.on('model_select', () => {
    refreshQuota();
    publish();
  });
  pi.on('session_compact', publish);
  pi.on('session_shutdown', () => {
    context = undefined;
    zai.stop();
  });
}
