/**
 * Every generated marketing page, as data.
 *
 * Copy rule: describe only what the demo actually does. No customer counts,
 * no savings percentages, no testimonials — none of those exist yet, and an
 * unsupported claim on a page that AI assistants quote is worse than no page.
 */
import { site, productStatus } from './site.mjs';
import { softwareApplication } from '../lib/jsonld.mjs';

const home = {
  path: '/',
  navLabel: 'Home',
  title: 'DispatchRelay — Dispatch software for carriers and brokers',
  description:
    'Post loads, negotiate rates, dispatch drivers and track freight in one app. Try the live demo — no signup, no card. Early access waitlist open.',
  jsonld: [softwareApplication()],
  sections: [
    {
      type: 'hero',
      eyebrow: 'Early access',
      heading: 'Run dispatch without ten open tabs',
      lede: 'DispatchRelay puts the load board, rate negotiation, driver dispatch and live tracking in one place — built for carriers and brokers small enough that the dispatcher is also the owner.',
      actions: [
        { label: 'Try the live demo', href: '/demo', primary: true },
        { label: 'Join the waitlist', href: '#waitlist' },
      ],
    },
    {
      type: 'prose',
      id: 'what',
      heading: 'What it is',
      body: [
        productStatus.long,
        'The demo has four roles you can switch between — carrier, broker, shipper and driver — each loaded with sample freight so you can see the same load move through every side of the deal.',
      ],
    },
    {
      type: 'cards',
      id: 'roles',
      heading: 'Who it’s for',
      intro: 'One system, four seats. Each role sees the same freight from its own side.',
      cards: [
        {
          title: 'Carriers',
          body: 'Find loads, bid and counter, assign a truck and driver, and watch the run without calling for updates.',
          href: '/for/carriers',
          linkLabel: 'For carriers',
        },
        {
          title: 'Brokers',
          body: 'Post freight, compare bids side by side, check a carrier’s authority, and cover a load without a spreadsheet.',
          href: '/for/brokers',
          linkLabel: 'For brokers',
        },
        {
          title: 'Shippers',
          body: 'Put freight in front of vetted carriers, see where it is, and get proof of delivery without chasing anyone.',
          href: '/for/shippers',
          linkLabel: 'For shippers',
        },
        {
          title: 'Drivers',
          body: 'Today’s run on a phone: pickup and delivery details, document capture, hours logging and expense receipts.',
        },
      ],
    },
    {
      type: 'steps',
      id: 'how',
      heading: 'How a load moves through it',
      steps: [
        { title: 'Freight gets posted', body: 'A broker or shipper posts a load with lane, equipment, weight and dates.' },
        { title: 'Carriers bid', body: 'Carriers see matching loads, bid, and negotiate counters in the app rather than over voicemail.' },
        { title: 'It gets dispatched', body: 'The winning carrier assigns a truck and driver, who picks the run up on a phone.' },
        { title: 'Everyone watches the same screen', body: 'GPS position, status changes, documents and messages land in one timeline for all sides.' },
        { title: 'Delivery closes the loop', body: 'A signed bill of lading becomes a PDF on the load, and the invoice follows from it.' },
      ],
    },
    {
      type: 'cards',
      id: 'features',
      heading: 'What’s in the demo today',
      cards: [
        { title: 'Load board with matching', body: 'Loads scored against your equipment and lanes, plus plain-English search.' },
        { title: 'Bidding and counters', body: 'Offers, counter-offers and accept/decline, with the history kept on the load.' },
        { title: 'Dispatch and assignment', body: 'Assign trucks and drivers, with permission rules for who on the team can dispatch.' },
        { title: 'Live tracking', body: 'Driver GPS on a map, a public tracking link, and status changes as they happen.' },
        { title: 'Documents and BOL', body: 'Capture documents from a phone, sign the bill of lading, and get a PDF on the load.' },
        { title: 'Carrier verification', body: 'FMCSA lookups so a broker can check authority and insurance before covering a load.' },
      ],
    },
    {
      type: 'waitlist',
      id: 'waitlist',
      heading: 'Get early access',
      body: 'Accounts are not open yet. Leave an email and you’ll hear from us when they are — no newsletter, no drip sequence.',
      note: 'One email when access opens. Nothing else.',
    },
    {
      type: 'faq',
      faq: [
        {
          q: 'Can I use DispatchRelay today?',
          a: 'You can use the demo today with no signup and no card. Real accounts are not open yet — the waitlist is how you get in when they are.',
        },
        {
          q: 'Is the demo real software or a video?',
          a: 'It is the real application running against an in-memory dataset. Bidding, dispatch, tracking and document flows all work; the data resets rather than persisting.',
        },
        {
          q: 'What does it cost?',
          a: 'Pricing is not final. The pricing page shows the shape of the plans and is clearly marked as placeholder until the numbers are set.',
        },
        {
          q: 'Who is it built for?',
          a: 'Small carriers and brokers — the ones where dispatch, sales and accounting are the same two or three people. It is not built to replace an enterprise TMS.',
        },
        {
          q: 'Does it work on a phone?',
          a: 'Yes. It is built mobile-first, which matters most for drivers, who use it in a truck rather than at a desk.',
        },
      ],
    },
  ],
};

