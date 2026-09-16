// Privacy-safe sample pages for real Chrome Web Store captures. Never packaged.
import { createServer } from "node:http";

const pages = {
  "/project-workspace": ["Project workspace", "F", "#79599f"],
  "/project-brief": ["Project brief", "B", "#79599f"],
  "/design-notes": ["Design notes", "D", "#79599f"],
  "/research-workspace": ["Research workspace", "R", "#397992"],
  "/reading-list": ["Reading list", "L", "#397992"],
  "/weekly-plan": ["Weekly plan", "W", "#397992"],
  "/inspiration": ["Design inspiration", "I", "#aa6f44"],
};
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const pageDetails = (path, fallback) => Object.hasOwn(pages, path) ? pages[path] : fallback;

for (const [port, fallback] of [
  [4179, ["Project workspace", "F", "#79599f"]],
  [4180, ["Inbox", "M", "#456fb5"]],
  [4181, ["Team calendar", "C", "#b26e54"]],
]) {
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const [title, letter, color] = pageDetails(url.pathname, fallback);
    if (url.pathname === "/favicon.svg") {
      const [, mark, shade] = pageDetails(url.searchParams.get("page"), fallback);
      response.writeHead(200, { "Content-Type": "image/svg+xml" });
      response.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${shade}"/><text x="16" y="23" text-anchor="middle" fill="white" font-family="Arial" font-weight="700" font-size="21">${mark}</text></svg>`);
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
      <link rel="icon" href="/favicon.svg?page=${escapeHtml(encodeURIComponent(url.pathname))}">
      <style>
        *{box-sizing:border-box}body{margin:0;background:#f6f4f9;color:#332f40;font-family:Arial,sans-serif}
        header{height:78px;padding:25px 40px;background:#fff;border-bottom:1px solid #e4dfeb;display:flex;align-items:center;gap:11px;font-weight:700}
        .mark{display:grid;place-items:center;width:28px;height:28px;background:${color};color:white;border-radius:7px}
        main{padding:54px 44px;max-width:920px}.eyebrow{font-size:11px;letter-spacing:2px;color:#8b79a5;font-weight:700}
        h1{font-size:40px;letter-spacing:-1.7px;margin:20px 0}p{color:#81788d;font-size:16px;line-height:1.65}
        .cards{display:flex;gap:20px;margin-top:34px}.card{background:#fff;border:1px solid #e4dfeb;border-radius:14px;padding:25px;flex:1}
        h2{font-size:17px;margin:0}.card p{font-size:13px}.line{background:#eeeaf3;border-radius:4px;height:7px;margin:14px 0}.line:last-child{width:67%}
        footer{margin-top:48px;font-size:12px;color:#93899f}
      </style></head><body><header><span class="mark">${letter}</span>Fieldnotes</header><main>
      <div class="eyebrow">ROOM TO FOCUS</div><h1>${title}</h1><p>Useful ideas, current work, and the next step. All together.</p>
      <div class="cards"><section class="card"><h2>In progress</h2><p>Everything you need for today's work.</p><div class="line"></div><div class="line"></div></section>
      <section class="card"><h2>Ready to explore</h2><p>A little room for the next good idea.</p><div class="line"></div><div class="line"></div></section></div>
      <footer>Sample workspace · No personal browsing data</footer></main></body></html>`);
  });
  server.listen(port, "127.0.0.1", () => console.log(`Sample pages: http://127.0.0.1:${port}`));
}
