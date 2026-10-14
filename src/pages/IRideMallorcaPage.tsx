import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mountain, Wind, Bike, Mail, Shirt, ArrowRight, Upload, MessageCircle, Users } from "lucide-react";

import type { ChatMsg, OrderDraft as OrderDraftT, TrackDTO, PartnerPostDTO } from "@/api/types";
import { fetchChat, sendChat } from "@/api/chat";
import { fetchUpcomingPartners, createPartnerPost } from "@/api/partner";
import { fetchTracks, createTrack } from "@/api/track";
import { createOrder } from "@/api/order";
import { subscribeEmail } from "@/api/subscription";

import { uploadGpx } from "@/api/gpx";
import { apiBase } from "@/api/client";

import JerseySlideshow from "@/components/JerseySlideshow";

const ROUTE_STORIES = [
  {
    "heading": "1. SA CALOBRA",
    "subtitle": "THE LEGENDARY CLIMB",
    "tagline": "One road down. One way back. A climb you'll never forget.",
    "paragraphs": [
      "Some climbs you simply ride. Others stay with you for a lifetime.",
      "Sa Calobra is one of those climbs.",
      "Hidden deep within the spectacular Serra de Tramuntana mountains, Mallorca's most legendary cycling road has earned its place on the bucket list of road cyclists around the world.",
      "The experience begins long before the climbing starts. As you descend towards the small coastal village of Sa Calobra, the road twists through dramatic limestone cliffs, endless hairpin bends, and breathtaking mountain scenery. Every corner reveals another unforgettable view.",
      "But the real story begins at the bottom.",
      "Once you've reached the sea, there's only one way back: up.",
      "The approximately 9.5-kilometre climb, averaging around 7%, demands patience, determination, and a steady rhythm. With every turn of the pedals, you climb higher above the Mediterranean, leaving the valley further behind.",
      "The famous 270-degree Nus de sa Corbata bend is a reminder that this is no ordinary road. It's a masterpiece of mountain engineering and one of the most photographed corners in cycling.",
      "Your legs begin to burn. Your breathing gets heavier. The road keeps rising.",
      "But you keep going.",
      "And finally, when you reach the top and look back towards the winding road below, something special happens.",
      "You realise that the greatest reward isn't your average speed, your power output, or your Strava time.",
      "It's knowing that you did it.",
      "Sa Calobra isn't just a climb. It's an achievement you'll carry with you long after the ride is over."
    ],
    "signature": "I Ride Mallorca. Earn the Climb. Remember the Ride."
  },
  {
    "heading": "2. CAP DE FORMENTOR",
    "subtitle": "RIDE TO THE EDGE",
    "tagline": "Where the mountains meet the sea, and every turn takes your breath away.",
    "paragraphs": [
      "Imagine setting off from Port de Pollença in the warm morning sunshine.",
      "Ahead lies a ribbon of asphalt winding through one of the most spectacular coastal landscapes in the Mediterranean.",
      "The sea stretches endlessly towards the horizon. The cliffs rise dramatically above the water. The air carries the unmistakable scent of the Mediterranean.",
      "Welcome to Cap de Formentor.",
      "This iconic cycling route takes you towards the northernmost tip of Mallorca, where a lighthouse stands above the sea at the end of a remarkable mountain road.",
      "The journey is a beautiful combination of short but challenging climbs, flowing descents, twisting corners, and extraordinary views.",
      "Every turn feels like a new discovery.",
      "As you approach Mirador des Colomer, the landscape becomes almost unreal. Towering cliffs plunge towards turquoise water, while the road continues to weave its way along the rugged coastline.",
      "It's the kind of place that makes even the most dedicated cyclist forget about watts and speed for a moment.",
      "Sometimes you simply have to stop, take it all in, and appreciate where your bike has brought you.",
      "And then, finally, the lighthouse appears in the distance.",
      "Reaching Cap de Formentor feels like arriving at the edge of the island — a place where the mountains end, the sea begins, and the horizon seems to stretch forever.",
      "You've reached this remarkable location under your own power.",
      "But the adventure isn't over yet.",
      "The return ride reveals entirely new perspectives, proving that the same road can deliver two completely different experiences.",
      "Formentor reminds us that cycling isn't always about how far or how fast we ride. Sometimes it's about everything we discover along the way."
    ],
    "signature": "I Ride Mallorca. Chase the Horizon."
  },
  {
    "heading": "3. PUIG MAJOR",
    "subtitle": "THE ULTIMATE MOUNTAIN CHALLENGE",
    "tagline": "Find your rhythm. Conquer the mountain. Feel the freedom.",
    "paragraphs": [
      "There is something special about a long mountain climb.",
      "The moment when the distractions disappear, your breathing settles into a rhythm, and the only thing that matters is the road ahead.",
      "If you love that feeling, Puig Major belongs on your Mallorca cycling list.",
      "Rising into the heart of the Serra de Tramuntana, the road towards Mallorca's highest mountain offers one of the island's most famous endurance climbs.",
      "Starting from Sóller, approximately 15 kilometres of sustained climbing lead towards the Monnàber tunnel, testing your pacing, patience, and determination.",
      "This isn't a climb that demands constant attacks or sudden bursts of speed.",
      "It's a mountain that rewards consistency.",
      "As you gain altitude, the landscape slowly transforms around you.",
      "The orange groves and charming streets of Sóller disappear below, replaced by pine forests, towering rock formations, and spectacular mountain scenery.",
      "Kilometre after kilometre, you settle into your own rhythm.",
      "The climb becomes a conversation between you, your bike, and the mountain.",
      "Some moments feel effortless. Others test your determination.",
      "But every pedal stroke takes you higher.",
      "Beyond the main ascent, the dramatic surroundings of the Cúber and Gorg Blau reservoirs offer an entirely different side of Mallorca — peaceful, rugged, and almost alpine in character.",
      "Up here, far above the busy beaches and coastal towns, Mallorca feels wonderfully different.",
      "For experienced riders, Puig Major offers the satisfaction of a classic endurance climb. For ambitious recreational cyclists, it represents a challenge worth preparing for.",
      "And when the climbing is done, the reward arrives in the form of mountain views, sweeping roads, and the unmistakable satisfaction of earning every metre of elevation.",
      "Because some of the best cycling moments aren't about speed. They're about discovering just how far your determination can take you."
    ],
    "signature": "I Ride Mallorca. Rise Above the Ordinary."
  },
  {
    "heading": "4. COLL DE SÓLLER",
    "subtitle": "THE ART OF THE PERFECT CURVE",
    "tagline": "Endless curves. Pure rhythm. Timeless cycling.",
    "paragraphs": [
      "There is a moment on a beautiful mountain road when everything simply comes together.",
      "Your breathing, your cadence, the rhythm of the corners, and the feeling of your bike moving effortlessly beneath you.",
      "Coll de Sóller is a place where that moment happens again and again.",
      "This classic Mallorcan mountain pass is famous for its extraordinary collection of hairpin bends, beautiful surroundings, and wonderfully flowing road.",
      "With much of the through traffic using the nearby tunnel, the old mountain road has become a favourite among cyclists seeking the pure pleasure of climbing and descending.",
      "The magic of Coll de Sóller isn't about extreme gradients or conquering Mallorca's highest peaks.",
      "It's about rhythm.",
      "One corner leads naturally into the next.",
      "You shift gears, rise briefly out of the saddle, settle back into your cadence, and follow the road as it winds gracefully through the mountains.",
      "The climb invites you to find your own pace and enjoy every metre.",
      "There is no need to rush.",
      "As you approach the summit, the landscape opens up, revealing beautiful views across the surrounding mountains.",
      "And then comes the descent towards Sóller.",
      "Hairpin after hairpin, the road winds down towards a picturesque valley filled with orange and lemon groves, traditional stone houses, and Mediterranean charm.",
      "It's the kind of descent that demands attention and rewards smooth, controlled riding.",
      "Coll de Sóller is a reminder of everything that makes road cycling special.",
      "The sound of the tyres on the asphalt. The precision of a well-taken corner. The satisfaction of a steady climb.",
      "And the freedom of being exactly where you want to be.",
      "Sometimes the perfect ride isn't about reaching a destination. It's about loving every single turn along the way."
    ],
    "signature": "I Ride Mallorca. Every Curve Tells a Story."
  },
  {
    "heading": "5. ANDRATX TO POLLENÇA",
    "subtitle": "THE ULTIMATE MALLORCA RIDE",
    "tagline": "One island. Countless climbs. A lifetime of memories.",
    "paragraphs": [
      "If you had just one day to experience the very best of road cycling in Mallorca, this would be one of the rides to choose.",
      "The legendary journey from Andratx to Pollença takes you across the spectacular Serra de Tramuntana, combining mountain roads, traditional villages, coastal views, and unforgettable climbs into one extraordinary adventure.",
      "From the southwestern corner of the island, the road begins its journey through a landscape where rugged mountains meet the Mediterranean Sea.",
      "Steep cliffs rise above the coastline. Small villages appear between the hills. Every climb opens the door to another remarkable view.",
      "The route carries you through some of Mallorca's most beautiful surroundings.",
      "Estellencs, Banyalbufar, Valldemossa, and Deià are names that every cycling enthusiast should experience at least once.",
      "These places feel almost designed for road cycling.",
      "Narrow mountain roads wind between ancient stone terraces and traditional houses. The Mediterranean glitters far below, while the mountains seem to stretch endlessly ahead.",
      "But this journey is about much more than beautiful scenery.",
      "Depending on the route variation, the ride can extend beyond 110–120 kilometres, with substantial elevation gain and a succession of demanding climbs.",
      "It's a true full-day cycling adventure.",
      "One that requires preparation, endurance, and smart pacing.",
      "There will be moments when you feel unstoppable, flowing effortlessly along beautiful roads.",
      "And there will be climbs where every turn of the pedals requires concentration and determination.",
      "Somewhere along the way, you'll stop for a coffee in a mountain village.",
      "You'll refill your bottles, stretch your legs, and look out across the incredible landscape around you.",
      "And you'll remember exactly why you brought your bike to Mallorca.",
      "As the kilometres pass, the ride becomes more than a physical challenge.",
      "It becomes a collection of moments.",
      "The conversations with fellow cyclists. The quiet roads in the early morning. The satisfaction of reaching another summit. The excitement of discovering what lies beyond the next corner.",
      "And when you finally arrive in Pollença, you know you've experienced something special.",
      "You haven't just crossed Mallorca.",
      "You've experienced its mountains, its villages, its coastline, and its incredible cycling culture in one unforgettable journey.",
      "This is everything we love about road cycling: freedom, challenge, friendship, discovery, and the feeling of completing something extraordinary."
    ],
    "signature": "I Ride Mallorca. Don't Just Visit the Island. Ride It."
  },
  {
    "heading": "6. CALVIÀ LOOP",
    "subtitle": "FROM COAST TO CLIMB",
    "tagline": "Coastal vibes. Mountain climbs. Pure Mallorca cycling.",
    "paragraphs": [
      "Route: Palmanova – Santa Ponça – Peguera – Es Capdellà – Coll de sa Creu – Palma – Palmanova",
      "Not every unforgettable ride needs to take you to the farthest corner of the island.",
      "Sometimes, the perfect cycling adventure is waiting right outside your door.",
      "The Calvià Loop brings together everything that makes cycling in Mallorca so special: Mediterranean coastal scenery, charming villages, peaceful countryside, winding mountain roads, and just enough climbing to make you feel you've earned that post-ride coffee.",
      "Starting in Palmanova, the route takes you through Santa Ponça and Peguera, where the relaxed atmosphere of Mallorca's southwest coast sets the tone for the adventure ahead.",
      "The morning sunshine, palm-lined streets, and glimpses of turquoise water remind you exactly why you came to ride on this island.",
      "But the real magic begins as you leave the coast behind.",
      "Heading towards Es Capdellà, the landscape slowly transforms.",
      "Busy seaside towns give way to traditional Mallorcan countryside, stone houses, olive trees, and the foothills of the Serra de Tramuntana.",
      "The roads begin to rise, the rhythm changes, and suddenly it's just you, your bike, and the beautiful road ahead.",
      "Then comes Coll de sa Creu.",
      "This is where the ride earns its character.",
      "The climb rewards a steady rhythm rather than an all-out effort, offering flowing bends, mountain scenery, and that familiar feeling every cyclist loves: finding your pace and settling into the ascent.",
      "Reaching the top brings its own quiet satisfaction.",
      "You've traded the beaches for the mountains, powered your way through the countryside, and experienced another side of Mallorca that many visitors never get to see.",
      "The descent towards Palma delivers a different kind of excitement.",
      "Flowing corners, changing scenery, and views towards the Bay of Palma make the journey back every bit as memorable as the climb itself.",
      "And as you make your way from Palma back to Palmanova, the circle is complete.",
      "You've experienced the coast, the countryside, the mountains, and the city — all in one ride.",
      "The Calvià Loop isn't about conquering Mallorca's biggest mountain or chasing a personal record.",
      "It's about enjoying the perfect balance between effort and freedom, discovering the island at your own pace, and remembering why you fell in love with cycling in the first place.",
      "Because sometimes, the best rides aren't the longest or the hardest. They're the ones that make you wish you could do it all over again tomorrow."
    ],
    "signature": "I Ride Mallorca. My Roads. My Rhythm. My Island."
  }
];

