export const cyclingGuidePath = '/cycling-guide/';

export const guideCategories = [
  { slug: 'coffee-stops', label: 'Coffee Stops', description: 'Cycling cafés and places to refuel before, during or after a ride in Mallorca.' },
  { slug: 'bike-hire', label: 'Bike Hire', description: 'Find road, gravel and electric bike hire in Mallorca, with local pickup and delivery options.' },
  { slug: 'bike-shops-repairs', label: 'Bike Shops & Repairs', description: 'Find cycling shops, spare parts and bike workshops around Mallorca.' },
] as const;

export type GuideCategory = typeof guideCategories[number]['slug'];
export const guideCategoryPath = (slug: GuideCategory) => `${cyclingGuidePath}${slug}/`;

export const guideRegions = ['Palma & Bay', 'Southwest', 'Tramuntana', 'North', 'Central Mallorca', 'South & Southeast', 'East'] as const;
type GuideRegion = typeof guideRegions[number];

type Place = {
  name: string;
  town: string;
  region: GuideRegion;
  categories: GuideCategory[];
  description: string;
  source: string;
};

const coffee = 'coffee-stops';
const hire = 'bike-hire';
const shops = 'bike-shops-repairs';

function place(name: string, town: string, region: GuideRegion, categories: GuideCategory[], description: string, source: string): Place {
  return { name, town, region, categories, description, source };
}