const pricing = {
  path: '/pricing',
  navLabel: 'Pricing',
  breadcrumb: 'Pricing',
  title: 'Pricing — DispatchRelay',
  description:
    'DispatchRelay pricing. Plans for owner-operators, small fleets and brokers. Prices are not final — the live demo is free to try with no signup.',
  sections: [
    {
      type: 'hero',
      eyebrow: 'Not final',
      heading: 'Pricing',
      lede: 'The plan structure below is real. **The numbers are placeholders** and will change before accounts open.',
      actions: [
        { label: 'Try the live demo', href: '/demo', primary: true },
        { label: 'Join the waitlist', href: '#waitlist' },
      ],
    },
    {
      type: 'tiers',
      id: 'plans',
      heading: 'Planned tiers',
      notice:
        '**Placeholder pricing.** These figures are illustrative, not an offer. Nothing is charged today and no payment method is collected — the demo is open to anyone.',
      tiers: [
        {
          name: 'Owner-operator',
          price: '$—',
          unit: '/ month (TBD)',
          summary: 'One truck, one driver, one person doing all of it.',
          includes: ['Load board and matching', 'Bidding and counters', 'Live tracking', 'Documents and BOL signing'],
        },
        {
          name: 'Small fleet',
          price: '$—',
          unit: '/ month (TBD)',
          summary: 'A handful of trucks and a dispatcher who is not always the owner.',
          includes: [
            'Everything in Owner-operator',
            'Team seats and dispatch permissions',
            'Fleet and equipment records',
            'Driver hours and expense logging',
          ],
        },
        {
          name: 'Broker',
          price: '$—',
          unit: '/ month (TBD)',
          summary: 'Posting freight and covering it with carriers you trust.',
          includes: [
            'Post loads and compare bids',
            'FMCSA carrier verification',
            'Carrier relationships and history',
            'Rate confirmations and invoicing',
          ],
        },
      ],
    },
    {
      type: 'waitlist',
      id: 'waitlist',
      heading: 'Tell us what you’d pay',
      body: 'Pricing is genuinely open. Leave an email and we’ll ask you directly before the numbers are set.',
      note: 'One email when access opens. Nothing else.',
    },
    {
      type: 'faq',
      faq: [
        {
          q: 'Why are the prices blank?',
          a: 'Because they are not decided, and publishing a number we intend to change would be dishonest. The tier structure is real; the figures are placeholders.',
        },
        {
          q: 'Is there a free trial?',
          a: 'The demo is free and open right now with no signup and no card. Trial terms for real accounts have not been set.',
        },
        {
          q: 'Do I need a card to try it?',
          a: 'No. The demo collects nothing. The waitlist collects an email address and nothing else.',
        },
      ],
    },
  ],
};

/** Role pages share a shape, so they are generated from one description each. */
function rolePage({ slug, role, title, description, heading, lede, body, cards, faq }) {
  return {
    path: `/for/${slug}`,
    navLabel: role,
    breadcrumb: `For ${role.toLowerCase()}`,
    title,
    description,
    sections: [
      {
        type: 'hero',
        eyebrow: `For ${role.toLowerCase()}`,
        heading,
        lede,
        actions: [
          { label: 'Try the live demo', href: `${site.demoPath}`, primary: true },
          { label: 'Join the waitlist', href: '#waitlist' },
        ],
      },
      { type: 'prose', id: 'overview', heading: 'The problem', body },
      { type: 'cards', id: 'features', heading: 'What you get', cards },
      {
        type: 'waitlist',
        id: 'waitlist',
        heading: 'Get early access',
        body: 'Accounts are not open yet. Leave an email and you’ll hear when they are.',
        note: 'One email when access opens. Nothing else.',
      },
      { type: 'faq', faq },
    ],
  };
}