const LOGO = "/IRIDEMALLORCA_LOGO.jpg";

type PartnerTrack = { fileUrl: string; distanceKm: number; elevationGainM: number; svgPath?: string };
type PartnerPost = { id: string; name: string; whenISO: string; address: string; pace?: number; note?: string; track?: PartnerTrack | null };

type TrackCard = { id: string; title: string; fileUrl: string; distanceKm: number; elevationGainM: number; bbox: readonly [number, number, number, number]; svgPath?: string };

const km = (n: number) => `${n.toFixed(1)} km`;

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function parseGPX(file: File) {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const pts = Array.from(doc.getElementsByTagName("trkpt"));
  const coords = pts.map((p: any) => [
    parseFloat(p.getAttribute("lat")),
    parseFloat(p.getAttribute("lon")),
    p.getElementsByTagName("ele")[0]?.textContent ? parseFloat(p.getElementsByTagName("ele")[0].textContent!) : 0,
  ]);

  let dist = 0, gain = 0;
  for (let i = 1; i < coords.length; i++) {
    dist += haversineKm([coords[i - 1][0], coords[i - 1][1]], [coords[i][0], coords[i][1]]);
    const d = coords[i][2] - coords[i - 1][2];
    if (d > 0) gain += d;
  }

  const lats = coords.map(c => c[0]);
  const lons = coords.map(c => c[1]);
  const bbox = [Math.min(...lats), Math.min(...lons), Math.max(...lats), Math.max(...lons)] as const;

  return { coords, distanceKm: dist, elevationGainM: Math.round(gain), bbox };
}

