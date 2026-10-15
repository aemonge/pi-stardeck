export const FOOTER_TELEMETRY_PROTOCOL_VERSION = 1 as const;

export const FOOTER_TELEMETRY_CHANNEL = 'pi-stardeck:footer-telemetry/v1';

export interface FooterTelemetryMessage {
  protocol: typeof FOOTER_TELEMETRY_PROTOCOL_VERSION;
  type: 'snapshot';
  totalCost: number;
  quotaPercent?: number;
}