export const guidePlaces = [
  place('Rapha Mallorca Clubhouse', 'Palma', 'Palma & Bay', [coffee], 'Clubhouse café in the old town with snacks, light meals and a group ride programme.', 'https://content.rapha.cc/eu/en/clubhouses/mallorca'),
  place('Pas Normal Studios Palma', 'Palma', 'Palma & Bay', [coffee], 'Coffee stop in Santa Catalina with a cycling apparel shop and organised rides.', 'https://pasnormalstudios.com/int/stores/mallorca'),
  place('La Molienda Bisbe', 'Palma', 'Palma & Bay', [coffee], 'Specialty coffee in central Palma for a pre-ride coffee or a stop after returning to the city.', 'https://coffeeridemallorca.com/stops/la-molienda-bisbe-palma'),
  place('Berganti Bikes', 'Can Pastilla', 'Palma & Bay', [hire, shops], 'Road and electric bikes near Playa de Palma, with delivery options and a Shimano service centre.', 'https://bergantibikes.com/en/bike-hire-port-de-andratx'),
  place('Bimont Bike Shop', 'Palma', 'Palma & Bay', [hire, shops], 'Bike shop in Can Valero with performance road and electric bike hire.', 'https://www.bimont.com/'),
  place('Mallorca Cycling Center', 'Can Pastilla', 'Palma & Bay', [hire, shops], 'Bike hire, repairs and bike transfers from its base at Hotel Java.', 'https://www.mallorcacyclingcenter.com/bike-rental/'),
  place('Huerzeler – Gran Fiesta', 'Playa de Palma', 'Palma & Bay', [hire], 'Seafront hire station at Hotel HM Gran Fiesta with bike storage and a wash station.', 'https://www.huerzeler.com/en/station/playa-de-palma-gran-fiesta'),
  place('Nano Bicycles', 'Palma', 'Palma & Bay', [hire], 'Central Palma rental shops with city, trekking, electric and children’s bikes.', 'https://nanobicycles.com/Contact/'),
  place('Trek Bicycle Mallorca', 'Palma', 'Palma & Bay', [shops], 'Bike sales and workshop services in Palma.', 'https://www.mallorca.com/en/directory/business/trek-bicycle-mallorca-palma-lktddhd0'),
  place('Ciclos Gomila – Palma', 'Palma', 'Palma & Bay', [shops], 'Bike shop on Carrer Setze de Juliol and a local contact for equipment enquiries.', 'https://www.ciclosgomila.com/es/mantengamonos-en-contacto'),

  place('Schwarzwald Café', 'Peguera', 'Southwest', [coffee], 'Café by Plaça de Torà for a stop before the MA-10 section towards Andratx.', 'https://www.mallorcacyclingcenter.com/routes/vuelta-a-mallorca/'),
  place('Bicicletas Pepe', 'Palmanova', 'Southwest', [hire], 'Carbon road bikes, including a Di2 option, plus e-bikes and mountain bikes.', 'https://bicicletaspepe.com/en/'),
  place('Why Not Cycling', 'Palmanova', 'Southwest', [hire], 'Road, city and electric bike hire with shop pickup and delivery enquiries.', 'https://why-not-cycling.com/bike-rental-prices/'),
  place('Tramuntbike', 'Santa Ponça', 'Southwest', [hire, shops], 'Bike hire, sales and repairs on Avinguda del Rei Jaume I.', 'https://www.mallorca.com/en/directory/business/tramuntbike-mallorca-santa-ponsa-liiizvna'),
  place('RideMallorca', 'Peguera', 'Southwest', [hire], 'Bike and e-bike hire on Carrer dels Tarongers.', 'https://www.mallorca.com/en/directory/business/ridemallorca-peguera-roerhtxs'),
  place('Huerzeler – Paguera', 'Peguera', 'Southwest', [hire], 'One of the operator’s Mallorca cycling stations. Select Paguera on the station list for details.', 'https://www.huerzeler.com/en/unser-radsportangebot/mallorca'),

  place('Cafetería Vall Hermós', 'Estellencs', 'Tramuntana', [coffee], 'Terrace café on the MA-10 coast road through Estellencs.', 'https://www.mallorcacyclingcenter.com/routes/vuelta-a-mallorca/'),
  place('Doble Coffee', 'Esporles', 'Tramuntana', [coffee], 'Specialty coffee in Esporles, a stop for rides linking Palma with the western Tramuntana.', 'https://www.traveltozero.com/en/explore/gastronomy/doble-coffee-esporles'),
  place('Ca’n Topa', 'Coll de Sóller', 'Tramuntana', [coffee], 'Refreshment stop at the top of the old Coll de Sóller road.', 'https://www.mallorca.com/en/directory/business/can-topa-coll-de-soller-soller-nydywace'),
  place('Café Coll de sa Batalla', 'Escorca', 'Tramuntana', [coffee], 'Café beside the petrol station at the top of the climb from Caimari.', 'https://coffeeridemallorca.com/stops/cafe-coll-de-sa-batalla'),
  place('Santuari de Lluc', 'Lluc', 'Tramuntana', [coffee], 'Food and drink options at the sanctuary. The visitor schedule lists the individual outlets.', 'https://www.lluc.net/en/timetables/'),
  place('Tramuntana Tours – Port de Sóller', 'Port de Sóller', 'Tramuntana', [hire, shops], 'Waterfront branch with bike rental, a cycling shop and a workshop.', 'https://www.tramuntanatours.com/shop/'),
  place('Tramuntana Tours – Central Sóller', 'Sóller', 'Tramuntana', [hire, shops], 'Bike shop on Carrer de sa Lluna. This branch requires a reservation for rentals.', 'https://www.tramuntanatours.com/shop/'),

  place('Tolo’s Restaurant', 'Port de Pollença', 'North', [coffee], 'Cycling-themed seafront restaurant for a meal or coffee before or after a Formentor ride.', 'https://tolosrestaurant.com/en/cycling/'),
  place('Holibikes Tours & Coffee', 'Port de Pollença', 'North', [coffee], 'Coffee, breakfast and ride snacks on the road out towards Formentor.', 'https://coffeeridemallorca.com/stops/holibikes-port-de-pollenca'),
  place('La Molienda Pollença', 'Pollença', 'North', [coffee], 'Specialty coffee and brunch in Pollença town.', 'https://lamolienda.es/es/coffeeshops/pollenca/'),
  place('Pinarello Experience', 'Port de Pollença', 'North', [hire], 'Pinarello road and electric road bikes. Check the minimum hire period before booking.', 'https://www.pinarelloexperience.com/prices'),
  place('Rent March', 'Port de Pollença', 'North', [hire], 'Local bike hire and online reservations in the port.', 'https://rentmarch.com/'),
  place('Pro Cycle Hire & Café', 'Port de Pollença', 'North', [hire, coffee], 'Performance bike hire and a cycling coffee stop on Carrer Corb Marí.', 'https://m.mallorcacomercial.es/en/empresa/4752/'),
  place('Bike Experience Mallorca', 'Port de Pollença', 'North', [hire, shops], 'Rental pickup, cycling accessories and repairs at the Port de Pollença shop.', 'https://www.bikeexperiencemallorca.com/en'),
  place('Wheels Sport – Port de Pollença', 'Port de Pollença', 'North', [hire], 'North-coast pickup for road, electric road and other hire bikes.', 'https://wheelssport.net/en/frequently-asked-questions'),
  place('Wheels Sport – Port d’Alcúdia', 'Port d’Alcúdia', 'North', [hire, shops], 'Road bike hire and maintenance, with rental add-ons such as pedals and GPS mounts.', 'https://www.mallorca.com/en/directory/business/wheels-sport-alcudia-alcudia'),
  place('Wheels Sport – Can Picafort', 'Can Picafort', 'North', [hire], 'Pickup branch for road, electric road and other hire bikes.', 'https://wheelssport.net/en/frequently-asked-questions'),
  place('Ecobikes & Paco’s', 'Port d’Alcúdia', 'North', [hire], 'Linked local rental outlets. Check which shop handles pickup and returns for your dates.', 'https://www.ecobikesmallorca.com/'),
  place('Huerzeler – Port d’Alcúdia', 'Port d’Alcúdia', 'North', [hire], 'Bike hire and cycling boutique with seasonal opening hours.', 'https://www.huerzeler.com/en/station/puerto-alcudia'),
  place('Huerzeler – Playa de Muro South', 'Playa de Muro', 'North', [hire, shops], 'Rental station with a repair workshop, bike storage and washing facilities.', 'https://www.huerzeler.com/en/station/alcudia-sued-muro'),
  place('Huerzeler – Can Picafort', 'Can Picafort', 'North', [hire], 'Road bike and e-bike hire on the Artà–Alcúdia road.', 'https://www.mallorca.com/en/directory/business/huerzeler-the-cycling-experience-bike-rental-can-picafort-brdmh1he'),

  place('Cycling Planet', 'Alaró', 'Central Mallorca', [coffee, hire, shops], 'Cycling café, hire shop and workshop in one stop, handy for rides around Alaró and Orient.', 'https://www.cyclingplanet.es/'),
  place('Sa Ruta Verda', 'Caimari', 'Central Mallorca', [coffee], 'Cycling café and refuelling stop before the Coll de sa Batalla climb.', 'https://rutaverda.com/contact/'),
  place('Sa Mola 13', 'Sineu', 'Central Mallorca', [coffee], 'Specialty coffee in a former mill on the edge of Sineu, a stop on longer rides through the Pla.', 'https://coffeeridemallorca.com/stops/sa-mola-13-sineu'),
  place('Bike Per Tots', 'Inca', 'Central Mallorca', [shops], 'Local bike shop and workshop for repair and parts enquiries.', 'https://www.mallorca.com/en/directory/business/bike-per-tots-inca-acqoirpw'),
  place('Ciclos Gomila – Binissalem', 'Binissalem', 'Central Mallorca', [hire, shops], 'Bike rental, workshop and cycling shop on Carrer del Conquistador.', 'https://gomilacyclingmallorca.com/en/rent-bike-binissalem/'),

  place('CurroBikes', 'Campos', 'South & Southeast', [hire], 'Road, electric and trekking bikes with delivery options to nearby coastal towns.', 'https://currobikes.es/en/faq'),
  place('Ciclos Mora', 'Colònia de Sant Jordi', 'South & Southeast', [hire], 'Local hire option for road bikes, e-bikes and mountain bikes.', 'https://atlasmallorca.es/en/experiences/alquiler-bici-carretera-ebike-colonia-de-sant-jordi-ciclos-mora/'),
  place('Ciclos Gomila – Felanitx', 'Felanitx', 'South & Southeast', [hire, shops], 'Shop, hire and workshop near the approach to the Sant Salvador climb.', 'https://gomilacyclingmallorca.com/en/rent-bike-felanitx/'),
  place('Danilo Hondo ePoint', 'Cala d’Or', 'South & Southeast', [hire, shops], 'E-bike hire and bike sales, with delivery options from Cala d’Or.', 'https://www.danilo-hondo-epoint.com/en'),
  place('Sa Botiga', 'Santanyí', 'South & Southeast', [coffee], 'Café and restaurant in the old town for a stop on a longer southeast ride.', 'https://sabotiga-santanyi.com/en/'),

  place('Cycling Sports Cafe', 'Cala Millor', 'East', [coffee, hire], 'Seafront cycling café with electric city bike hire.', 'https://mallorcacyclinglab.com/en/cafes/cycling-sports-cafe-electric-city-bike-hire'),
  place('Sancho Bikes', 'Cala Millor', 'East', [hire, shops], 'Bike hire, sales and an appointment-based workshop on Carrer dels Molins.', 'https://sanchobikes.com/en/taller'),
  place('Fassanelli Bike', 'Artà', 'East', [hire, shops], 'Road, gravel and electric bike hire plus a repair workshop near the Via Verda.', 'https://www.mallorca.com/en/directory/business/fassanelli-bike-sl-arta-5atfya1y'),
  place('Bicicletes Caldentey', 'Manacor', 'East', [shops], 'Local bike shop for cycling equipment and service enquiries.', 'https://www.mallorca.com/en/directory/business/bicicletes-caldentey-s-l-manacor-7qvhs-ya'),
  place('Huerzeler – Sa Coma', 'Sa Coma', 'East', [hire], 'East-coast hire option. Select Sa Coma on the station list for current dates.', 'https://www.huerzeler.com/en/unser-radsportangebot/mallorca'),
  place('Rent a Scooter & Bike Cristóbal', 'Cala Ratjada', 'East', [hire], 'Local bicycle hire in Cala Ratjada. Ask the shop which bike styles are available.', 'https://www.mallorca.com/en/directory/business/rent-a-scooter-bike-cristobal-cala-ratjada-cala-ratjada-foy8d620'),
];
