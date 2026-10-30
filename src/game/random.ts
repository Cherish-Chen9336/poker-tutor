// The app's random source: Web Crypto via the engine's browser helper, never
// the engine's default shuffle (which needs Node's crypto module).
import { getBrowserRNG } from "@pokertools/engine/browser";

export function secureRandom(): () => number {
  return getBrowserRNG();
}
