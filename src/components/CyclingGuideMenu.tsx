import { ChevronDown } from 'lucide-react';
import { cyclingGuidePath, guideCategories, guideCategoryPath } from '@/data/cycling-guide';

const itemClass = 'block rounded-md px-3 py-2 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600';

export default function CyclingGuideMenu() {
  return (
    <details
      className="shrink-0 sm:relative"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.open = false;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.currentTarget.open) {
          event.currentTarget.open = false;
          event.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 font-medium transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 [&::-webkit-details-marker]:hidden">
        Cycling Guide <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </summary>
      <ul className="absolute inset-x-4 z-50 mt-1 sm:left-auto sm:right-0 sm:w-52 rounded-xl border bg-white p-1.5 shadow-lg">
        <li><a className={itemClass} href={cyclingGuidePath}>All cycling places</a></li>
        {guideCategories.map((category) => (
          <li key={category.slug}><a className={itemClass} href={guideCategoryPath(category.slug)}>{category.label}</a></li>
        ))}
      </ul>
    </details>
  );
}
