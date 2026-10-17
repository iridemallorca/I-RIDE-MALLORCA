const brandOwner = (
  <address className="not-italic leading-relaxed text-neutral-700">
    <strong>EMS International Kft.</strong><br />
    Brand owner of I Ride Mallorca<br />
    2131 Göd, Rozmaring utca 3., Hungary<br />
    Company registration number: 13-09-226392<br />
    Tax number: 23569841-2-13 · EU VAT number: HU23569841<br />
    Email: <a className="text-red-700 underline" href="mailto:iridemallorca@gmail.com">iridemallorca@gmail.com</a>
  </address>
);

export function LegalPage({ path }: { path: string }) {
  if (path === '/privacy/') return <>
    <h1 className="text-3xl font-bold md:text-5xl">Privacy notice</h1>
    <p className="mt-5 max-w-3xl text-lg leading-relaxed text-neutral-700">This notice explains how I Ride Mallorca handles personal data when you use the website, send an order request, use the community chat or contact us.</p>
    <div className="mt-10 max-w-3xl space-y-7 leading-relaxed text-neutral-700">
      <section><h2 className="text-2xl font-bold text-neutral-900">Data controller</h2>{brandOwner}</section>
      <section><h2 className="text-2xl font-bold text-neutral-900">What we collect and why</h2><p>For a jersey order request, we process the name, email address, preferred size, delivery details and message you provide. We use this information to respond to your request, confirm availability, arrange delivery and, if a final order is agreed, meet our contractual and legal obligations. We may also retain correspondence needed to handle customer service or a legal claim.</p><p className="mt-3">For the community chat, we store the public message, a neutral rider name generated from a random browser identifier, time of posting and any report made about a message. We use this information to operate the chat, prevent spam and keep the community safe. Do not include personal data in a public message.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Legal basis and retention</h2><p>We process order-request and contact data to take steps at your request before a contract and, where relevant, to perform a contract. We retain it only for as long as needed for the request, customer relationship, legal obligations or the establishment, exercise or defence of legal claims. Accounting records are retained for the period required by applicable law.</p><p className="mt-3">We process community-chat records for our legitimate interest in operating a safe cycling community. Public messages remain available unless removed for moderation; report records are retained only as long as necessary to handle safety and abuse.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Who receives the data</h2><p>Access is limited to EMS International Kft. and service providers that help operate the website, email and delivery process where necessary. We do not sell personal data. A provider may process data outside the European Economic Area only where a lawful transfer mechanism applies.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Your rights</h2><p>You may request access, correction, deletion, restriction, objection or portability where applicable. You may withdraw consent at any time where processing relies on consent. Email <a className="text-red-700 underline" href="mailto:iridemallorca@gmail.com">iridemallorca@gmail.com</a>. You may also lodge a complaint with the Hungarian National Authority for Data Protection and Freedom of Information (NAIH) or your local supervisory authority.</p></section>
      <p className="text-sm text-neutral-500">Last updated: 16 October 2026.</p>
    </div>
  </>;
  if (path === '/community-guidelines/') return <>
    <h1 className="text-3xl font-bold md:text-5xl">Community chat guidelines</h1>
    <p className="mt-5 max-w-3xl text-lg leading-relaxed text-neutral-700">I Ride Mallorca is for constructive conversations between cyclists. By posting, you agree to these rules.</p>
    <div className="mt-10 max-w-3xl space-y-7 leading-relaxed text-neutral-700">
      <section><h2 className="text-2xl font-bold text-neutral-900">Keep it useful and respectful</h2><p>Share route knowledge, ride plans and questions in a friendly way. Do not post abusive, discriminatory, threatening or harmful content.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Protect everyone’s privacy</h2><p>Do not publish names, email addresses, phone numbers, home or meeting addresses, payment information or links. Use the neutral rider name assigned by the site; no personal profile is required.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">No spam or selling</h2><p>Do not post advertisements, promotions, repetitive messages, scams or unsolicited commercial offers. The chat is not for arranging payments.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Reporting and moderation</h2><p>Use the Report button when a message breaks these rules. Reports are recorded, and messages receiving multiple independent reports are automatically hidden. I Ride Mallorca may remove content or limit use of the chat to protect the community.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Need help?</h2><p>For a privacy or safety question, contact <a className="text-red-700 underline" href="mailto:iridemallorca@gmail.com">iridemallorca@gmail.com</a>.</p></section>
      <p className="text-sm text-neutral-500">Last updated: 17 October 2026.</p>
    </div>
  </>;
  if (path === '/cookies/') return <>
    <h1 className="text-3xl font-bold md:text-5xl">Cookie and local storage notice</h1>
    <div className="mt-10 max-w-3xl space-y-7 leading-relaxed text-neutral-700">
      <p>I Ride Mallorca does not currently use advertising, analytics or social-media tracking cookies. Therefore, no optional-cookie banner is shown.</p>
      <section><h2 className="text-2xl font-bold text-neutral-900">Essential website storage</h2><p>When you start a jersey order request, the website can store the draft details locally in your browser so that they remain available while you complete the form. This information stays on your device and is removed after a successful submission. The community chat also stores a random browser identifier locally so it can assign a neutral rider name and apply basic anti-spam limits. You can clear this storage at any time in your browser settings.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Future changes</h2><p>If we introduce non-essential cookies or similar technologies, we will update this notice and request consent before activating them where required.</p></section>
      <p>Questions: <a className="text-red-700 underline" href="mailto:iridemallorca@gmail.com">iridemallorca@gmail.com</a>.</p>
      <p className="text-sm text-neutral-500">Last updated: 16 October 2026.</p>
    </div>
  </>;
  if (path === '/ordering/') return <>
    <h1 className="text-3xl font-bold md:text-5xl">Ordering, delivery and returns</h1>
    <div className="mt-10 max-w-3xl space-y-7 leading-relaxed text-neutral-700">
      <section><h2 className="text-2xl font-bold text-neutral-900">Order requests</h2><p>Submitting a form on I Ride Mallorca is an order request only. It is not a payment and does not create a final order. We contact every rider personally by email to confirm availability, size, delivery options, the final total and payment before anything is charged.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Price, delivery and payment</h2><p>Prices shown on product pages are in EUR. Any delivery charge, delivery timing, final price and payment method are confirmed individually by email before a final order is accepted. Please do not send payment until we have confirmed these details with you.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Returns and statutory rights</h2><p>Before payment, we will provide the applicable delivery, cancellation and return instructions for your final order. Nothing in this notice limits mandatory consumer rights that apply to you. For help with an order request or return query, contact us at <a className="text-red-700 underline" href="mailto:iridemallorca@gmail.com">iridemallorca@gmail.com</a>.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Contact and brand owner</h2>{brandOwner}</section>
      <p className="text-sm text-neutral-500">Last updated: 16 October 2026.</p>
    </div>
  </>;
  return <>
    <h1 className="text-3xl font-bold md:text-5xl">Brand and legal information</h1>
    <div className="mt-10 max-w-3xl space-y-7 leading-relaxed text-neutral-700">
      <section><h2 className="text-2xl font-bold text-neutral-900">I Ride Mallorca</h2><p>I Ride Mallorca is a cycling community and apparel brand focused on Mallorca road cycling routes, downloadable GPX files and island-inspired jerseys.</p></section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Brand owner</h2>{brandOwner}</section>
      <section><h2 className="text-2xl font-bold text-neutral-900">Useful information</h2><ul className="list-disc space-y-2 pl-5"><li><a className="text-red-700 underline" href="/privacy/">Privacy notice</a></li><li><a className="text-red-700 underline" href="/cookies/">Cookie and local storage notice</a></li><li><a className="text-red-700 underline" href="/ordering/">Ordering, delivery and returns</a></li><li><a className="text-red-700 underline" href="/community-guidelines/">Community chat guidelines</a></li></ul></section>
      <p className="text-sm text-neutral-500">Last updated: 16 October 2026.</p>
    </div>
  </>;
}
