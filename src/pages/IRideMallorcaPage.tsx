import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mountain, Wind, Bike, Mail, Shirt, ArrowRight, Upload, MessageCircle, Users } from "lucide-react";

const LOGO = "/IRIDEMALLORCA_LOGO.jpg";

export type ChatMsg = { room: string; user: string; content: string; ts: number };

type PartnerTrack = { fileUrl: string; distanceKm: number; elevationGainM: number; svgPath?: string };
type PartnerPost  = { id: string; name: string; whenISO: string; address: string; pace?: number; note?: string; track?: PartnerTrack | null };

type TrackCard = { id: string; title: string; fileUrl: string; distanceKm: number; elevationGainM: number; bbox: readonly [number, number, number, number]; svgPath?: string };

type OrderDraft = {
  buyerName: string; buyerEmail: string; buyerAddress: string;
  shippingName: string; shippingAddress: string;
  billingName: string; billingAddress: string;
  gender: "male" | "female"; size: "XS" | "S" | "M" | "L" | "XL";
};

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
    const d = coords[i][2] - coords[i - 1][2]; if (d > 0) gain += d;
  }
  const lats = coords.map(c => c[0]); const lons = coords.map(c => c[1]);
  const bbox = [Math.min(...lats), Math.min(...lons), Math.max(...lats), Math.max(...lons)] as const;
  return { coords, distanceKm: dist, elevationGainM: Math.round(gain), bbox };
}

const LS_TRACKS = "irm_tracks_v1";
const LS_PARTNERS = "irm_partners_v1";
const LS_ORDER_DRAFT = "irm_order_v1";

function loadLS<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function saveLS<T>(key: string, val: T) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function RideChat({ room }: { room: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const user = useMemo(() => `guest-${(Math.random() * 9999 | 0).toString(16)}`, []);
  const busRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).BroadcastChannel) return;
    busRef.current = new (window as any).BroadcastChannel("irm_chat");
    const handler = (e: MessageEvent) => {
      const m = e.data as ChatMsg;
      if (m.room === room) setMessages((x) => [...x, m]);
    };
    busRef.current.addEventListener("message", handler);
    return () => {
      try { busRef.current?.removeEventListener("message", handler); } catch {}
      try { busRef.current?.close(); } catch {}
      busRef.current = null;
    };
  }, [room]);

  function send() {
    if (!text.trim()) return;
    const m: ChatMsg = { room, user, content: text.trim(), ts: Date.now() };
    try { busRef.current?.postMessage(m); } catch {}
    setMessages((x) => [...x, m]);
    setText("");
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
  const id = useMemo(() => `f_${Math.random().toString(36).slice(2)}` , []);
  return (
    <div className={inline ? "flex items-center gap-3 text-sm" : "flex flex-col text-sm"}>
      <label htmlFor={id} className="inline-flex items-center gap-2 bg-neutral-100 border border-neutral-300 rounded-md px-3 py-2 cursor-pointer hover:bg-neutral-200 w-fit">
        {buttonText}
        <input id={id} name={name} ref={ref} type="file" accept={accept} className="hidden"
          onChange={(e) => { setFileName(e.target.files?.[0]?.name || noFileText); onChange?.(e); }} />
      </label>
      <span className={inline ? "text-neutral-600 truncate max-w-[24rem]" : "mt-1 text-neutral-600 truncate max-w-[24rem]"}>{fileName}</span>
    </div>
  );
});
FileInputEn.displayName = "FileInputEn";

function OrderFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<OrderDraft>(() => loadLS<OrderDraft>(LS_ORDER_DRAFT, {
    buyerName: "", buyerEmail: "", buyerAddress: "",
    shippingName: "", shippingAddress: "",
    billingName: "", billingAddress: "",
    gender: "male", size: "M",
  }));
  useEffect(() => { saveLS(LS_ORDER_DRAFT, draft); }, [draft]);
  if (!open) return null;

  function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    const to = "iridemallorca@gmail.com";
    const subject = encodeURIComponent("Jersey Order — I Ride Mallorca");
    const body = encodeURIComponent(
`Buyer name: ${draft.buyerName}
Buyer email: ${draft.buyerEmail}
Buyer address: ${draft.buyerAddress}

Shipping name: ${draft.shippingName}
Shipping address: ${draft.shippingAddress}

Billing name: ${draft.billingName}
Billing address: ${draft.billingAddress}

Gender: ${draft.gender}
Size: ${draft.size}
`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="text-lg font-bold">Order Jersey</h4>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-800">Close</button>
        </div>
        <form onSubmit={submitOrder} className="p-4 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 font-semibold text-neutral-700">Buyer</div>
          <input required placeholder="Full name" className="border rounded-xl px-3 py-2" value={draft.buyerName} onChange={e=>setDraft({...draft,buyerName:e.target.value})} />
          <input required type="email" placeholder="Email" className="border rounded-xl px-3 py-2" value={draft.buyerEmail} onChange={e=>setDraft({...draft,buyerEmail:e.target.value})} />
          <input required placeholder="Address" className="border rounded-xl px-3 py-2 md:col-span-2" value={draft.buyerAddress} onChange={e=>setDraft({...draft,buyerAddress:e.target.value})} />

          <div className="md:col-span-2 font-semibold text-neutral-700 mt-2">Shipping</div>
          <input required placeholder="Shipping name" className="border rounded-xl px-3 py-2" value={draft.shippingName} onChange={e=>setDraft({...draft,shippingName:e.target.value})} />
          <input required placeholder="Shipping address" className="border rounded-xl px-3 py-2" value={draft.shippingAddress} onChange={e=>setDraft({...draft,shippingAddress:e.target.value})} />

          <div className="md:col-span-2 font-semibold text-neutral-700 mt-2">Billing</div>
          <input required placeholder="Billing name" className="border rounded-xl px-3 py-2" value={draft.billingName} onChange={e=>setDraft({...draft,billingName:e.target.value})} />
          <input required placeholder="Billing address" className="border rounded-xl px-3 py-2" value={draft.billingAddress} onChange={e=>setDraft({...draft,billingAddress:e.target.value})} />

          <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-sm text-neutral-700 block mb-1">Gender</label>
              <select className="border rounded-xl px-3 py-2 w-full" value={draft.gender} onChange={(e)=>setDraft({...draft,gender:e.target.value as OrderDraft["gender"]})}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-700 block mb-1">Size</label>
              <select className="border rounded-xl px-3 py-2 w-full" value={draft.size} onChange={(e)=>setDraft({...draft,size:e.target.value as OrderDraft["size"]})}>
                {(["XS","S","M","L","XL"] as const).map(s=> <option key={s} value={s}>{s}</option>)}
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
    { label: "S",  chest: "88–92", waist: "74–78", hips: "90–94" },
    { label: "M",  chest: "92–96", waist: "78–82", hips: "94–98" },
    { label: "L",  chest: "96–101", waist: "82–87", hips: "98–103" },
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
  const [posts, setPosts] = useState<PartnerPost[]>(() => loadLS(LS_PARTNERS, [] as PartnerPost[]));
  const [showPicker, setShowPicker] = useState(false);
  const [whenLocal, setWhenLocal] = useState("");

  useEffect(() => {
    const fresh = posts.filter(p => !isExpired(p.whenISO));
    if (fresh.length !== posts.length) { setPosts(fresh); saveLS(LS_PARTNERS, fresh); } else { saveLS(LS_PARTNERS, posts); }
  }, [posts]);

  const now = new Date();
  const upcoming = posts
    .filter(p => !isExpired(p.whenISO) && new Date(p.whenISO) >= now)
    .sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime());

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const f = new FormData(form);
    const file = f.get("track") as File | null;
    let track: PartnerTrack | null = null;
    if (file && file.size) {
      const parsed = await parseGPX(file);
      const [minLat, minLon, maxLat, maxLon] = parsed.bbox;
      const w = 160, h = 64;
      const svgPath = parsed.coords.map(([lat, lon]) => {
        const x = ((lon - minLon) / (maxLon - minLon || 1)) * w;
        const y = h - ((lat - minLat) / (maxLat - minLat || 1)) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      track = { fileUrl: URL.createObjectURL(file), distanceKm: parsed.distanceKm, elevationGainM: parsed.elevationGainM, svgPath };
    }
    const whenISO = whenLocal || String(f.get("when"));
    const paceVal = Number(f.get("pace") || NaN);
    const p: PartnerPost = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
      name: String(f.get("name") || "Rider"),
      whenISO,
      address: String(f.get("address") || ""),
      pace: Number.isFinite(paceVal) ? paceVal : undefined,
      note: String(f.get("note") || ""),
      track,
    };
    setPosts(x => [p, ...x]);
    form.reset(); setWhenLocal(""); setShowPicker(false);
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
              <span className="text-xs text-neutral-500 block mt-1">preview appears after posting</span>
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
                      <svg viewBox="0 0 160 64" className="w-40 h-10">
                        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={p.track.svgPath} />
                      </svg>
                      <div className="text-xs whitespace-nowrap">{km(p.track.distanceKm)} • +{p.track.elevationGainM} m</div>
                    </div>
                    <a href={p.track.fileUrl} download className="text-xs text-red-600 underline">Download GPX</a>
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
  const [tracks, setTracks] = useState<TrackCard[]>(() => loadLS(LS_TRACKS, [] as TrackCard[]));
  const fileRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => saveLS(LS_TRACKS, tracks), [tracks]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const parsed = await parseGPX(f);
    const [minLat, minLon, maxLat, maxLon] = parsed.bbox;
    const w = 600, h = 300;
    const path = parsed.coords.map(([lat, lon]) => {
      const x = ((lon - minLon) / (maxLon - minLon || 1)) * w;
      const y = h - ((lat - minLat) / (maxLat - minLat || 1)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const t: TrackCard = {
      id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : String(Date.now()),
      title: f.name.replace(/\.(gpx|tcx)$/i, ""), fileUrl: URL.createObjectURL(f),
      distanceKm: parsed.distanceKm, elevationGainM: parsed.elevationGainM, bbox: parsed.bbox, svgPath: path,
    };
    setTracks(x => [t, ...x]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle><Upload className="inline w-5 h-5 mr-2 text-red-600" /> Track Share (GPX)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <FileInputEn ref={fileRef} accept=".gpx" onChange={onUpload} />
          <span className="text-xs text-neutral-500">Processing happens locally in your browser. We generate a download link.</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {tracks.map(t => (
            <div key={t.id} className="border rounded-xl p-3 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="font-semibold truncate pr-3">{t.title}</div>
                <a href={t.fileUrl} download className="text-sm text-red-600 underline">Download</a>
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

  const routes = [
    { name: "Sa Calobra (Coll dels Reis)", icon: <Wind className="w-5 h-5" />, blurb: "10 km of switchbacks, a legendary serpentine climb.", img: "/routes/sa-calobra.jpg" },
    { name: "Cap de Formentor", icon: <MapPin className="w-5 h-5" />, blurb: "Iconic lighthouse and sweeping 360° views.", img: "/routes/formentor.jpg" },
    { name: "Puig Major", icon: <Mountain className="w-5 h-5" />, blurb: "Highest peak in the Balearics — long sustained ascent.", img: "/routes/puig-major.png" },
    { name: "Coll de Sóller", icon: <Bike className="w-5 h-5" />, blurb: "Classic hairpins among orange groves.", img: "/routes/coll-soller.jpeg" },
    { name: "Calviá Loop", icon: <MapPin className="w-5 h-5" />, blurb: "Rolling coastal and inland roads through Calviá villages.", img: "/routes/calvia.jpg" },
    { name: "Andratx → Pollença", icon: <ArrowRight className="w-5 h-5" />, blurb: "West coast traverse with panoramic sea views.", img: "/routes/andratx-pollenca.jpg" },
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
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => document.getElementById('tracks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Choose Your Route
              </Button>
              <Button
                variant="outline"
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                onClick={() => document.getElementById('jersey')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Choose Your Jersey
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="h-3 w-16 rounded-sm bg-red-600" />
              <span className="h-3 w-16 rounded-sm bg-yellow-400" />
              <span className="h-3 w-16 rounded-sm bg-red-600" />
              <span className="text-xs text-neutral-500 ml-2"></span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl shadow-xl bg-gradient-to-br from-neutral-900 to-neutral-700 grid place-items-center text-white">
              <div className="text-center px-6">
                <div className="text-sm uppercase tracking-widest text-yellow-300">Official Mark</div>
                <img src={LOGO} alt="I Ride Mallorca logo" className="mx-auto mt-3 h-40 w-auto drop-shadow" />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 rotate-[-3deg] bg-white p-4 rounded-xl shadow border">
              <div className="text-xs font-semibold">Top Segments</div>
              <div className="text-sm">Sa Calobra • Formentor • Puig Major</div>
            </div>
          </div>
        </div>
      </section>

      <section id="routes" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold">Iconic Routes</h2>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mt-2">Pick your daily dose — from hairpins to sea-side rollers.</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((r, i) => (
              <Card key={r.name} className="rounded-2xl overflow-hidden shadow-md">
                <img src={r.img} alt={r.name} className="w-full h-40 object-cover" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className={`${i % 2 === 0 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'} p-2 rounded-lg`}>{r.icon}</div>
                  <CardTitle className="text-lg">{r.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-neutral-600">{r.blurb}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="jersey" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-3xl font-bold">Get Your Unique Jersey</h3>
            <div className="mt-1 h-1 w-56 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
            <p className="mt-3 text-neutral-600">
              Orange–Red–Grey block palette with Spanish flag cuffs. Three rear pockets, YKK zip, quick-dry fabric. UV50+ protection, cooling fabric for hot days, premium materials, and reflective stripes for safety after sunset.
            </p>
            <ul className="mt-4 text-neutral-700 list-disc pl-5 space-y-1">
              <li>Premium polyester/elastane (130–150 g/m²)</li>
              <li>Raw-cut sleeves, silicone hem</li>
              <li>Sizes S–XL</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Button className="bg-neutral-900 hover:bg-neutral-800" onClick={()=>setOrderOpen(true)}><Shirt className="w-4 h-4 mr-2" />Shop Now</Button>
              <Button variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50" onClick={()=>setSizeOpen(true)}>Size Guide</Button>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="aspect-video rounded-2xl bg-neutral-900 text-white grid place-items-center shadow-xl">
              <div className="text-center">
                <div className="uppercase text-xs tracking-widest text-yellow-300">Product Preview</div>
                <div className="text-2xl font-extrabold mt-2">I RIDE MALLORCA — Jersey</div>
                <div className="mt-2 text-xs opacity-80">(Add your mockup image here)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="chat" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-4">Ride Chat</h3>
          <div className="mt-1 h-1 w-20 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mb-6">Join themed rooms. (MVP uses in-tab BroadcastChannel realtime — open two tabs to test.)</p>
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
        <div className="max-w-6xl mx_auto px-4">
          <h3 className="text-3xl font-bold mb-4">Partner Finder</h3>
          <div className="mt-1 h-1 w-28 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <PartnerFinder />
        </div>
      </section>

      <section id="tracks" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-4">Track Share</h3>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mb-6">Upload your favorite route so others can enjoy it too! New to the island? Discover one of our top routes and experience unforgettable adventures.</p>
          <TrackShare />
        </div>
      </section>

      <section id="contact" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold">Ride with us</h3>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded mx-auto"></div>
          <p className="mt-2 text-neutral-600">Drop your email for curated route packs, local tips, and jersey drops.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <input type="email" required placeholder="you@domain.com" className="w-full sm:w-80 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-400" />
            <Button type="submit" className="bg-red-600 hover:bg-red-700"><Mail className="w-4 h-4 mr-2" />Subscribe</Button>
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

      <OrderFormModal open={orderOpen} onClose={()=>setOrderOpen(false)} />
      <SizeGuideModal open={sizeOpen} onClose={()=>setSizeOpen(false)} />
    </main>
  );
}
