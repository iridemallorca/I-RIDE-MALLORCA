import { useState } from 'react';
import { ArrowUpRight, Bike, Coffee, MapPin, Wrench } from 'lucide-react';
import { cyclingGuidePath, guideCategories, guideCategoryPath, guidePlaces, guideRegions, type GuideCategory } from '@/data/cycling-guide';

const icons = { 'coffee-stops': Coffee, 'bike-hire': Bike, 'bike-shops-repairs': Wrench };
const fieldClass = 'w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600';
const normalise = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

export default function CyclingDirectory({ category }: { category?: GuideCategory }) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const activeCategory = guideCategories.find((item) => item.slug === category);
  const places = guidePlaces.filter((place) => !category || place.categories.includes(category));
  const search = normalise(query.trim());
  const matches = places.filter((place) => {
    const text = normalise(`${place.name} ${place.town} ${place.region} ${place.description}`);
    return (!region || place.region === region) && text.includes(search);
  });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-600">
        <a className="hover:underline" href="/">Home</a> <span aria-hidden="true">/</span>{' '}
        {activeCategory ? <><a className="hover:underline" href={cyclingGuidePath}>Cycling Guide</a> <span aria-hidden="true">/</span> <span aria-current="page">{activeCategory.label}</span></> : <span aria-current="page">Cycling Guide</span>}
      </nav>
      <h1 className="text-3xl font-bold md:text-5xl">{activeCategory ? `Mallorca ${activeCategory.label}` : 'Mallorca Cycling Guide'}</h1>
      <div aria-hidden="true" className="mt-4 h-1 w-24 rounded bg-gradient-to-r from-red-500 to-yellow-400" />
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700">{activeCategory?.description ?? 'Find cycling cafés, bike hire and workshops across Mallorca, from Palma and the Tramuntana to the east coast.'}</p>
      <nav aria-label="Cycling guide categories" className="mt-7 flex flex-wrap gap-2">
        <a href={cyclingGuidePath} aria-current={category ? undefined : 'page'} className={`rounded-full border px-4 py-2 text-sm font-semibold hover:border-red-500 ${category ? 'bg-white' : 'border-red-700 bg-red-700 text-white'}`}>All places</a>
        {guideCategories.map((item) => {
          const Icon = icons[item.slug];
          const active = item.slug === category;
          return <a key={item.slug} href={guideCategoryPath(item.slug)} aria-current={active ? 'page' : undefined} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:border-red-500 ${active ? 'border-red-700 bg-red-700 text-white' : 'bg-white'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
          </a>;
        })}
      </nav>
      <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Search places
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Sóller or gravel" className={`mt-2 ${fieldClass}`} />
        </label>
        <label className="text-sm font-medium">Area
          <select value={region} onChange={(event) => setRegion(event.target.value)} className={`mt-2 ${fieldClass}`}>
            <option value="">All areas</option>
            {guideRegions.filter((area) => places.some((place) => place.region === area)).map((area) => <option key={area}>{area}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className="mt-5 text-sm text-neutral-600">{matches.length} {matches.length === 1 ? 'place' : 'places'}</p>
      {matches.length === 0 ? <p className="mt-4 rounded-xl border bg-white p-5">Try another search or choose a different area.</p> : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((place) => (
            <article key={place.name} className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm">
              <p className="flex items-start gap-1.5 text-sm text-neutral-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />{place.town} · {place.region}</p>
              <h2 className="mt-2 text-xl font-bold">{place.name}</h2>
              <ul aria-label="Services" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-red-800">
                {guideCategories.filter((item) => place.categories.includes(item.slug)).map((item) => <li key={item.slug}>{item.label}</li>)}
              </ul>
              <p className="mb-4 mt-3 leading-relaxed text-neutral-700">{place.description}</p>
              <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
                <a className="inline-flex items-center gap-1 text-red-700 hover:underline" aria-label={`Details for ${place.name}`} href={place.source}>Details <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
                <a className="text-neutral-700 hover:underline" aria-label={`Map for ${place.name}`} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.town} Mallorca`)}`}>Map</a>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-neutral-600">Check seasonal hours, rental availability and workshop appointments with each provider before visiting.</p>
    </>
  );
}
