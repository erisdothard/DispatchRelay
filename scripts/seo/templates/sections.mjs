/**
 * Section renderers. A content record is a list of `{ type, ... }` blocks and
 * each type maps to one function here, so authoring a new page never means
 * writing HTML by hand.
 */
import { esc, each, prose } from '../lib/html.mjs';

const renderers = {
  hero: ({ eyebrow, heading, lede, actions }) => `
    <header class="hero">
      <div class="wrap">
        ${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}
        <h1>${esc(heading)}</h1>
        <p class="lede">${prose(lede)}</p>
        ${
          actions?.length
            ? `<div class="hero-actions">${each(
                actions,
                (a) =>
                  `<a class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'}" href="${esc(a.href)}">${esc(a.label)}</a>`,
              )}</div>`
            : ''
        }
      </div>
    </header>`,

  prose: ({ id, heading, body }) => `
    <section${id ? ` id="${esc(id)}"` : ''}>
      <div class="wrap">
        ${heading ? `<h2>${esc(heading)}</h2>` : ''}
        ${each(body, (p) => `<p>${prose(p)}</p>`)}
      </div>
    </section>`,

  cards: ({ id, heading, intro, cards }) => `
    <section${id ? ` id="${esc(id)}"` : ''}>
      <div class="wrap">
        ${heading ? `<h2>${esc(heading)}</h2>` : ''}
        ${intro ? `<p>${prose(intro)}</p>` : ''}
        <div class="grid">
          ${each(
            cards,
            (c) => `
          <article class="card">
            <h3>${esc(c.title)}</h3>
            <p>${prose(c.body)}</p>
            ${c.href ? `<p><a href="${esc(c.href)}">${esc(c.linkLabel ?? 'Learn more')} →</a></p>` : ''}
          </article>`,
          )}
        </div>
      </div>
    </section>`,

  steps: ({ id, heading, steps }) => `
    <section${id ? ` id="${esc(id)}"` : ''}>
      <div class="wrap">
        <h2>${esc(heading)}</h2>
        <ol class="steps">
          ${each(steps, (s) => `<li><strong>${esc(s.title)}</strong>${prose(s.body)}</li>`)}
        </ol>
      </div>
    </section>`,

  tiers: ({ id, heading, notice, tiers }) => `
    <section${id ? ` id="${esc(id)}"` : ''}>
      <div class="wrap">
        <h2>${esc(heading)}</h2>
        ${notice ? `<div class="notice"><p>${prose(notice)}</p></div>` : ''}
        <div class="grid">
          ${each(
            tiers,
            (t) => `
          <article class="card tier">
            <h3>${esc(t.name)}</h3>
            <p class="price">${esc(t.price)}${t.unit ? ` <span>${esc(t.unit)}</span>` : ''}</p>
            <p>${prose(t.summary)}</p>
            <ul>${each(t.includes, (f) => `<li>${prose(f)}</li>`)}</ul>
          </article>`,
          )}
        </div>
      </div>
    </section>`,

  faq: ({ id, heading, faq }) => `
    <section${id ? ` id="${esc(id)}"` : ''}>
      <div class="wrap">
        <h2>${esc(heading ?? 'Common questions')}</h2>
        <div class="faq">
          ${each(
            faq,
            (f) => `
          <details>
            <summary>${esc(f.q)}</summary>
            <p>${prose(f.a)}</p>
          </details>`,
          )}
        </div>
      </div>
    </section>`,

  waitlist: ({ id, heading, body, note }) => `
    <section${id ? ` id="${esc(id)}"` : ''}>
      <div class="wrap">
        <div class="waitlist">
          <h2>${esc(heading)}</h2>
          <p>${prose(body)}</p>
          <form method="post" action="/api/waitlist" data-waitlist>
            <label class="sr-only" for="waitlist-email" hidden>Email address</label>
            <input
              id="waitlist-email"
              type="email"
              name="email"
              inputmode="email"
              autocomplete="email"
              required
              placeholder="you@company.com"
            />
            <button class="btn btn-primary" type="submit">Join the waitlist</button>
          </form>
          <p data-waitlist-status role="status" aria-live="polite"></p>
          ${note ? `<p class="form-note">${prose(note)}</p>` : ''}
        </div>
      </div>
    </section>`,
};

export function renderSections(sections) {
  return sections
    .map((section) => {
      const render = renderers[section.type];
      if (!render) throw new Error(`Unknown section type: ${section.type}`);
      return render(section);
    })
    .join('\n');
}

export const sectionTypes = Object.keys(renderers);