const carriers = rolePage({
  slug: 'carriers',
  role: 'Carriers',
  title: 'DispatchRelay for carriers — find loads, bid, dispatch, track',
  description:
    'Dispatch software for small carriers and owner-operators: matched loads, bidding and counters, driver assignment, live GPS and BOL signing. Free demo, no signup.',
  heading: 'Find it, bid it, dispatch it, get paid',
  lede: 'Built for the carrier where the dispatcher is also the owner — and sometimes also the driver.',
  body: [
    'Running a small fleet means a load board in one tab, a rate negotiation in voicemail, a driver on speakerphone, and the paperwork in a photo somewhere on your phone. Nothing knows about anything else, so you are the integration layer.',
    'DispatchRelay keeps one record per load, from the first bid to the signed bill of lading, and lets the driver update it from the cab instead of calling it in.',
  ],
  cards: [
    { title: 'Loads matched to your trucks', body: 'Scored against your equipment and preferred lanes, so the board is not just a firehose.' },
    { title: 'Negotiate in the app', body: 'Bid, see counters, accept or decline — with the whole exchange kept on the load.' },
    { title: 'Assign and dispatch', body: 'Put a truck and driver on a load, with rules for who on your team is allowed to.' },
    { title: 'Know where the truck is', body: 'Driver GPS on a map plus a tracking link you can hand to the broker instead of answering the phone.' },
    { title: 'Paperwork from the cab', body: 'Drivers capture documents and sign the BOL on a phone; the PDF lands on the load.' },
    { title: 'Hours and expenses', body: 'Hours-of-service logging and receipt capture, so the numbers are not reconstructed at month end.' },
  ],
  faq: [
    { q: 'Do my drivers need their own logins?', a: 'Yes, drivers get their own role with a phone-first view limited to their assigned runs.' },
    { q: 'Does it replace my ELD?', a: 'No. Hours logging in the app is a record-keeping aid, not a certified ELD, and it does not replace one.' },
    { q: 'Can I try it with my own loads?', a: 'Not yet — the demo runs on sample freight. Real accounts open to the waitlist first.' },
  ],
});

const brokers = rolePage({
  slug: 'brokers',
  role: 'Brokers',
  title: 'DispatchRelay for brokers — post freight, compare bids',
  description:
    'Freight broker software: post loads, compare carrier bids side by side, run FMCSA authority checks, and track covered freight. Free demo, no signup.',
  heading: 'Cover the load without the spreadsheet',
  lede: 'Post freight, see every bid in one place, and check who you are about to hand it to.',
  body: [
    'Covering a load usually means posting to a board, fielding calls, keeping bids in a spreadsheet, and checking authority in a separate window — then repeating all of it when the first carrier falls through.',
    'DispatchRelay keeps the posting, the bids, the verification and the tracking on one record, so the state of a load is something you look at rather than reconstruct.',
  ],
  cards: [
    { title: 'Post once', body: 'Lane, equipment, weight, dates and rate — posted to carriers on the network.' },
    { title: 'Bids side by side', body: 'Every offer on one screen with counters, instead of a call log and a spreadsheet.' },
    { title: 'Check authority first', body: 'FMCSA lookups on the carrier before you commit the freight.' },
    { title: 'Carrier relationships', body: 'Who you have worked with, on which lanes, and how it went.' },
    { title: 'Track without calling', body: 'Live position and status on covered loads, plus a link you can forward to your shipper.' },
    { title: 'Rate confirmations', body: 'Generate the rate con from the accepted bid rather than retyping it.' },
  ],
  faq: [
    { q: 'Where does carrier data come from?', a: 'Authority and safety lookups come from the FMCSA public API. It is a live lookup, not a cached copy.' },
    { q: 'Can I invite carriers I already use?', a: 'Yes — the demo includes carrier relationships and invitations, so your existing carriers are not strangers on the board.' },
    { q: 'Do you take a cut of the load?', a: 'No. There is no transaction fee in the product. Pricing is planned as a subscription, and the numbers are not final.' },
  ],
});

const shippers = rolePage({
  slug: 'shippers',
  role: 'Shippers',
  title: 'DispatchRelay for shippers — post freight and track it',
  description:
    'Shipper freight software: put loads in front of vetted carriers, watch them move in real time, and get a signed BOL on delivery. Free demo, no signup.',
  heading: 'Know where your freight is',
  lede: 'Post a load, see who is carrying it, and watch it move — without a status-request email.',
  body: [
    'Handing freight to a broker usually means losing sight of it until something goes wrong. Status comes from asking, proof of delivery comes days later, and the record lives in someone else’s inbox.',
    'DispatchRelay gives the shipper the same live view of the load that the carrier and broker have, and puts the signed delivery paperwork on the record as soon as it is signed.',
  ],
  cards: [
    { title: 'Post to vetted carriers', body: 'Freight goes in front of carriers whose authority has been checked.' },
    { title: 'One live view', body: 'The same position and status the carrier sees — no status-request emails.' },
    { title: 'Dock scheduling', body: 'Pickup and delivery windows on the load, so appointments are not a separate thread.' },
    { title: 'Proof of delivery', body: 'A signed bill of lading as a PDF on the load, the moment it is signed.' },
    { title: 'Share a tracking link', body: 'Hand a read-only link to whoever is asking, including your own customer.' },
    { title: 'History that stays put', body: 'Past loads, carriers and documents on one record instead of across inboxes.' },
  ],
  faq: [
    { q: 'Do I need to be a freight professional to use it?', a: 'No. The shipper view is the simplest of the four roles — post freight, watch it, collect the paperwork.' },
    { q: 'Can my customer see the tracking?', a: 'Yes, public tracking links are read-only and need no account.' },
    { q: 'How are carriers vetted?', a: 'Carrier authority and insurance are checked against FMCSA records before a carrier can take freight.' },
  ],
});

export const pages = [home, pricing, carriers, brokers, shippers];
