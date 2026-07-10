// middleware.js — Vercel Edge Middleware
// -----------------------------------------------------------------------------
// Regional access restriction (geo-IP).
//
// Blocks requests originating from the listed countries and returns an
// HTTP 451 ("Unavailable For Legal Reasons") branded page. The visitor's
// country is read from Vercel's `x-vercel-ip-country` request header, which
// is an ISO 3166-1 alpha-2 code set at the edge from the client IP.
//
// NOTE: geo-IP is a good-faith regional restriction, not a security control.
// VPN / proxy users can present an IP from another country and bypass this.
// To change the list, edit BLOCKED below (one ISO alpha-2 code per entry).
// -----------------------------------------------------------------------------

export const config = {
  // Run on the document entry points and the content fragments the site
  // fetches. Blocking these prevents a restricted visitor from rendering any
  // of the page; static assets alone are meaningless without them.
  matcher: ['/', '/index.html', '/sections/:path*'],
};

const BLOCKED = new Set([
  // ---------- Europe · EU-27 ----------
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  // ---------- Europe · UK + EFTA ----------
  'GB', 'CH', 'NO', 'IS', 'LI',
  // ---------- Europe · micro-states ----------
  'AD', 'MC', 'SM', 'VA',
  // ---------- Europe · other (non-EU) ----------
  'UA', 'RS', 'AL', 'MK', 'ME', 'BA', 'MD', 'XK',
  // ---------- Europe · sanctions-adjacent (remove if undesired) ----------
  'BY',
  // ---------- South America ----------
  'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE',
  // ---------- South America · territories ----------
  'GF', 'FK',
  // ---------- Turkey ----------
  'TR',
]);

export default function middleware(request) {
  const country = request.headers.get('x-vercel-ip-country') || 'XX';

  // --- TEMPORARY self-test endpoint (removed after verification) ---
  const url = new URL(request.url);
  if (url.searchParams.has('geocheck')) {
    const tested = (url.searchParams.get('test') || country).toUpperCase();
    return Response.json(
      { detected: country, tested, blocked: BLOCKED.has(tested), total: BLOCKED.size },
      { headers: { 'cache-control': 'no-store' } }
    );
  }
  // --- end self-test ---

  if (BLOCKED.has(country)) {
    return new Response(blockPage(country), {
      status: 451,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  // Allowed — return nothing so the request continues to the static site.
  return;
}

function blockPage(country) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Shard Partners</title>
<style>
  :root{color-scheme:dark}
  *{margin:0;padding:0;box-sizing:border-box}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#050608;color:#e9edf5;padding:32px;text-align:center;line-height:1.62;
    font-family:'Inter Tight',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased}
  .box{max-width:432px}
  svg{width:42px;height:42px;margin:0 auto 30px;display:block}
  .mark{font-size:11px;letter-spacing:.34em;text-transform:uppercase;
    color:rgba(233,237,245,.5);margin-bottom:28px}
  h1{font-size:22px;font-weight:400;letter-spacing:.01em;margin-bottom:15px}
  p{font-size:14px;font-weight:300;color:rgba(233,237,245,.6)}
  .code{margin-top:26px;font-size:10.5px;letter-spacing:.22em;
    text-transform:uppercase;color:rgba(233,237,245,.3)}
</style>
</head>
<body>
  <div class="box">
    <svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,2 27,12 16,30 5,12" fill="none" stroke="#2e63ff" stroke-width="2"/></svg>
    <div class="mark">Shard Partners</div>
    <h1>Not available in your region</h1>
    <p>Access to this site is currently restricted in your location for regulatory reasons. If you believe this is a mistake, please reach out to our team.</p>
    <div class="code">HTTP 451 &middot; ${country}</div>
  </div>
</body>
</html>`;
}
