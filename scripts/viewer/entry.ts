// Standalone card viewer for /k/#… – plain JS, built for old iPhones too (no Next.js/React needed).
import { renderCardHTML } from "../../src/lib/render";
import { decodeCard } from "../../src/lib/share";

const $ = (id: string) => document.getElementById(id)!;

function oldIOS(): boolean {
  const m = /(iPhone|iPad|iPod).* OS (\d+)_/.exec(navigator.userAgent);
  return !!m && Number(m[2]) < 13;
}

function show(html: string) {
  const title = /<title>([^<]*)<\/title>/.exec(html);
  if (title) document.title = title[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  // iOS 12 and older stretch iframes to their content, which breaks fullscreen effects – show the card directly there.
  if (oldIOS() || !("srcdoc" in document.createElement("iframe"))) {
    document.open();
    document.write(html);
    document.close();
    return;
  }
  // Sandboxed without same-origin: a crafted link can never reach this site's storage.
  const f = document.createElement("iframe");
  f.className = "viewer";
  f.title = "Überraschung";
  f.setAttribute("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
  f.setAttribute("allow", "fullscreen; web-share; clipboard-write");
  f.srcdoc = html;
  const old = document.querySelector("iframe");
  if (old) old.parentNode!.removeChild(old);
  document.body.appendChild(f);
  $("wait").hidden = true;
  $("fail").hidden = true;
  f.focus();
}

function load() {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    $("wait").hidden = true;
    $("fail").hidden = false;
    return;
  }
  decodeCard(hash).then((d) => {
    if (!d) {
      $("wait").hidden = true;
      $("fail").hidden = false;
      return;
    }
    show(renderCardHTML(d));
  });
}

load();
window.addEventListener("hashchange", load);
