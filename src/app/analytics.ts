// Visit counts with GoatCounter (https://www.goatcounter.com): no cookies, nothing stored in visitors' browsers, and
// only totals kept (pages, referring sites, browser, system, language, screen width, country). See the README's
// Privacy section.
// It runs only on the published site, so local previews and tests never send anything.

const CODE = "poker-tutor";
const SITE_HOST = "cherish-chen9336.github.io";

type GoatCounter = { no_onload?: boolean; count?: (vars: { path: string; title: string }) => void };

/** The page to count: the part after "#", e.g. "/zh-Hans/learn/3"; the plain site is "/". */
export function countedPath(hash: string): string {
  const path = hash.replace(/^#/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

// GoatCounter skips a browser that has this saved (its own "#toggle-goatcounter" switch sets it).
const SKIP_KEY = "skipgc";
const TOGGLE = "#toggle-goatcounter";

/**
 * Opening the site at "#toggle-goatcounter" stops counting this browser's visits (the owner's own), or starts it
 * again. GoatCounter has this switch too, but it reads the address only after the language redirect may have
 * changed it, so the app flips it here instead and then clears the address (so GoatCounter doesn't flip it back).
 */
function skipped(win: Window): boolean {
  try {
    return win.localStorage.getItem(SKIP_KEY) === "t";
  } catch {
    return false;
  }
}

function toggleOwnVisits(win: Window): void {
  try {
    const skipped = win.localStorage.getItem(SKIP_KEY) === "t";
    if (skipped) win.localStorage.removeItem(SKIP_KEY);
    else win.localStorage.setItem(SKIP_KEY, "t");
    win.alert(skipped ? "Visits from this browser are counted again." : "Visits from this browser are no longer counted.");
  } catch {
    win.alert("This browser won't save the setting, so its visits are still counted.");
  }
  // The language redirect may already have replaced the address; then there's nothing to clear.
  if (win.location.hash === TOGGLE) win.history.replaceState(null, "", win.location.pathname + win.location.search);
}

/**
 * Loads GoatCounter and counts this page and every later one (pages change by hash, which it doesn't see itself).
 * `firstHash` is the address the site was opened at, before the language redirect.
 */
export function startCounting(firstHash: string, win: Window & { goatcounter?: GoatCounter } = window): void {
  if (!CODE || win.location.host !== SITE_HOST) return;
  if (firstHash === TOGGLE) toggleOwnVisits(win);
  // Count pages ourselves: on its own, the script would count only the first page, without its hash.
  win.goatcounter = { no_onload: true };
  // Pages visited before the script has loaded wait here; not while this browser is opted out, or turning
  // counting back on would send them later.
  let waiting: string[] | null = skipped(win) ? [] : [countedPath(win.location.hash)];
  // No title: on a hash change the page's title hasn't caught up yet, so the path names the page instead.
  const send = (path: string) => win.goatcounter?.count?.({ path, title: "" });
  win.addEventListener("hashchange", () => {
    // Typed into the address bar of a page that's already open.
    if (win.location.hash === TOGGLE) return toggleOwnVisits(win);
    const path = countedPath(win.location.hash);
    if (waiting) {
      if (!skipped(win)) waiting.push(path);
    }
    else send(path);
  });
  const script = win.document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
  script.addEventListener("load", () => {
    const paths = waiting ?? [];
    waiting = null;
    paths.forEach(send);
  });
  win.document.head.append(script);
}
