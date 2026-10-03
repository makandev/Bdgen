import { contrast, mix, rgba } from "./color";
import { occasionLabel } from "./presets";
import type { CardData, Scene } from "./types";

export interface RenderOptions {
  /** 1-based scene to open first (editor preview). */
  startScene?: number;
  /** Adds the iPhone "save to Files" hint below the card (downloaded file). */
  exportFile?: boolean;
  /** Server version: where the recipient's reaction is posted. Without it, the reaction is sent back via share/WhatsApp. */
  reactUrl?: string;
  /** Editor/gallery preview: reactions only show what the recipient would see. */
  preview?: boolean;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Escapes text, then applies the small markup set: {{name}}, **bold**, *em*, line breaks. */
export function fmt(s: string, name: string): string {
  return esc(s)
    .replace(/\{\{\s*name\s*\}\}/gi, esc(name))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

export function plain(s: string, name: string): string {
  return s.replace(/\{\{\s*name\s*\}\}/gi, name).replace(/\*+/g, "").replace(/\n/g, " ");
}

const FONTS = {
  serif: 'Georgia,"Times New Roman",serif',
  sans: 'ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif',
  script: '"Snell Roundhand","Apple Chancery","Segoe Script","Brush Script MT",Georgia,cursive',
  mono: 'ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono","Courier New",monospace',
  block: '"Arial Black","Segoe UI Black","Helvetica Neue",Impact,system-ui,sans-serif',
};

/** Extra CSS per card style. Old cards without a style fall back to "glass". */
function styleCss(d: CardData): string {
  const t = d.theme;
  const pal = t.confetti.length ? t.confetti : [t.accent];
  const c = (i: number) => pal[i % pal.length];
  const titleAnim = "titleIn .72s .08s both cubic-bezier(.2,.8,.2,1)";
  let out = "";
  switch (t.style ?? "glass") {
    case "luxe": {
      const g = t.dark
        ? `${t.accent} 0%,${t.accentLight} 30%,#fffaf0 48%,${t.accentLight} 66%,${t.accent} 100%`
        : `${t.text} 0%,${t.accentDark} 28%,${t.accent} 50%,${t.accentDark} 72%,${t.text} 100%`;
      out = `
.card{border:1px solid ${rgba(t.accent, 0.62)};box-shadow:inset 0 0 0 1px ${rgba(t.accentLight, 0.2)},0 0 0 6px ${rgba(t.accent, 0.07)},0 26px 74px ${rgba(t.accentDark, t.dark ? 0.55 : 0.2)},0 0 70px ${rgba(t.accent, t.dark ? 0.2 : 0.14)}}
.card:before{content:"";position:absolute;inset:11px;border:1px solid ${rgba(t.accent, 0.38)};border-radius:17px;pointer-events:none}
.screen.active .card h1,.screen.active .card h2{background:linear-gradient(100deg,${g});background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:${titleAnim},flow 7s linear infinite}
@keyframes flow{to{background-position:-220% 0}}`;
      break;
    }
    case "holo": {
      const g = t.dark ? pal.concat(pal[0]).join(",") : "#c2185b,#6a1b9a,#1565c0,#00897b,#c2185b";
      out = `
.card{border-color:transparent}
.card:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:2px;background:linear-gradient(120deg,${pal.concat(pal[0]).join(",")});background-size:300% 300%;animation:holo 6s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes holo{to{background-position:300% 0}}
.screen.active .card h1,.screen.active .card h2{background:linear-gradient(90deg,${g});background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:${titleAnim},holo 9s linear infinite}
button:not(.ghost){background:linear-gradient(120deg,${pal.concat(pal[0]).join(",")});background-size:300% 300%;animation:holo 6s linear infinite}`;
      break;
    }
    case "terminal":
      out = `
body,p,.top,.tiny,.seal,.revealbox,.signature,.quote{font-family:${FONTS.mono}}
.card{border-radius:8px;border:1px solid ${rgba(t.accent, 0.55)};background:${rgba(t.card, 0.9)};box-shadow:0 0 0 1px ${rgba(t.accent, 0.12)},0 0 34px ${rgba(t.accent, 0.25)},inset 0 0 44px ${rgba(t.accent, 0.07)}}
.card:before{content:"";position:absolute;inset:0;border-radius:inherit;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px);pointer-events:none;z-index:2}
h1,h2{text-shadow:0 0 14px ${rgba(t.accent, 0.55)};letter-spacing:-.01em}
.screen.active .card h1:after{content:"_";color:var(--accent);animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.eyebrow:before{content:"> "}
button{background:${rgba(t.accent, 0.08)};color:var(--accent);border:1px solid var(--accent);box-shadow:0 0 16px ${rgba(t.accent, 0.3)},inset 0 0 12px ${rgba(t.accent, 0.12)};border-radius:6px;font-family:${FONTS.mono}}
button:hover{background:${rgba(t.accent, 0.18)}}.ghost{color:var(--text2);border-color:${rgba(t.accent, 0.4)};box-shadow:none}
.clock{font-family:${FONTS.mono};font-weight:400;letter-spacing:-.04em}
.revealbox,.personal{border-radius:4px}.seal{border-radius:4px}`;
      break;
    case "pixel":
      out = `
.card{border-radius:8px;border:4px solid var(--text);background:var(--card);box-shadow:10px 10px 0 ${rgba(t.text, 0.9)};backdrop-filter:none;-webkit-backdrop-filter:none}
h1,h2{letter-spacing:-.01em}
.ornament{color:${c(0)}}
.eyebrow{display:inline-block;background:var(--accent);color:${t.text};padding:5px 11px;border:2px solid var(--text);border-radius:5px;letter-spacing:.12em;font-weight:800;animation:none}
.clock{background:none;color:var(--text);-webkit-text-fill-color:var(--text);text-shadow:5px 5px 0 ${c(3)};font-family:${FONTS.block};font-weight:900;letter-spacing:-.03em;animation:none}
button{border-radius:8px;border:3px solid var(--text);background:var(--accent);color:${t.text};box-shadow:0 6px 0 var(--text);font-family:${FONTS.block};font-weight:900;text-transform:uppercase;letter-spacing:.03em;transition:transform .1s,box-shadow .1s}
button:hover{transform:translateY(-2px);box-shadow:0 8px 0 var(--text)}button:active{transform:translateY(4px);box-shadow:0 2px 0 var(--text)}
.ghost{background:#fff;color:var(--text)}
.choice button:not(.ghost){background:${c(2)}}
.revealbox{border:3px solid var(--text);border-radius:8px;box-shadow:6px 6px 0 ${rgba(t.text, 0.85)};background:#fff}
.personal{background:${rgba(c(1), 0.45)};border-radius:6px}
.progress{height:10px;border:2px solid var(--text);border-radius:4px;background:#fff}.bar{background:repeating-linear-gradient(90deg,${c(0)} 0 14px,${c(1)} 14px 28px,${c(2)} 28px 42px,${c(3)} 42px 56px)}
.seal{border:2px solid var(--text);border-radius:6px;color:var(--text)}
.bigcheck{color:${c(2)};text-shadow:3px 3px 0 var(--text)}
.gift-name{background:none;color:var(--text);-webkit-text-fill-color:var(--text);text-shadow:3px 3px 0 ${c(1)}}
.gift-box,.gift-lid{border:3px solid var(--text);border-radius:4px}`;
      break;
  }
  if ((d.effects.backdrop ?? "dots") === "aurora") {
    out += `
body:before{content:"";position:fixed;inset:-25%;pointer-events:none;z-index:0;background:radial-gradient(34% 30% at 25% 30%,${rgba(c(0), 0.55)},transparent 70%),radial-gradient(30% 34% at 76% 26%,${rgba(c(1), 0.5)},transparent 70%),radial-gradient(40% 30% at 55% 80%,${rgba(c(2), 0.45)},transparent 70%);filter:blur(40px);animation:aurora 16s ease-in-out infinite alternate}
@keyframes aurora{0%{transform:translate3d(-4%,-2%,0) rotate(0) scale(1)}100%{transform:translate3d(4%,3%,0) rotate(8deg) scale(1.12)}}`;
  }
  return out;
}

function css(d: CardData): string {
  const t = d.theme;
  const darkText = mix(t.accentDark, "#000000", 0.55);
  const btnText = contrast(darkText, t.accent) >= contrast("#ffffff", t.accent) ? darkText : "#ffffff";
  const glow = t.dark ? rgba(t.accentLight, 0.12) : "rgba(255,255,255,.95)";
  const font = FONTS[t.headingFont] ? t.headingFont : "serif";
  const headingWeight = { serif: 400, sans: 650, script: 400, mono: 600, block: 900 }[font];
  const headingScale = { serif: 1, sans: 1, script: 1.18, mono: 0.86, block: 0.9 }[font];
  const cinDark = mix(t.cinemaBg, "#000000", 0.55);
  const cinDarker = mix(t.cinemaBg, "#000000", 0.85);

  return `
:root{--bg:${t.bg};--bg2:${t.bg2};--text:${t.text};--text2:${t.text2};--muted:${t.muted};--line:${rgba(t.accentDark, 0.22)};--accent:${t.accent};--al:${t.accentLight};--ad:${t.accentDark};--card:${t.card};--btn:${btnText};--hf:${FONTS[font]}}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:radial-gradient(circle at 15% 8%,${glow},transparent 30rem),radial-gradient(circle at 88% 22%,${rgba(t.accent, 0.2)},transparent 28rem),radial-gradient(circle at 25% 85%,${rgba(t.accentLight, 0.3)},transparent 28rem),linear-gradient(145deg,var(--bg),var(--bg2));background-attachment:fixed;color:var(--text);font-family:${FONTS.sans};overflow-x:hidden}
canvas.fx{position:fixed;inset:0;pointer-events:none}.app{position:relative;z-index:1;width:min(840px,calc(100% - 24px));margin:auto;padding:22px 0 54px}
.top{display:flex;justify-content:space-between;gap:12px;align-items:center;color:var(--muted);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;padding:5px 3px 18px}
.progress{height:3px;background:${rgba(t.accentDark, 0.1)};border-radius:99px;overflow:hidden;margin-bottom:20px}.bar{height:100%;width:0;background:linear-gradient(90deg,var(--ad),var(--accent),var(--al),var(--ad));transition:width .7s ease}
.screen{display:none;min-height:72vh;align-items:center;justify-content:center}.screen.active{display:flex}.screen.active .card{opacity:1}
.card{position:relative;overflow:hidden;width:100%;border:1px solid var(--line);background:linear-gradient(145deg,${rgba(t.card, 0.86)},${rgba(mix(t.card, t.bg2, 0.35), 0.7)});backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);border-radius:26px;box-shadow:0 24px 70px ${rgba(t.accentDark, t.dark ? 0.35 : 0.12)},inset 0 1px 0 ${rgba("#ffffff", t.dark ? 0.08 : 0.95)};padding:clamp(26px,6vw,58px);text-align:center;opacity:0;transform:translateY(14px) scale(.99);animation:enter .7s forwards}
@keyframes enter{to{opacity:1;transform:none}}
.shine .card:after{content:"";position:absolute;inset:-70% -35%;pointer-events:none;background:linear-gradient(115deg,transparent 42%,${rgba("#ffffff", t.dark ? 0.07 : 0.32)} 49%,${rgba(t.accentLight, t.dark ? 0.08 : 0.24)} 52%,transparent 59%);transform:translateX(-55%) rotate(4deg);animation:shine 8s ease-in-out infinite}
@keyframes shine{0%,68%{transform:translateX(-58%) rotate(4deg)}86%,100%{transform:translateX(58%) rotate(4deg)}}
.card>*{position:relative;z-index:1}.ornament{font-size:1.25rem;letter-spacing:.55em;color:var(--accent);margin-bottom:8px}
.eyebrow{color:var(--accent);font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;margin-bottom:13px;animation:goldPulse 3.2s ease-in-out infinite}
.clock{font-size:clamp(4rem,17vw,8rem);font-weight:250;line-height:.95;letter-spacing:-.06em;background:linear-gradient(180deg,var(--ad) 0%,var(--accent) 42%,var(--al) 58%,var(--ad) 100%);background-clip:text;-webkit-background-clip:text;color:transparent;margin:8px 0 10px;animation:clockGlow 4s ease-in-out infinite}
h1,h2{font-family:var(--hf);font-weight:${headingWeight};margin:8px auto 18px;max-width:720px;line-height:1.2}h1{font-size:clamp(${2 * headingScale}rem,6vw,${3.8 * headingScale}rem)}h2{font-size:clamp(${1.7 * headingScale}rem,5vw,${2.9 * headingScale}rem)}
p{font-size:clamp(1rem,2.5vw,1.2rem);line-height:1.78;color:var(--text2);max-width:690px;margin:12px auto}.muted{color:var(--muted)}
button{appearance:none;border:1px solid ${rgba(t.accentLight, 0.45)};background:linear-gradient(135deg,var(--al) 0%,var(--accent) 48%,var(--al) 70%,var(--ad) 100%);color:var(--btn);box-shadow:0 9px 24px ${rgba(t.accentDark, 0.18)},inset 0 1px 0 rgba(255,255,255,.6);border-radius:999px;min-height:49px;padding:13px 22px;font:650 1rem ${FONTS.sans};cursor:pointer;margin:17px 5px 0;transition:.2s;-webkit-tap-highlight-color:transparent}
button:hover{transform:translateY(-2px)}button:focus-visible{outline:3px solid var(--al);outline-offset:4px}
.ghost{background:${rgba(t.card, 0.58)};color:var(--text);border-color:var(--line)}.tiny{font-size:.82rem;color:var(--muted);margin-top:19px}
.revealbox{margin:25px auto 0;max-width:620px;border:1px solid var(--line);border-radius:19px;padding:20px;background:${rgba(t.card, 0.48)};text-align:left}
.revealbox div{padding:13px 4px;border-bottom:1px solid ${rgba(t.accentDark, 0.13)};opacity:0;transform:translateX(-8px);transition:.5s;color:var(--text2)}.revealbox div:last-child{border-bottom:0}.revealbox div.in{opacity:1;transform:none}
.revealbox small{display:block;color:var(--muted);margin-bottom:4px}.personal{background:${rgba(t.accent, 0.12)};border-radius:12px;padding-left:12px!important}.personal strong{color:var(--text)}
.quote{font:400 clamp(1.45rem,4vw,2.25rem)/1.5 var(--hf);margin:22px auto;max-width:680px}
.seal{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:999px;padding:10px 15px;color:var(--muted);margin-top:18px}
.dot{width:8px;height:8px;border-radius:50%;background:#6da778;box-shadow:0 0 13px rgba(109,167,120,.55)}
.bigcheck{font-size:3.3rem;margin:5px;color:var(--accent)}.hidden{display:none!important}
.choice{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:610px;margin:20px auto 0}.choice button{margin:0;border-radius:17px;min-height:82px}
.signature{margin-top:25px;color:var(--muted);line-height:1.6}
@media(max-width:580px){.choice{grid-template-columns:1fr}.screen{min-height:68vh}.app{width:min(100% - 18px,840px)}.top{font-size:.67rem}}
.card.celebrate{animation:cardPop .72s cubic-bezier(.2,.8,.2,1)}
@keyframes cardPop{0%{transform:scale(.975)}55%{transform:scale(1.012)}100%{transform:scale(1)}}
@keyframes goldPulse{0%,100%{text-shadow:0 0 0 transparent}50%{text-shadow:0 0 18px ${rgba(t.accent, 0.38)}}}
@keyframes clockGlow{0%,100%{filter:drop-shadow(0 3px 8px ${rgba(t.accentDark, 0.12)})}50%{filter:drop-shadow(0 4px 18px ${rgba(t.accentDark, 0.36)})}}
.orbit{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:26px;z-index:0}
.orbit i{position:absolute;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#ffffff 0 20%,var(--accent) 35%,transparent 72%);opacity:.65;animation:floatSpark var(--dur) ease-in-out infinite alternate}
@keyframes floatSpark{from{transform:translate3d(0,0,0) scale(.7);opacity:.25}to{transform:translate3d(var(--dx),var(--dy),0) scale(1.45);opacity:.9}}
.ribbon{position:fixed;top:-70px;width:8px;height:42px;border-radius:8px;pointer-events:none;z-index:5;opacity:.82;animation:ribbonFall linear forwards}
@keyframes ribbonFall{0%{transform:translate3d(0,-70px,0) rotate(0deg)}100%{transform:translate3d(var(--drift),calc(100vh + 130px),0) rotate(var(--rot))}}
.spark{position:fixed;width:8px;height:8px;pointer-events:none;z-index:7;background:var(--accent);clip-path:polygon(50% 0,61% 37%,100% 50%,61% 63%,50% 100%,39% 63%,0 50%,39% 37%);animation:sparkPop .9s ease-out forwards}
@keyframes sparkPop{0%{transform:translate(0,0) scale(.2) rotate(0);opacity:0}20%{opacity:1}100%{transform:translate(var(--sx),var(--sy)) scale(1.2) rotate(150deg);opacity:0}}
.screen.active .card h1,.screen.active .card h2{animation:titleIn .72s .08s both cubic-bezier(.2,.8,.2,1)}
.screen.active .card p{animation:textIn .65s .18s both ease}
@keyframes titleIn{from{opacity:0;transform:translateY(13px);letter-spacing:.015em}to{opacity:1;transform:none;letter-spacing:normal}}
@keyframes textIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.cinema{position:fixed;inset:0;z-index:50;background:radial-gradient(circle at 50% 45%,${t.cinemaBg} 0,${cinDark} 30%,${cinDarker} 72%,#020201 100%);overflow:hidden;color:#fff}
.cinema canvas{position:absolute;inset:0;width:100%;height:100%}.cinema-vignette{position:absolute;inset:0;background:radial-gradient(circle,transparent 35%,rgba(0,0,0,.68) 100%);pointer-events:none}
.cinema-scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;opacity:0;pointer-events:none}
.cinema-small{font-size:clamp(.75rem,2vw,1.05rem);letter-spacing:.38em;text-transform:uppercase;color:${mix(t.accentLight, "#ffffff", 0.2)}}
.cinema-name,.cinema-title{font:400 clamp(3rem,10vw,7.2rem)/1.08 var(--hf);background:linear-gradient(180deg,#ffffff 0,${mix(t.accentLight, "#ffffff", 0.15)} 43%,var(--accent) 72%,${mix(t.accentLight, "#ffffff", 0.4)} 100%);background-clip:text;-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 5px 18px ${rgba(t.accent, 0.32)})}
.cinema-name{margin-top:14px}.cinema-final{font:400 clamp(2.2rem,7vw,5.3rem)/1.15 var(--hf);color:#fffaf0}.cinema-final em{color:${mix(t.accentLight, t.accent, 0.35)};font-style:normal}
.cinema-emoji{font-size:clamp(3rem,8vw,5rem);margin-top:24px;filter:drop-shadow(0 0 20px ${rgba(t.accentLight, 0.38)})}
.cinema.play .scene1{animation:cin1 var(--cin) both}.cinema.play .scene2{animation:cin2 var(--cin) both}.cinema.play .scene3{animation:cin3 var(--cin) both}.cinema.play .scene4{animation:cin4 var(--cin) both}
@keyframes cin1{0%{opacity:0;transform:scale(.97)}6%,17%{opacity:1;transform:scale(1)}23%,100%{opacity:0;transform:scale(1.03)}}
@keyframes cin2{0%,20%{opacity:0;transform:translateY(12px) scale(.98)}29%,43%{opacity:1;transform:none}50%,100%{opacity:0;transform:scale(1.025)}}
@keyframes cin3{0%,47%{opacity:0;transform:scale(.94)}56%,72%{opacity:1;transform:scale(1)}79%,100%{opacity:0;transform:scale(1.035)}}
@keyframes cin4{0%,76%{opacity:0;transform:translateY(12px)}84%,100%{opacity:1;transform:none}}
.cinema-close{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:60;opacity:0;pointer-events:none;background:rgba(255,255,255,.12);border:1px solid ${rgba(t.accentLight, 0.48)};color:#fff;box-shadow:none;backdrop-filter:blur(10px)}
.cinema.done .cinema-close{opacity:1;pointer-events:auto;transition:opacity .8s}.cinema.done .scene4{opacity:1!important}
${styleCss(d)}
.gift-wrap{position:relative;width:150px;height:150px;margin:24px auto 6px;cursor:pointer;outline:none;animation:wiggle 2.6s ease-in-out infinite}
.gift-wrap:focus-visible{outline:3px solid var(--al);outline-offset:8px;border-radius:12px}
.gift-box{position:absolute;left:16px;right:16px;bottom:0;height:92px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--ad));box-shadow:0 14px 30px ${rgba(t.accentDark, 0.3)}}
.gift-box:before,.gift-lid:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:18px;margin-left:-9px;background:var(--al)}
.gift-lid{position:absolute;left:6px;right:6px;top:30px;height:32px;border-radius:7px;z-index:2;background:linear-gradient(135deg,var(--accent),var(--ad));box-shadow:0 4px 10px ${rgba(t.accentDark, 0.25)};transition:transform .8s cubic-bezier(.2,.8,.2,1),opacity .8s}
.gift-bow{position:absolute;left:50%;top:-24px;width:56px;height:28px;margin-left:-28px}
.gift-bow:before,.gift-bow:after{content:"";position:absolute;top:0;width:28px;height:26px;border:7px solid var(--al);border-radius:50% 50% 50% 50%/60% 60% 40% 40%}
.gift-bow:before{left:-4px;transform:rotate(-18deg)}.gift-bow:after{right:-4px;transform:rotate(18deg)}
.gift-wrap.open{animation:none;cursor:default}.gift-wrap.open .gift-lid{transform:translateY(-110px) rotate(-28deg);opacity:0}
@keyframes wiggle{0%,78%,100%{transform:rotate(0)}82%{transform:rotate(-7deg)}86%{transform:rotate(6deg)}90%{transform:rotate(-4deg)}94%{transform:rotate(2deg)}}
.gift-reveal{animation:titleIn .7s both cubic-bezier(.2,.8,.2,1)}
.gift-name{font:${t.headingFont === "block" ? 900 : 400} clamp(1.8rem,6vw,3rem)/1.2 var(--hf);margin:6px auto 4px;max-width:620px;background:linear-gradient(100deg,${t.dark ? "var(--al),var(--accent),var(--al)" : "var(--ad),var(--accent),var(--ad)"});-webkit-background-clip:text;background-clip:text;color:transparent}
.reactions{margin:30px auto 0;max-width:560px;padding-top:22px;border-top:1px solid var(--line)}
.react-q{margin:0 0 12px;font-weight:600;color:var(--text)}
.react-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.react{display:inline-flex;align-items:center;gap:7px;margin:0;min-height:44px;padding:8px 14px;border-radius:999px;font-size:.92rem}
.react .re{font-size:1.3rem}.react.picked{background:linear-gradient(135deg,var(--al),var(--accent));color:var(--btn);border-color:transparent}
.react-big{font-size:3rem;margin-top:16px;animation:pop .6s cubic-bezier(.2,.8,.2,1)}
@keyframes pop{0%{transform:scale(.3)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
.react-thanks{margin:6px auto}.react-more{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px}
.react-msg{flex:1;min-width:180px;max-width:360px;font:16px/1.4 inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:${rgba(t.card, 0.9)};color:var(--text)}
.react-more button,.react-send{margin:0}
.float-emoji{position:fixed;bottom:-40px;z-index:8;pointer-events:none;font-size:2rem;animation:floatUp 2.4s ease-out forwards}
@keyframes floatUp{to{transform:translate3d(var(--fx),-110vh,0) rotate(var(--fr));opacity:0}}
.nojs .gift-reveal{display:block!important}.nojs .gift-wrap{display:none}
.ioshint{max-width:760px;margin:10px auto 32px;padding:0 18px;text-align:center;font:12px/1.45 system-ui,sans-serif;color:var(--muted)}
.nojs .screen{display:flex;min-height:auto;margin-bottom:18px}.nojs .card{opacity:1;transform:none;animation:none}.nojs .revealbox div{opacity:1;transform:none}.nojs .hidden{display:none!important}.nojs [data-next],.nojs .finish,.nojs .cinema-start{display:none}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.card{opacity:1;transform:none}}
`;
}

function renderScene(s: Scene, i: number, d: CardData): string {
  const n = d.recipientName;
  const f = (x: string) => fmt(x, n);
  const eyebrow = (x: string) => (x.trim() ? `<div class="eyebrow">${f(x)}</div>` : "");
  const paras = (xs: string[]) => xs.map((x) => `<p>${f(x)}</p>`).join("");
  const next = (label: string, extra = "") => `<button type="button" data-next ${extra}>${f(label)}</button>`;
  const step = i + 1;
  let body = "";
  switch (s.type) {
    case "greeting":
      body = `<div class="ornament" aria-hidden="true">✦ ✧ ✦</div>
<div class="eyebrow" data-date="${s.eyebrow.trim() ? "" : "1"}">${f(s.eyebrow)}</div>
${d.effects.clock ? '<div class="clock" data-clock>--:--</div>' : ""}
<h1 data-greet-title>${f(s.day.title)}</h1>
<p data-greet-text>${f(s.day.text)}</p>
${s.note.trim() ? `<p class="muted">${f(s.note)}</p>` : ""}
${next(s.button)}`;
      break;
    case "text":
      body = `${eyebrow(s.eyebrow)}<h2>${f(s.title)}</h2>${paras(s.paragraphs)}${s.muted.trim() ? `<p class="muted">${f(s.muted)}</p>` : ""}${next(s.button)}`;
      break;
    case "quiz":
      body = `${eyebrow(s.eyebrow)}<h2>${f(s.title)}</h2>${s.text.trim() ? `<p>${f(s.text)}</p>` : ""}
<div class="choice">${s.options
        .map((o) => `<button type="button" class="answer${o.correct ? "" : " ghost"}" data-reply="${esc(fmt(o.reply, n))}">${f(o.label)}</button>`)
        .join("")}</div>
<p class="muted hidden" data-reply-text></p>${next(s.button, 'class="hidden" data-after')}`;
      break;
    case "list":
      body = `${eyebrow(s.eyebrow)}<h2>${f(s.title)}</h2>
<div class="revealbox">${s.items
        .map((it, k) => `<div><small>${String(k + 1).padStart(2, "0")}</small>${f(it)}</div>`)
        .join("")}${s.highlight.trim() ? `<div class="personal"><small>${f(s.highlightLabel)}</small><strong>${f(s.highlight)}</strong></div>` : ""}</div>
${next(s.button, 'class="hidden" data-after')}`;
      break;
    case "check":
      body = `${eyebrow(s.eyebrow)}<div class="bigcheck">✓</div><h2>${f(s.title)}</h2>${s.text.trim() ? `<p>${f(s.text)}</p>` : ""}
${s.status.trim() ? `<div class="seal"><span class="dot"></span> ${f(s.status)}</div>` : ""}
${s.tiny.trim() ? `<p class="tiny">${f(s.tiny)}</p>` : ""}
<button type="button" class="finish">${f(s.button)}</button>`;
      break;
    case "gift":
      body = `${eyebrow(s.eyebrow)}<h2>${f(s.title)}</h2>
<div class="gift-wrap" role="button" tabindex="0" aria-label="Geschenk auspacken"><div class="gift-lid"><span class="gift-bow"></span></div><div class="gift-box"></div></div>
<p class="muted gift-teaser">${f(s.teaser)}</p>
<div class="gift-reveal hidden"><div class="gift-name">${f(s.gift)}</div>${s.detail.trim() ? `<p>${f(s.detail)}</p>` : ""}</div>
${next(s.button, 'class="hidden" data-after')}`;
      break;
    case "finale": {
      const r = d.reactions;
      const reactions = r && r.enabled && r.options.length
        ? `<div class="reactions" data-reactions><p class="react-q">${f(r.question)}</p><div class="react-row">${r.options
            .map((o) => `<button type="button" class="react ghost" data-emoji="${esc(o.emoji)}" data-label="${esc(o.label)}"><span class="re">${esc(o.emoji)}</span><span class="rl">${esc(o.label)}</span></button>`)
            .join("")}</div><div class="react-done hidden"><div class="react-big"></div><p class="react-thanks"></p><div class="react-more hidden"><input class="react-msg" maxlength="200" placeholder="Noch ein paar Worte? (optional)"><button type="button" class="react-msg-send">Senden</button></div><button type="button" class="react-send hidden">📨 Antwort zurückschicken</button></div></div>`
        : "";
      body = `${eyebrow(s.eyebrow)}<h2>${f(s.title)}</h2>${s.quote.trim() ? `<div class="quote">„${f(s.quote)}“</div>` : ""}${paras(s.paragraphs)}
${s.signature.trim() ? `<div class="signature">${f(s.signature)}</div>` : ""}
${s.status.trim() ? `<div class="seal"><span class="dot"></span> ${f(s.status)}</div>` : ""}
${s.tiny.trim() ? `<p class="tiny">${f(s.tiny)}</p>` : ""}
${d.effects.cinema ? `<button type="button" class="cinema-start" style="margin-top:22px">${f(s.cinemaButton)}</button>` : ""}
${reactions}
${step < d.scenes.length ? next("Weiter →") : ""}`;
      break;
    }
  }
  return `<section class="screen${step === 1 ? " active" : ""}" data-step="${step}" data-type="${s.type}" id="seite${step}"><div class="card">${body}</div></section>`;
}

const CLIENT_JS = `(function(){'use strict';
document.documentElement.classList.remove('nojs');
var CFG=JSON.parse(document.getElementById('cfg').textContent);
var FX=CFG.effects,PAL=CFG.palette,SPD=FX.speed||1;
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
var screens=[].slice.call(document.querySelectorAll('.screen')),total=screens.length,step=1;
var bar=document.getElementById('bar'),lab=document.getElementById('stepLabel');
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function pad(n){return String(n).padStart(2,'0')}
function updateProgress(){if(bar)bar.style.width=(total>1?(step-1)/(total-1)*100:100)+'%';if(lab)lab.textContent=pad(step)+' / '+pad(total)}
function go(n,quiet){
 var next=Math.max(1,Math.min(total,n));var target=screens[next-1];if(!target)return;
 var old=document.querySelector('.screen.active');step=next;target.classList.add('active');if(old&&old!==target)old.classList.remove('active');
 updateProgress();var card=target.querySelector('.card');
 if(card){card.style.opacity='1';card.classList.remove('celebrate');void card.offsetWidth;card.classList.add('celebrate')}
 try{window.scrollTo(0,0)}catch(e){}
 var type=target.getAttribute('data-type');
 if(type==='list')revealList(target);
 if(quiet)return;
 try{if(step===total)burst();else if(type==='text'&&step>2)sparkBurst();else if(step%2===0)miniBurst()}catch(e){}
}
document.querySelectorAll('[data-next]').forEach(function(b){b.addEventListener('click',function(){go(step+1)})});
document.querySelectorAll('.finish').forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){go(step+1)},reduced?0:450)})});
screens.forEach(function(sc){
 var answers=[].slice.call(sc.querySelectorAll('.answer'));if(!answers.length)return;
 var out=sc.querySelector('[data-reply-text]'),after=sc.querySelector('[data-after]');
 answers.forEach(function(b){b.addEventListener('click',function(){answers.forEach(function(x){x.disabled=true});out.innerHTML=b.getAttribute('data-reply');out.classList.remove('hidden');if(after)after.classList.remove('hidden');if(b.className.indexOf('ghost')<0)miniBurst()})});
});
function revealList(sc){var els=[].slice.call(sc.querySelectorAll('.revealbox div')),btn=sc.querySelector('[data-after]'),gap=430/SPD;
 els.forEach(function(e){e.classList.remove('in')});
 els.forEach(function(e,i){setTimeout(function(){e.classList.add('in')},reduced?0:350+i*gap)});
 if(btn)setTimeout(function(){btn.classList.remove('hidden')},reduced?0:350+els.length*gap)}
function time(){var d=new Date(),h=d.getHours();
 document.querySelectorAll('[data-clock]').forEach(function(c){c.textContent=d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})});
 document.querySelectorAll('[data-date="1"]').forEach(function(e){e.textContent=d.toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})});
 var g=CFG.greet;if(!g)return;var part=h<11?g.morning:h<17?g.day:g.evening;
 document.querySelectorAll('[data-greet-title]').forEach(function(e){e.innerHTML=part.title});
 document.querySelectorAll('[data-greet-text]').forEach(function(e){e.innerHTML=part.text})}
time();setInterval(time,15000);updateProgress();
if(FX.orbit)document.querySelectorAll('.card').forEach(function(card){var o=document.createElement('div');o.className='orbit';
 for(var j=0;j<10;j++){var q=document.createElement('i');q.style.left=(5+Math.random()*90)+'%';q.style.top=(8+Math.random()*84)+'%';q.style.setProperty('--dur',(2.4+Math.random()*4)/SPD+'s');q.style.setProperty('--dx',((Math.random()-.5)*50)+'px');q.style.setProperty('--dy',((Math.random()-.5)*50)+'px');q.style.animationDelay=(-Math.random()*4)+'s';o.appendChild(q)}
 card.prepend(o)});
var c=document.getElementById('ambient'),ctx=c.getContext('2d'),pts=[],DPR=window.devicePixelRatio||1,frame=0;
var BD=FX.backdrop||'dots',SH=FX.confettiShape||'strip',GLYPHS='01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789';
function glyph(){return GLYPHS.charAt(Math.floor(Math.random()*GLYPHS.length))}
function size(){c.width=innerWidth*DPR;c.height=innerHeight*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
function init(){pts=[];
 if(BD==='matrix'){var cols=Math.ceil(innerWidth/16);for(var k=0;k<cols;k++)if(Math.random()<Math.min(1,.45*FX.ambient+.25))pts.push({x:k*16,y:-Math.random()*innerHeight*1.5,v:16*(.5+Math.random()*.7)});return}
 var n=Math.round(Math.min(BD==='blocks'?26:80,Math.floor(innerWidth/(BD==='blocks'?30:9)))*FX.ambient);
 for(var i=0;i<n;i++)pts.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,s:.4+Math.random()*1.25,v:(.04+Math.random()*.14)*SPD,a:.1+Math.random()*.3,t:Math.random()*6.28,r:Math.random()*6.28,vr:(Math.random()-.5)*.01,z:8+Math.random()*18,c:rnd(PAL)})}
function star(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.fill()}
function ambient(){frame++;
 if(BD==='matrix'){if(frame%Math.max(1,Math.round(3/SPD))===0){ctx.globalAlpha=1;ctx.fillStyle=CFG.trail;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.font='15px ui-monospace,Menlo,Consolas,monospace';
  for(var m=0;m<pts.length;m++){var q=pts[m];ctx.fillStyle=Math.random()<.04?'#ffffff':CFG.particle;ctx.globalAlpha=.9;ctx.fillText(glyph(),q.x,q.y);q.y+=q.v;if(q.y>innerHeight+20&&Math.random()>.97)q.y=-20}}
  ctx.globalAlpha=1;requestAnimationFrame(ambient);return}
 ctx.clearRect(0,0,innerWidth,innerHeight);
 for(var i=0;i<pts.length;i++){var p=pts[i];p.y-=p.v*(BD==='blocks'?4:1);p.t+=.03*SPD;if(p.y<-30)p.y=innerHeight+30;
  if(BD==='blocks'){p.r+=p.vr*SPD;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=.32;ctx.fillStyle=p.c;ctx.fillRect(-p.z/2,-p.z/2,p.z,p.z);ctx.globalAlpha=.25;ctx.strokeStyle='#17171c';ctx.lineWidth=2;ctx.strokeRect(-p.z/2,-p.z/2,p.z,p.z);ctx.restore();continue}
  if(BD==='sparkle'){ctx.globalAlpha=Math.max(0,p.a*1.8*(.35+.65*Math.sin(p.t)));ctx.fillStyle=CFG.light;star(p.x,p.y,p.s*3.2);continue}
  ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,7);ctx.globalAlpha=p.a;ctx.fillStyle=CFG.particle;ctx.fill()}
 ctx.globalAlpha=1;requestAnimationFrame(ambient)}
size();init();if(!reduced&&FX.ambient>0)ambient();addEventListener('resize',function(){size();init()},{passive:true});
var cc=document.getElementById('confetti'),cx=cc.getContext('2d'),bits=[],cr;
function cs(){cc.width=innerWidth*DPR;cc.height=innerHeight*DPR;cx.setTransform(DPR,0,0,DPR,0,0)}cs();addEventListener('resize',cs,{passive:true});
function sparkBurst(){if(reduced||!FX.sparks)return;var x0=innerWidth/2,y0=Math.min(innerHeight*.42,340);
 for(var i=0;i<28;i++){var s=document.createElement('i');s.className='spark';s.style.left=x0+'px';s.style.top=y0+'px';var a=Math.random()*Math.PI*2,d=55+Math.random()*150;s.style.setProperty('--sx',Math.cos(a)*d+'px');s.style.setProperty('--sy',Math.sin(a)*d+'px');s.style.background=rnd(PAL);s.style.animationDelay=(Math.random()*.15)+'s';document.body.appendChild(s);(function(el){setTimeout(function(){el.remove()},1200)})(s)}}
function ribbonRain(amount,duration){amount=Math.round(amount*FX.ribbons);if(reduced||amount<1)return;
 for(var i=0;i<amount;i++)setTimeout(function(){var r=document.createElement('i');r.className='ribbon';r.style.left=(Math.random()*100)+'vw';r.style.background='linear-gradient(180deg,'+CFG.light+','+rnd(PAL)+','+CFG.light+')';r.style.animationDuration=(2.8+Math.random()*2.4)/SPD+'s';r.style.setProperty('--drift',((Math.random()-.5)*180)+'px');r.style.setProperty('--rot',(500+Math.random()*900)+'deg');r.style.width=(4+Math.random()*6)+'px';r.style.height=(20+Math.random()*32)+'px';document.body.appendChild(r);setTimeout(function(){r.remove()},6000)},Math.random()*duration)}
function makeBits(n,y,spread,power){var out=[];n=Math.round(n*FX.confetti);for(var i=0;i<n;i++)out.push({x:innerWidth/2+(Math.random()-.5)*spread,y:innerHeight*y,vx:(Math.random()-.5)*power,vy:-1-Math.random()*power*.8,g:.10+Math.random()*.07,s:2+Math.random()*5,a:1,c:rnd(PAL),r:Math.random()*6.28,vr:(Math.random()-.5)*.3,ch:glyph()});return out}
function miniBurst(){if(reduced||FX.confetti<=0)return;bits=makeBits(48,.18,100,5);cancelAnimationFrame(cr);conf()}
function burst(){if(reduced)return;ribbonRain(58,3600);sparkBurst();if(FX.confetti<=0)return;bits=makeBits(180,.34,140,7);cancelAnimationFrame(cr);conf()}
function conf(){cx.clearRect(0,0,innerWidth,innerHeight);bits=bits.filter(function(b){return b.a>.02&&b.y<innerHeight+30});bits.forEach(function(b){b.x+=b.vx;b.y+=b.vy;b.vy+=b.g;b.a*=.988;b.r+=b.vr;cx.globalAlpha=b.a;cx.fillStyle=b.c;
 if(SH==='strip')cx.fillRect(b.x,b.y,b.s,b.s*1.8);
 else if(SH==='square'){cx.save();cx.translate(b.x,b.y);cx.rotate(b.r);cx.fillRect(-b.s*.7,-b.s*.7,b.s*1.4,b.s*1.4);cx.restore()}
 else{cx.font=Math.round(b.s*3.4)+'px '+(SH==='glyph'?'ui-monospace,Menlo,monospace':'sans-serif');cx.fillText(SH==='heart'?'♥':SH==='star'?'★':b.ch,b.x,b.y)}});cx.globalAlpha=1;if(bits.length)cr=requestAnimationFrame(conf)}
var cinema=document.getElementById('cinema');
if(cinema){var cv=document.getElementById('cinemaCanvas'),cctx=cv.getContext('2d'),stars=[],craf=null,ctimer=null,CIN=13500/SPD;
 cinema.style.setProperty('--cin',CIN+'ms');
 function cinemaSize(){cv.width=innerWidth*DPR;cv.height=innerHeight*DPR;cctx.setTransform(DPR,0,0,DPR,0,0)}
 function cinemaStars(){stars=[];for(var i=0;i<110;i++)stars.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.5+Math.random()*2,a:.15+Math.random()*.75,v:(.08+Math.random()*.35)*SPD,t:Math.random()*6.28})}
 function cinemaDraw(){cctx.clearRect(0,0,innerWidth,innerHeight);stars.forEach(function(s){s.t+=.025;s.y-=s.v;if(s.y<-5)s.y=innerHeight+5;cctx.globalAlpha=Math.max(.05,s.a*(.55+.45*Math.sin(s.t)));cctx.fillStyle=CFG.star;if(BD==='matrix'){cctx.font=Math.round(8+s.r*5)+'px ui-monospace,monospace';cctx.fillText(glyph(),s.x,s.y)}else{cctx.beginPath();cctx.arc(s.x,s.y,s.r,0,7);cctx.fill()}});cctx.globalAlpha=1;craf=requestAnimationFrame(cinemaDraw)}
 function startCinema(){cinema.classList.remove('hidden','done','play');cinema.setAttribute('aria-hidden','false');cinemaSize();cinemaStars();
  if(!reduced){cancelAnimationFrame(craf);cinemaDraw();requestAnimationFrame(function(){cinema.classList.add('play')});setTimeout(function(){ribbonRain(85,5200);sparkBurst()},CIN*.55);ctimer=setTimeout(function(){cinema.classList.add('done')},CIN)}else cinema.classList.add('done')}
 function closeCinema(){clearTimeout(ctimer);cancelAnimationFrame(craf);cinema.classList.add('hidden');cinema.classList.remove('play','done');cinema.setAttribute('aria-hidden','true')}
 document.querySelectorAll('.cinema-start').forEach(function(b){b.addEventListener('click',startCinema)});
 document.getElementById('cinemaClose').addEventListener('click',closeCinema);
 addEventListener('resize',function(){if(!cinema.classList.contains('hidden')){cinemaSize();cinemaStars()}},{passive:true})}
function openGift(w){if(w.classList.contains('open'))return;var sc=w.closest('.screen');w.classList.add('open');var tz=sc.querySelector('.gift-teaser');if(tz)tz.classList.add('hidden');
 setTimeout(function(){sc.querySelector('.gift-reveal').classList.remove('hidden');var a=sc.querySelector('[data-after]');if(a)a.classList.remove('hidden');burst()},reduced?0:650)}
document.querySelectorAll('.gift-wrap').forEach(function(w){w.addEventListener('click',function(){openGift(w)});w.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openGift(w)}})});
function floatEmoji(em){if(reduced)return;for(var i=0;i<14;i++)(function(i){setTimeout(function(){var s=document.createElement('span');s.className='float-emoji';s.textContent=em;s.style.left=(10+Math.random()*80)+'vw';s.style.fontSize=(1.4+Math.random()*1.8)+'rem';s.style.setProperty('--fx',((Math.random()-.5)*120)+'px');s.style.setProperty('--fr',((Math.random()-.5)*80)+'deg');document.body.appendChild(s);setTimeout(function(){s.remove()},2600)},i*90)})(i)}
document.querySelectorAll('[data-reactions]').forEach(function(box){var sent=null;
 box.querySelectorAll('.react').forEach(function(b){b.addEventListener('click',function(){
  var em=b.getAttribute('data-emoji'),lb=b.getAttribute('data-label');
  box.querySelectorAll('.react').forEach(function(x){x.classList.toggle('picked',x===b)});
  var done=box.querySelector('.react-done'),th=box.querySelector('.react-thanks'),more=box.querySelector('.react-more'),send=box.querySelector('.react-send');
  done.classList.remove('hidden');box.querySelector('.react-big').textContent=em;floatEmoji(em);
  if(CFG.preview){th.textContent='Vorschau: So reagiert die Person – du bekommst die Reaktion dann.';return}
  if(CFG.reactUrl){th.textContent='Wird gesendet …';
   fetch(CFG.reactUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({emoji:em,label:lb,id:sent})}).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){sent=j.id;th.textContent='Deine Reaktion ist angekommen 💌';more.classList.remove('hidden')}).catch(function(){th.textContent='Hat gerade nicht geklappt – bitte nochmal tippen.'});return}
  th.textContent='Schick deine Reaktion zurück:';send.classList.remove('hidden');
  send.onclick=function(){var text=em+' '+lb+'! – Danke für die Überraschung 💌';
   if(navigator.share){navigator.share({text:text}).catch(function(){})}else{window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank')}}})});
 var ms=box.querySelector('.react-msg-send');if(ms)ms.addEventListener('click',function(){var inp=box.querySelector('.react-msg'),th=box.querySelector('.react-thanks');if(!sent||!inp.value.trim())return;
  fetch(CFG.reactUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:sent,message:inp.value.trim()})}).then(function(r){if(!r.ok)throw 0;th.textContent='Danke für deine Worte! 💌';box.querySelector('.react-more').classList.add('hidden')}).catch(function(){th.textContent='Nachricht konnte nicht gesendet werden.'})})});
if(CFG.start>1){go(CFG.start,true)}else if(!reduced){setTimeout(function(){miniBurst();ribbonRain(22,2200)},450)}
})();`;

export function renderCardHTML(d: CardData, opts: RenderOptions = {}): string {
  const n = d.recipientName;
  const greeting = d.scenes.find((s) => s.type === "greeting");
  const t = d.theme;
  const cfg = {
    reactUrl: opts.reactUrl ?? null,
    preview: !!opts.preview,
    effects: d.effects,
    palette: t.confetti.length ? t.confetti : [t.accent],
    particle: t.accent,
    light: t.accentLight,
    trail: rgba(t.bg, 0.14),
    star: mix(t.accentLight, "#ffffff", 0.2),
    start: Math.max(1, Math.min(d.scenes.length, opts.startScene ?? 1)),
    greet: greeting && greeting.type === "greeting"
      ? {
          morning: { title: fmt(greeting.morning.title, n), text: fmt(greeting.morning.text, n) },
          day: { title: fmt(greeting.day.title, n), text: fmt(greeting.day.text, n) },
          evening: { title: fmt(greeting.evening.title, n), text: fmt(greeting.evening.text, n) },
        }
      : null,
  };
  const json = JSON.stringify(cfg).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (ch) => (ch === "\u2028" ? "\\u2028" : "\\u2029"));
  const title = `${occasionLabel(d.occasion)}${n.trim() ? ` · ${plain(n, n)}` : ""}`;
  const c = d.cinema;
  const classes = [d.effects.shine && (t.style ?? "glass") !== "pixel" ? "shine" : "", `st-${t.style ?? "glass"}`, `bd-${d.effects.backdrop ?? "dots"}`]
    .filter(Boolean)
    .join(" ");

  return `<!doctype html>
<html lang="de" class="nojs">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="${t.dark ? "dark" : "light"}">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}</title>
<style>${css(d)}</style>
</head>
<body class="${classes}">
<canvas class="fx" id="ambient" aria-hidden="true"></canvas><canvas class="fx" id="confetti" aria-hidden="true"></canvas>
<main class="app">
${d.effects.progress ? `<div class="top"><span>${fmt(d.topLine, n)}</span><span id="stepLabel"></span></div>
<div class="progress"><div class="bar" id="bar"></div></div>` : `<div class="top"><span>${fmt(d.topLine, n)}</span><span></span></div>`}
${d.scenes.map((s, i) => renderScene(s, i, d)).join("\n")}
</main>
${d.effects.cinema ? `<div id="cinema" class="cinema hidden" aria-hidden="true">
 <canvas id="cinemaCanvas" aria-hidden="true"></canvas><div class="cinema-vignette"></div>
 <div class="cinema-scene scene1"><div class="cinema-small">${fmt(c.kicker, n)}</div></div>
 <div class="cinema-scene scene2"><div class="cinema-small">${fmt(c.forLabel, n)}</div><div class="cinema-name">${esc(n)}</div></div>
 <div class="cinema-scene scene3"><div class="cinema-title">${fmt(c.title, n)}</div></div>
 <div class="cinema-scene scene4"><div class="cinema-final">${fmt(c.final, n)}</div><div class="cinema-emoji">${esc(c.emoji)}</div></div>
 <button id="cinemaClose" class="cinema-close" type="button">Zurück zur Nachricht</button>
</div>` : ""}
${opts.exportFile && d.iosHint ? `<div class="ioshint">iPhone: Falls die Mail-Vorschau Animationen blockiert, die Datei über „Teilen“ → „In Dateien sichern“ und von dort im Browser öffnen.</div>` : ""}
<script type="application/json" id="cfg">${json}</script>
<script>${CLIENT_JS}</script>
</body></html>`;
}