const LS_ORDER_DRAFT = "irm_order_v1";

function loadLS<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function saveLS<T>(key: string, val: T) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } }

function RideChat({ room }: { room: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const user = useMemo(() => `guest-${(Math.random() * 9999 | 0).toString(16)}`, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const data = await fetchChat(room, 200);
        if (!alive) return;

        const mapped: ChatMsg[] = (data || []).map((m) => ({
          room: m.room,
          user: m.user,
          content: m.content,
          ts: new Date(m.ts).getTime(),
        }));

        setMessages(mapped);
      } catch {
        // silent
      }
    }

    load();
    const id = window.setInterval(load, 2500);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [room]);

  async function send() {
    if (!text.trim()) return;

    const payload = { user, content: text.trim(), ts: Date.now() };
    setText("");

    try {
      const created = await sendChat(room, payload);
      const m: ChatMsg = {
        room: created.room,
        user: created.user,
        content: created.content,
        ts: new Date(created.ts).getTime(),
      };
      setMessages((x) => [...x, m]);
    } catch (e: any) {
      alert(e?.message || "Failed to send message");
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center gap-2">
        <MessageCircle className="w-5 h-5 text-red-600" />
        <CardTitle className="text-base md:text-lg">Ride Chat – {room}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-[21/9] rounded-xl border bg-white overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-2 bg-neutral-50 text-sm">
            {messages.length === 0 ? (
              <div className="text-neutral-500 text-sm p-3">Welcome to the channel! Send the first message 🚴</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className="text-sm py-1">
                  <b className="text-neutral-700">{m.user}</b>{" "}
                  <span className="text-neutral-400 text-xs">{new Date(m.ts).toLocaleTimeString()}</span>: {m.content}
                </div>
              ))
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t p-3 flex gap-2 bg-neutral-100">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message…"
              aria-label="Message"
            />
            <Button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 text-sm">Send</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

const FileInputEn = React.forwardRef<HTMLInputElement, {
  name?: string; accept?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; buttonText?: string; noFileText?: string; inline?: boolean;
}>(({ name, accept, onChange, buttonText = "Choose File", noFileText = "No file chosen", inline = false }, ref) => {
  const [fileName, setFileName] = useState<string>(noFileText);
  const id = useMemo(() => `f_${Math.random().toString(36).slice(2)}`, []);
  return (
    <div className={inline ? "flex items-center gap-3 text-sm" : "flex flex-col text-sm"}>
      <label htmlFor={id} className="inline-flex items-center gap-2 bg-neutral-100 border border-neutral-300 rounded-md px-3 py-2 cursor-pointer hover:bg-neutral-200 w-fit">
        {buttonText}
        <input
          id={id}
          name={name}
          ref={ref}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            setFileName(e.target.files?.[0]?.name || noFileText);
            onChange?.(e);
          }}
        />
      </label>
      <span className={inline ? "text-neutral-600 truncate max-w-[24rem]" : "mt-1 text-neutral-600 truncate max-w-[24rem]"}>{fileName}</span>
    </div>
  );
});
FileInputEn.displayName = "FileInputEn";

function OrderFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<OrderDraftT>(() =>
    loadLS<OrderDraftT>(LS_ORDER_DRAFT, {
      buyerName: "",
      buyerEmail: "",
      buyerAddress: "",
      shippingName: "",
      shippingAddress: "",
      shippingSameAsBuyer: true,
      gender: "male",
      size: "M",
    })
  );

  useEffect(() => { saveLS(LS_ORDER_DRAFT, draft); }, [draft]);

  useEffect(() => {
    if (!draft.shippingSameAsBuyer) return;
    setDraft((prev) => ({ ...prev, shippingName: prev.buyerName, shippingAddress: prev.buyerAddress }));
  }, [draft.shippingSameAsBuyer, draft.buyerName, draft.buyerAddress]);

  if (!open) return null;

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();

    const payload: OrderDraftT = draft.shippingSameAsBuyer
      ? { ...draft, shippingName: draft.buyerName, shippingAddress: draft.buyerAddress }
      : draft;

    try {
      await createOrder(payload);
      alert("Order sent successfully!");
      onClose();
    } catch (e: any) {
      alert(e?.message || "Order failed");
    }
  }

  const shippingDisabled = draft.shippingSameAsBuyer;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="text-lg font-bold">Order Jersey</h4>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-800">Close</button>
        </div>

        <form onSubmit={submitOrder} className="p-4 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 font-semibold text-neutral-700">Buyer</div>

          <input required placeholder="Full name" className="border rounded-xl px-3 py-2"
            value={draft.buyerName} onChange={(e) => setDraft({ ...draft, buyerName: e.target.value })} />

          <input required type="email" placeholder="Email" className="border rounded-xl px-3 py-2"
            value={draft.buyerEmail} onChange={(e) => setDraft({ ...draft, buyerEmail: e.target.value })} />

          <input required placeholder="Address" className="border rounded-xl px-3 py-2 md:col-span-2"
            value={draft.buyerAddress} onChange={(e) => setDraft({ ...draft, buyerAddress: e.target.value })} />

          <div className="md:col-span-2 font-semibold text-neutral-700 mt-2">Shipping</div>

          <label className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="h-4 w-4 accent-red-600"
              checked={draft.shippingSameAsBuyer}
              onChange={(e) => setDraft({ ...draft, shippingSameAsBuyer: e.target.checked })} />
            Shipping address is same as buyer
          </label>

          <input required placeholder="Shipping name"
            className={`border rounded-xl px-3 py-2 ${shippingDisabled ? "bg-neutral-100 text-neutral-500" : ""}`}
            value={draft.shippingName}
            onChange={(e) => setDraft({ ...draft, shippingName: e.target.value })}
            disabled={shippingDisabled} />

          <input required placeholder="Shipping address"
            className={`border rounded-xl px-3 py-2 ${shippingDisabled ? "bg-neutral-100 text-neutral-500" : ""}`}
            value={draft.shippingAddress}
            onChange={(e) => setDraft({ ...draft, shippingAddress: e.target.value })}
            disabled={shippingDisabled} />

          <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-sm text-neutral-700 block mb-1">Gender</label>
              <select className="border rounded-xl px-3 py-2 w-full"
                value={draft.gender}
                onChange={(e) => setDraft({ ...draft, gender: e.target.value as OrderDraftT["gender"] })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-neutral-700 block mb-1">Size</label>
              <select className="border rounded-xl px-3 py-2 w-full"
                value={draft.size}
                onChange={(e) => setDraft({ ...draft, size: e.target.value as OrderDraftT["size"] })}>
                {(["XS", "S", "M", "L", "XL"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">Send Order</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const rows = [
    { label: "XS", chest: "84–88", waist: "70–74", hips: "86–90" },
    { label: "S", chest: "88–92", waist: "74–78", hips: "90–94" },
    { label: "M", chest: "92–96", waist: "78–82", hips: "94–98" },
    { label: "L", chest: "96–101", waist: "82–87", hips: "98–103" },
    { label: "XL", chest: "101–106", waist: "87–92", hips: "103–108" },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="text-lg font-bold">Cycling Jersey Size Guide (cm)</h4>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-800">Close</button>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-600 border-b">
                <th className="py-2 pr-4">Size</th>
                <th className="py-2 pr-4">Chest</th>
                <th className="py-2 pr-4">Waist</th>
                <th className="py-2 pr-4">Hips</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.label} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-semibold">{r.label}</td>
                  <td className="py-2 pr-4">{r.chest} cm</td>
                  <td className="py-2 pr-4">{r.waist} cm</td>
                  <td className="py-2 pr-4">{r.hips} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-neutral-500 mt-3">Tip: Jerseys are race-cut. If between sizes or prefer a relaxed fit, choose one size up.</p>
        </div>
      </div>
    </div>
  );
}

function startOfNextDay(d: Date) { const x = new Date(d); x.setHours(24, 0, 0, 0); return x; }
function isExpired(whenISO: string) { const event = new Date(whenISO); return new Date() >= startOfNextDay(event); }
function formatEn(dt: string) { const d = new Date(dt); return d.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }

function PartnerFinder() {
  const [posts, setPosts] = useState<PartnerPost[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [whenLocal, setWhenLocal] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchUpcomingPartners();
        if (!alive) return;

        const mapped: PartnerPost[] = (data || []).map((p: PartnerPostDTO) => ({
          id: p.id,
          name: p.name,
          whenISO: p.when,
          address: p.address || "",
          pace: typeof p.pace === "number" ? p.pace : undefined,
          note: p.note || "",
          track: p.track ? {
            fileUrl: p.track.storageUrl || "",
            distanceKm: p.track.distanceKm,
            elevationGainM: p.track.elevationGainM,
            svgPath: p.track.svgPath || "",
          } : null
        }));

        setPosts(mapped);
      } catch {
        // silent
      }
    })();

    return () => { alive = false; };
  }, []);

  const now = new Date();
  const upcoming = posts
    .filter(p => !isExpired(p.whenISO) && new Date(p.whenISO) >= now)
    .sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime());

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const f = new FormData(form);

    const file = f.get("track") as File | null;
    let trackId: string | null = null;
    let localTrackPreview: PartnerTrack | null = null;

    if (file && file.size) {
      const parsed = await parseGPX(file);
      const [minLat, minLon, maxLat, maxLon] = parsed.bbox;
      const w = 600, h = 300;

      const svgPath = parsed.coords.map(([lat, lon]) => {
        const x = ((lon - minLon) / (maxLon - minLon || 1)) * w;
        const y = h - ((lat - minLat) / (maxLat - minLat || 1)) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");

      const up = await uploadGpx(file);

      const createdTrack: TrackDTO = await createTrack({
        title: file.name.replace(/\.(gpx|tcx)$/i, ""),
        storageUrl: `${apiBase()}${up.downloadUrl}`,
        distanceKm: parsed.distanceKm,
        elevationGainM: parsed.elevationGainM,
        svgPath,
      });

      trackId = createdTrack.id;

      localTrackPreview = {
        fileUrl: createdTrack.storageUrl || "",
        distanceKm: createdTrack.distanceKm,
        elevationGainM: createdTrack.elevationGainM,
        svgPath: createdTrack.svgPath || svgPath,
      };
    }

    const whenISO = whenLocal || String(f.get("when"));
    const paceVal = Number(f.get("pace") || NaN);

    try {
      const createdPost = await createPartnerPost({
        name: String(f.get("name") || "Rider"),
        whenISO,
        address: String(f.get("address") || ""),
        pace: Number.isFinite(paceVal) ? paceVal : undefined,
        note: String(f.get("note") || ""),
        trackId,
      });

      const newPost: PartnerPost = {
        id: createdPost.id,
        name: createdPost.name,
        whenISO: createdPost.when,
        address: createdPost.address || "",
        pace: typeof createdPost.pace === "number" ? createdPost.pace : undefined,
        note: createdPost.note || "",
        track: localTrackPreview || (createdPost.track ? {
          fileUrl: createdPost.track.storageUrl || "",
          distanceKm: createdPost.track.distanceKm,
          elevationGainM: createdPost.track.elevationGainM,
          svgPath: createdPost.track.svgPath || "",
        } : null),
      };

      setPosts((x) => [newPost, ...x]);
      form.reset();
      setWhenLocal("");
      setShowPicker(false);
    } catch (err: any) {
      alert(err?.message || "Failed to post");
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle><Users className="inline w-5 h-5 mr-2 text-red-600" />Partner Finder</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid md:grid-cols-2 gap-3">
            <input name="name" className="border rounded-xl px-3 py-2" placeholder="Your name" required />
            <div className="relative">
              <input name="pace" type="number" step="0.5" min="5" max="60" className="w-full border rounded-xl px-3 py-2 pr-16" placeholder="Pace" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">km/h</span>
            </div>
            <div className="md:col-span-2">
              {!showPicker ? (
                <input type="text" placeholder="Start time (yyyy-mm-dd hh:mm)" className="w-full border rounded-xl px-3 py-2" onFocus={() => setShowPicker(true)} />
              ) : (
                <input name="when" type="datetime-local" lang="en-GB" step={60} className="w-full border rounded-xl px-3 py-2" value={whenLocal} onChange={(e) => setWhenLocal(e.target.value)} required />
              )}
            </div>
            <input name="address" className="border rounded-xl px-3 py-2 md:col-span-2" placeholder="Start address" />
            <textarea name="note" rows={4} className="border rounded-xl px-3 py-2 md:col-span-2" placeholder="Route description (e.g., Calviá loop, Sóller hairpins…)" />
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-neutral-700">Track (GPX)</span>
                <FileInputEn name="track" accept=".gpx" inline buttonText="Choose File" noFileText="No file chosen" />
              </div>
              <span className="text-xs text-neutral-500 block mt-1">Your route preview will appear once you publish your ride.</span>
            </div>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 md:col-span-2">Post</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Upcoming rides</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 && <div className="text-sm text-neutral-500">No upcoming posts yet. Create one to get started.</div>}
          <div className="space-y-3">
            {upcoming.map((p) => (
              <div key={p.id} className="border rounded-xl p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-neutral-500">{formatEn(p.whenISO)}</div>
                </div>
                <div className="text-sm text-neutral-600">Start: {p.address || "—"} • {typeof p.pace === 'number' ? `${p.pace} km/h` : "any pace"}</div>
                {p.note && <div className="text-sm text-neutral-500">{p.note}</div>}
                {p.track && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="rounded-lg border bg-neutral-50 px-2 py-1 flex items-center gap-2 text-neutral-700">
                      <svg viewBox="0 0 600 300" className="w-40 h-10">
                        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={p.track.svgPath} />
                      </svg>
                      <div className="text-xs whitespace-nowrap">{km(p.track.distanceKm)} • +{p.track.elevationGainM} m</div>
                    </div>
                    {p.track.fileUrl ? (
                      <a href={p.track.fileUrl} download className="text-xs text-red-600 underline">Download GPX</a>
                    ) : (
                      <span className="text-xs text-neutral-400">Download GPX</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrackShare() {
  const [tracks, setTracks] = useState<TrackCard[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchTracks();
        if (!alive) return;

        const mapped: TrackCard[] = (data || []).map((t: TrackDTO) => ({
          id: t.id,
          title: t.title,
          fileUrl: t.storageUrl || "",
          distanceKm: t.distanceKm,
          elevationGainM: t.elevationGainM,
          bbox: [0, 0, 0, 0] as const,
          svgPath: t.svgPath || "",
        }));

        setTracks(mapped);
      } catch {
        // silent
      }
    })();

    return () => { alive = false; };
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const parsed = await parseGPX(f);
    const [minLat, minLon, maxLat, maxLon] = parsed.bbox;
    const w = 600, h = 300;

    const path = parsed.coords.map(([lat, lon]) => {
      const x = ((lon - minLon) / (maxLon - minLon || 1)) * w;
      const y = h - ((lat - minLat) / (maxLat - minLat || 1)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    try {
      const up = await uploadGpx(f);

      const created = await createTrack({
        title: f.name.replace(/\.(gpx|tcx)$/i, ""),
        storageUrl: `${apiBase()}${up.downloadUrl}`,
        distanceKm: parsed.distanceKm,
        elevationGainM: parsed.elevationGainM,
        svgPath: path,
      });

      const t: TrackCard = {
        id: created.id,
        title: created.title,
        fileUrl: created.storageUrl || "",
        distanceKm: created.distanceKm,
        elevationGainM: created.elevationGainM,
        bbox: parsed.bbox,
        svgPath: created.svgPath || path,
      };

      setTracks(x => [t, ...x]);
    } catch (err: any) {
      alert(err?.message || "Track upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle><Upload className="inline w-5 h-5 mr-2 text-red-600" /> Track Share (GPX)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <FileInputEn ref={fileRef} accept=".gpx" onChange={onUpload} />
          <span className="text-xs text-neutral-500">Share your cycling route by uploading a GPX file.</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {tracks.map(t => (
            <div key={t.id} className="border rounded-xl p-3 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="font-semibold truncate pr-3">{t.title}</div>
                {t.fileUrl ? (
                  <a href={t.fileUrl} download className="text-sm text-red-600 underline">Download</a>
                ) : (
                  <span className="text-sm text-neutral-400">Download</span>
                )}
              </div>

              <div className="text-sm text-neutral-600">{km(t.distanceKm)} • +{t.elevationGainM} m</div>

              <svg viewBox="0 0 600 300" className="w-full h-36 mt-2 bg-white rounded">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" points={t.svgPath} />
              </svg>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IRideMallorcaPage() {
  const [orderOpen, setOrderOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [subEmail, setSubEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!subEmail.trim()) return;

    try {
      setSubLoading(true);
      await subscribeEmail(subEmail.trim());
      alert("Subscribed successfully!");
      setSubEmail("");
    } catch (err: any) {
      alert(err?.message || "Subscribe failed");
    } finally {
      setSubLoading(false);
    }
  }

  const routes = [
    { story: ROUTE_STORIES[0], name: "Sa Calobra (Coll dels Reis)", icon: <Wind className="w-5 h-5" />, blurb: "10 km of switchbacks, a legendary serpentine climb.", img: "/routes/sa-calobra.jpg" },
    { story: ROUTE_STORIES[1], name: "Cap de Formentor", icon: <MapPin className="w-5 h-5" />, blurb: "Iconic lighthouse and sweeping 360° views.", img: "/routes/formentor.jpg" },
    { story: ROUTE_STORIES[2], name: "Puig Major", icon: <Mountain className="w-5 h-5" />, blurb: "Highest peak in the Balearics — long sustained ascent.", img: "/routes/puig-major.png" },
    { story: ROUTE_STORIES[3], name: "Coll de Sóller", icon: <Bike className="w-5 h-5" />, blurb: "Classic hairpins among orange groves.", img: "/routes/coll-soller.jpeg" },
    { story: ROUTE_STORIES[5], name: "Calvià Loop", icon: <MapPin className="w-5 h-5" />, blurb: "Rolling coastal and inland roads through Calviá villages.", img: "/routes/calvia.jpg" },
    { story: ROUTE_STORIES[4], name: "Andratx → Pollença", icon: <ArrowRight className="w-5 h-5" />, blurb: "West coast traverse with panoramic sea views.", img: "/routes/andratx-pollenca.jpg" },
  ];

  const NAV_ITEMS = [
    { label: "Routes", href: "#routes", hover: "hover:bg-red-500 hover:text-white" },
    { label: "Jersey", href: "#jersey", hover: "hover:bg-yellow-400 hover:text-neutral-900" },
    { label: "Chat", href: "#chat", hover: "hover:bg-red-500 hover:text-white" },
    { label: "Partners", href: "#partners", hover: "hover:bg-yellow-400 hover:text-neutral-900" },
    { label: "Tracks", href: "#tracks", hover: "hover:bg-red-500 hover:text-white" },
    { label: "Contact", href: "#contact", hover: "hover:bg-yellow-400 hover:text-neutral-900" }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-red-50 text-neutral-900 selection:bg-yellow-300 selection:text-neutral-900">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="I Ride Mallorca logo" className="h-10 w-10 object-contain rounded-md shadow-sm" />
            <span className="font-bold tracking-wide">I Ride Mallorca - More than a Ride</span>
          </div>
          <nav className="hidden md:flex items-center gap-2 text-sm">
            {NAV_ITEMS.map((it) => (
              <a key={it.href} href={it.href} className={`px-3 py-2 rounded-md border border-transparent transition-all duration-200 ${it.hover}`}>
                {it.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-10 bg-[radial-gradient(80%_60%_at_50%_10%,#ef4444,transparent),radial-gradient(60%_40%_at_80%_70%,#f59e0b,transparent)]" />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              I Ride Mallorca
              <span className="block text-neutral-700 text-2xl md:text-3xl mt-2 font-semibold">More than a Ride</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-700">Iconic climbs, Mediterranean light, endless switchbacks. Join Mallorca’s cycling community—take home the jersey and the memories.</p>
            <div className="mt-8 flex gap-3">
              <Button className="bg-red-600 hover:bg-red-700"
                onClick={() => document.getElementById('routes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                Choose Your Route
              </Button>
              <Button variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                onClick={() => document.getElementById('jersey')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                Choose Your Jersey
              </Button>
            </div>
          </div>

          <a href="#jersey" aria-label="Explore the Mallorca jersey collection" className="group relative isolate block overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500">
            <img src="/routes/andratx-pollenca.jpg" alt="" aria-hidden="true" width={750} height={420} className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/30 via-slate-950/65 to-slate-950/95" />
            <div className="flex items-start justify-between gap-3 p-5 pb-12 sm:p-6 sm:pb-16">
              <div className="text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-300 sm:text-xs">Made for the ride</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Wear Mallorca.</h2>
                <p className="mt-2 text-xs text-white/90 sm:text-sm">Three colours. One island.</p>
              </div>
              <img src={LOGO} alt="I Ride Mallorca logo" width={56} height={56} className="h-12 w-12 shrink-0 rounded-xl shadow-lg sm:h-14 sm:w-14" />
            </div>
            <div className="px-4 pb-5 sm:px-6 sm:pb-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { key: "sunset", label: "Sunset", description: "Orange and blue" },
                  { key: "pink", label: "Pink", description: "Pink" },
                  { key: "white", label: "White", description: "White" },
                ].map((jersey) => (
                  <div key={jersey.key} className="min-w-0">
                    <div className="space-y-2 rounded-2xl bg-white/15 p-1.5 ring-1 ring-white/20 sm:p-2">
                      {["front", "back"].map((side) => (
                        <div key={side} className="overflow-hidden rounded-xl bg-white shadow-sm">
                          <img
                            src={`/jerseys/${jersey.key}-${side}.png`}
                            alt={`${jersey.description} Mallorca jersey, ${side} view`}
                            width={400}
                            height={500}
                            decoding="async"
                            className="aspect-[4/5] w-full object-contain motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">{jersey.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/20 pt-4 text-white">
                <span className="text-[10px] uppercase tracking-widest text-white/70 sm:text-xs">The Mallorca collection</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm">Explore <ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
              </div>
            </div>
          </a>
        </div>
      </section>

      <section id="routes" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold">Iconic Routes</h2>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mt-2">Six Routes. One Island. Endless Memories.</p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((r, i) => (
              <details key={r.name} className="group self-start overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md open:ring-1 open:ring-red-200">
                <summary className="cursor-pointer list-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600 [&::-webkit-details-marker]:hidden">
                  <img src={r.img} alt={r.name} width={600} height={320} loading="lazy" className="w-full h-40 object-cover" />
                  <div className="p-6 pb-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className={`${i % 2 === 0 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'} shrink-0 p-2 rounded-lg`}>{r.icon}</span>
                      <h3 className="text-lg font-semibold">{r.name}</h3>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-red-700">{r.story.subtitle}</p>
                    <p className="mt-2 leading-relaxed text-neutral-600">{r.story.tagline}</p>
                  </div>
                  <span className="flex items-center justify-between gap-3 px-6 pb-6 text-sm font-semibold text-red-700">
                    <span className="group-open:hidden">Read the full story</span>
                    <span className="hidden group-open:inline">Close story</span>
                    <span aria-hidden="true" className="text-xl leading-none group-open:hidden">+</span>
                    <span aria-hidden="true" className="hidden text-xl leading-none group-open:inline">−</span>
                  </span>
                </summary>
                <div className="border-t border-neutral-100 px-6 py-6">
                  <div className="mb-5 h-1 w-16 rounded bg-gradient-to-r from-red-500 to-yellow-400" />
                  <div className="space-y-4 text-base leading-7 text-neutral-700">
                    {r.story.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className={paragraph.startsWith("Route:") ? "rounded-xl bg-yellow-50 p-4 font-medium text-neutral-800" : undefined}>{paragraph}</p>
                    ))}
                  </div>
                  <p className="mt-6 border-l-4 border-yellow-400 pl-4 font-semibold leading-relaxed text-neutral-900">{r.story.signature}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="jersey" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div className="max-w-2xl">
            <h3 className="text-3xl font-bold">Wear the Island. Ride Your Way.</h3>
            <div className="mt-1 h-1 w-56 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
            <p className="mt-3 leading-relaxed text-neutral-600">
              Three designs, each with its own character. Celebrate your Mallorca adventure with a colourful souvenir jersey, or choose the understated style of our Pink and White designs.
            </p>
            <div className="mt-6 space-y-5">
              <div className="border-l-4 border-yellow-400 pl-4">
                <h4 className="font-semibold text-neutral-900">Sunset — Take the Memories Home</h4>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Inspired by the island's sunsets, mountains and palm-lined coast, Sunset captures the colour and spirit of Mallorca. A souvenir jersey to remember the climbs, the coastal roads and the moments that made your trip.
                </p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-neutral-900">Pink &amp; White — A More Refined Ride</h4>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Clean lines, subtle colours and a more professional cycling look. Our Pink and White jerseys bring a quieter expression of Mallorca to your cycling wardrobe — for riders who prefer understated design with a clear island identity.
                </p>
              </div>
            </div>
            <p className="mt-6 font-medium text-neutral-800">Your island. Your style. Your next ride.</p>
            <div className="mt-6 flex gap-3">
              <Button className="bg-neutral-900 hover:bg-neutral-800" onClick={() => setOrderOpen(true)}>
                <Shirt className="w-4 h-4 mr-2" />Shop Now
              </Button>
              <Button variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50" onClick={() => setSizeOpen(true)}>
                Size Guide
              </Button>
            </div>
          </div>
          <JerseySlideshow />
        </div>
      </section>

      <section id="chat" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-4">Ride Chat</h3>
          <div className="mt-1 h-1 w-20 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mb-6">Choose a room to discuss routes and plan rides with other cyclists.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RideChat room="General" />
            <RideChat room="Sa Calobra" />
            <RideChat room="Formentor" />
            <RideChat room="Calvia" />
            <RideChat room="Soller" />
            <RideChat room="Pollenca" />
          </div>
        </div>
      </section>

      <section id="partners" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-4">Partner Finder</h3>
          <div className="mt-1 h-1 w-28 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <PartnerFinder />
        </div>
      </section>

      <section id="tracks" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-4">Track Share</h3>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mb-6">Upload your favorite route so others can enjoy it too!</p>
          <TrackShare />
        </div>
      </section>

      <section id="contact" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold">Ride with us</h3>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded mx-auto"></div>
          <p className="mt-2 text-neutral-600">Drop your email for curated route packs, local tips, and jersey drops.</p>

          <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              required
              placeholder="you@domain.com"
              className="w-full sm:w-80 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-400"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              disabled={subLoading}
            />
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={subLoading}>
              <Mail className="w-4 h-4 mr-2" />
              {subLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>

          <p className="text-xs text-neutral-500 mt-3">By subscribing you agree to receive emails from I Ride Mallorca. Unsubscribe anytime.</p>
        </div>
      </section>

      <footer className="py-8 border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-600">© {new Date().getFullYear()} I Ride Mallorca — <span className="italic">More than a Ride</span></div>
          <div className="text-xs text-neutral-500">Made for cyclists visiting Mallorca. Sa Calobra • Formentor • Puig Major • Coll de Sóller • Calviá</div>
        </div>
      </footer>

      <OrderFormModal open={orderOpen} onClose={() => setOrderOpen(false)} />
      <SizeGuideModal open={sizeOpen} onClose={() => setSizeOpen(false)} />
    </main>
  );
}
