import routes from './routes.json';
export const routeGuides = routes;
export const origin = 'https://www.iridemallorca.com';
export const products = [
  { slug: 'sunset', name: 'Sunset Mallorca Cycling Jersey', price: 64.50, colour: 'Orange and blue', description: 'A colourful Mallorca souvenir cycling jersey inspired by the island’s sunsets, mountains and palm-lined coast.', images: ['/jerseys/sunset-front.webp', '/jerseys/sunset-back.webp'] },
  { slug: 'pink', name: 'Pink Mallorca Cycling Jersey', price: 87.90, colour: 'Pink', description: 'An understated pink cycling jersey with a clear Mallorca identity, for riders who prefer a quieter island-inspired design.', images: ['/jerseys/pink-front.webp', '/jerseys/pink-back.webp'] },
  { slug: 'white', name: 'White Mallorca Cycling Jersey', price: 87.90, colour: 'White', description: 'A clean white cycling jersey with a Mallorca identity, designed to carry memories of the island into your next ride.', images: ['/jerseys/white-front.webp', '/jerseys/white-back.webp'] },
];
export const routePath = (slug: string) => `/routes/${slug}/`;
export const productPath = (slug: string) => `/jerseys/${slug}/`;
export const faq = [
  { question: 'Can I download the Mallorca cycling routes for free?', answer: 'Yes. Each Iconic Routes guide links to a free GPX download. Check the route type and file notes first: Coll de Sóller is an up-and-down mountain climb, and the extra Sa Calobra ascent-only file contains just three waypoints.' },
  { question: 'Are the route distances and climbing totals exact?', answer: 'No. Published figures are approximate calculations from the supplied GPX track points. Recording quality, elevation noise and route start or finish choices can change the figures shown by your cycling computer.' },
  { question: 'Is the Puig Major route a ride to the mountain summit?', answer: 'No. The GPX follows the public road from Sóller towards the Monnàber tunnel area. It does not provide access to the restricted summit.' },
  { question: 'Where does the Andratx route finish?', answer: 'The downloadable 114.0 km route finishes in Port de Pollença, not in central Pollença. It is a point-to-point ride, so arrange your return separately.' },
  { question: 'Which Mallorca cycling jersey designs are available to explore?', answer: 'The collection includes Sunset at €64.50, Pink at €87.90 and White at €87.90. See the individual jersey pages for images and ordering information. Confirm size availability, delivery charges and the final total before purchase.' },
];
