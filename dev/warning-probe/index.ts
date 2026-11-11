import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

// Live cockpit probe for the below-prompt warning
// (move-warning-below-prompt). Publishes a degraded graphify companion
// status through pi's native extension-status API — the same feed real
// companions use — so a fresh session renders
//
//   🔔 graphify active · report available · update recommended
//
// alone below the prompt. Load beside the cockpit:
//
//   pi -e dev/warning-probe
//
// Extensions bind at startup: a running session gains nothing. Silence
// returns by dropping the -e flag.
export default function warningProbe(pi: ExtensionAPI) {
  pi.on('session_start', (_event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setStatus?.(
      'graphify',
      'graphify active · report available · update recommended',
    );
  });
}
