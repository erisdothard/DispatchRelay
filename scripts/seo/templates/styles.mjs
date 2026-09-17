/**
 * The marketing stylesheet, inlined into every generated page. It is small
 * enough that a second request would cost more than it saves, and inlining
 * guarantees the page renders with no network round trip.
 */
export const styles = `
:root {
  --bg: #0d0d0d;
  --surface: #151412;
  --surface-2: #1c1b19;
  --border: #2a2825;
  --text: #f5f3f0;
  --text-muted: #a8a29a;
  --text-dim: #7a746c;
  --accent: #e86030;
  --accent-soft: rgba(232, 96, 48, 0.14);
  --radius: 14px;
  --maxw: 1060px;
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 17px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-family: Outfit, Inter, system-ui, sans-serif; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 .5em; }
h1 { font-size: clamp(2rem, 6vw, 3.4rem); font-weight: 700; }
h2 { font-size: clamp(1.5rem, 4vw, 2.1rem); font-weight: 700; }
h3 { font-size: 1.15rem; font-weight: 600; }
p { margin: 0 0 1.1em; color: var(--text-muted); }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; background: var(--surface-2); padding: .1em .38em; border-radius: 5px; color: var(--text); }
strong { color: var(--text); font-weight: 600; }
ul { padding-left: 1.15em; color: var(--text-muted); }
li { margin-bottom: .45em; }

.wrap { width: 100%; max-width: var(--maxw); margin: 0 auto; padding: 0 20px; }

/* ---- header ---- */
.site-header { border-bottom: 1px solid var(--border); position: sticky; top: 0; background: rgba(13,13,13,.86); backdrop-filter: blur(12px); z-index: 20; }
.site-header .wrap { display: flex; align-items: center; gap: 16px; height: 64px; }
.site-header img { height: 26px; }
.site-nav { margin-left: auto; display: flex; align-items: center; gap: 22px; }
.site-nav a { color: var(--text-muted); font-size: 15px; font-weight: 500; }
.site-nav a:hover { color: var(--text); text-decoration: none; }
/* The header CTA is a button first and a nav link second. */
.site-nav a.btn-primary, .site-nav a.btn-primary:hover { color: #fff; }
@media (max-width: 640px) {
  .site-header .wrap { gap: 10px; padding: 0 16px; }
  .site-header img { height: 22px; }
  .site-nav { gap: 12px; min-width: 0; }
  .site-nav a.nav-secondary { display: none; }
}

/* ---- buttons ---- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: .5em; font-weight: 600; font-size: 16px; padding: 13px 22px; border-radius: 999px; border: 1px solid transparent; cursor: pointer; text-decoration: none; }
.btn:hover { text-decoration: none; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-ghost { border-color: var(--border); color: var(--text); background: transparent; }
.btn-ghost:hover { border-color: var(--text-dim); }

/* ---- layout blocks ---- */
section { padding: 62px 0; border-top: 1px solid var(--border); }
section:first-of-type { border-top: 0; }
.hero { padding: 84px 0 68px; }
.hero p.lede { font-size: clamp(1.05rem, 2.4vw, 1.3rem); max-width: 40ch; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }

.eyebrow { display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); background: var(--accent-soft); padding: 6px 13px; border-radius: 999px; margin-bottom: 20px; }

.grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 26px; }
.card h3 { margin-bottom: .4em; }
.card p:last-child { margin-bottom: 0; }

.steps { counter-reset: step; list-style: none; padding: 0; display: grid; gap: 16px; }
.steps li { counter-increment: step; position: relative; padding-left: 52px; margin: 0; }
.steps li::before { content: counter(step); position: absolute; left: 0; top: -2px; width: 34px; height: 34px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 700; display: flex; align-items: center; justify-content: center; }
.steps strong { display: block; }

/* ---- pricing ---- */
.notice { background: var(--accent-soft); border: 1px solid rgba(232,96,48,.35); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 30px; }
.notice p { color: var(--text); margin: 0; font-size: 15px; }
.tier .price { font-family: Outfit, sans-serif; font-size: 2.3rem; font-weight: 700; color: var(--text); line-height: 1; }
.tier .price span { font-size: 1rem; font-weight: 500; color: var(--text-dim); }
.tier ul { margin: 18px 0 0; }

/* ---- faq ---- */
.faq { display: grid; gap: 14px; }
.faq details { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 22px; }
.faq summary { cursor: pointer; font-weight: 600; color: var(--text); font-family: Outfit, sans-serif; }
.faq details[open] summary { margin-bottom: .7em; }
.faq p:last-child { margin-bottom: 0; }

/* ---- waitlist ---- */
.waitlist { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 30px; }
.waitlist form { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.waitlist input { flex: 1 1 240px; min-width: 0; background: var(--surface-2); border: 1px solid var(--border); border-radius: 999px; padding: 13px 20px; color: var(--text); font: inherit; font-size: 16px; }
.waitlist input::placeholder { color: var(--text-dim); }
.waitlist input:focus { outline: 2px solid rgba(232,96,48,.45); outline-offset: 1px; border-color: transparent; }
.waitlist .form-note { font-size: 14px; color: var(--text-dim); margin: 14px 0 0; }
.waitlist [data-waitlist-status] { margin: 14px 0 0; font-size: 15px; }
.waitlist [data-waitlist-status]:empty { display: none; }
.waitlist [data-waitlist-status][data-state='error'] { color: #ff8b6b; }
.waitlist [data-waitlist-status][data-state='ok'] { color: #6bd49a; }

/* ---- footer ---- */
.site-footer { border-top: 1px solid var(--border); padding: 38px 0 60px; color: var(--text-dim); font-size: 14px; }
.site-footer nav { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 16px; }
.site-footer a { color: var(--text-muted); }
`;
