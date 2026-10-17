import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mountain, Wind, Bike, Mail, Shirt, ArrowRight, Upload, MessageCircle, Users } from "lucide-react";

import type { CommunityMessageDTO, OrderDraft as OrderDraftT, OrderProduct, TrackDTO, PartnerPostDTO } from "@/api/types";
import { fetchCommunityMessages, reportCommunityMessage, sendCommunityMessage } from "@/api/chat";
import { fetchUpcomingPartners, createPartnerPost } from "@/api/partner";
import { fetchTracks, createTrack } from "@/api/track";
import { createOrder } from "@/api/order";
import { subscribeEmail } from "@/api/subscription";

import { gpxApiBase, uploadGpx } from "@/api/gpx";

import RouteMap from "@/components/RouteMap";

import JerseySlideshow from "@/components/JerseySlideshow";

import ROUTE_STORIES from "@/data/stories.json";
import { routeGuides, products } from "@/data/content";

const LOGO = "/IRIDEMALLORCA_LOGO.jpg";

type PartnerTrack = { fileUrl: string; distanceKm: number; elevationGainM: number; svgPath?: string };
type PartnerPost = { id: string; name: string; whenISO: string; address: string; pace?: number; note?: string; track?: PartnerTrack | null };

type TrackCard = { id: string; title: string; fileUrl: string; distanceKm: number; elevationGainM: number; bbox: readonly [number, number, number, number]; svgPath?: string };


function gpxDownloadUrl(storageUrl: string) {
  // Use the existing same-origin proxy for both old and newly uploaded tracks.
  return storageUrl
    .replace(
      /^https?:\/\/iridemallorca-d6e5h4f5bvdah4hs\.westeurope-01\.azurewebsites\.net(?=\/gpx\/download\/)/i,
      "/gpx-api"
    )
    .replace(/^\/gpx\/download\//, "/gpx-api/gpx/download/");
}

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
  if (doc.querySelector("parsererror") || doc.documentElement.tagName.toLowerCase() !== "gpx") {
    throw new Error("Please choose a valid GPX file.");
  }

  const trackPoints = Array.from(doc.getElementsByTagName("trkpt"));
  const points = trackPoints.length ? trackPoints : Array.from(doc.getElementsByTagName("rtept"));
  const coords = points.map((p: any) => [
    parseFloat(p.getAttribute("lat")),
    parseFloat(p.getAttribute("lon")),
    p.getElementsByTagName("ele")[0]?.textContent ? parseFloat(p.getElementsByTagName("ele")[0].textContent!) : 0,
  ] as [number, number, number]).filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));

  if (coords.length < 2) {
    throw new Error("This GPX file needs at least two route points.");
  }

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

const COMMUNITY_SESSION_KEY = "irm_community_session_v1";

function communitySessionId() {
  const stored = loadLS<string>(COMMUNITY_SESSION_KEY, "");
  if (/^[a-z0-9_-]{8,64}$/i.test(stored)) return stored;
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : `rider${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  saveLS(COMMUNITY_SESSION_KEY, id);
  return id;
}

function CommunityChat() {
  const [messages, setMessages] = useState<CommunityMessageDTO[]>([]);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSessionId(communitySessionId());
    let alive = true;

    async function load() {
      try {
        const data = await fetchCommunityMessages(100);
        if (!alive) return;
        setMessages(data || []);
        setStatus("");
      } catch (error: any) {
        if (alive) setStatus(error?.message || "Chat is temporarily unavailable. Please try again shortly.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 10000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  async function send() {
    if (!text.trim() || !sessionId || sending) return;
    setStatus("");
    setSending(true);

    try {
      const created = await sendCommunityMessage({ sessionId, content: text.trim() });
      setMessages((current) => [...current, created].slice(-100));
      setText("");
      setStatus("Message shared with the community.");
    } catch (e: any) {
      setStatus(e?.message || "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function report(id: string) {
    if (!sessionId) return;
    setStatus("");
    try {
      const result = await reportCommunityMessage(id, { sessionId, reason: "Community member report" });
      if (result.hidden) setMessages((current) => current.filter((message) => message.id !== id));
      setStatus(result.hidden ? "Thanks — the reported message has been removed." : "Thanks — your report has been recorded.");
    } catch (error: any) {
      setStatus(error?.message || "The report could not be sent.");
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center gap-2">
        <MessageCircle className="w-5 h-5 text-red-600" />
        <CardTitle className="text-base md:text-lg">Mallorca Cycling Community Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-neutral-700">
          <strong className="text-neutral-900">Ride kindly and safely.</strong> This is a public community chat. Your browser is given a neutral rider name; do not share personal contact details, addresses, payment details or links. Spam, abuse and unsafe content are blocked or removed. <a className="font-semibold text-red-700 underline" href="/community-guidelines/">Read the community guidelines</a>.
        </div>
        <div className="h-[26rem] rounded-xl border bg-white overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-4 bg-neutral-50 text-sm" aria-live="polite">
            {loading ? <div className="text-neutral-500">Loading the conversation…</div> : messages.length === 0 ? (
              <div className="text-neutral-500">Be the first rider to start the conversation. 🚴</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="border-b border-neutral-200 py-3 last:border-0">
                  <div className="flex items-baseline justify-between gap-3"><div><b className="text-neutral-800">{m.user}</b><span className="ml-2 text-xs text-neutral-400">{new Date(m.ts).toLocaleString()}</span></div><button type="button" onClick={() => report(m.id)} className="shrink-0 text-xs font-semibold text-red-700 underline">Report</button></div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-neutral-700">{m.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t p-3 flex gap-2 bg-neutral-100">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={360}
              placeholder="Share a route tip, ride plan or question…"
              aria-label="Message"
            />
            <Button type="submit" disabled={!sessionId || !text.trim() || sending} className="bg-red-600 hover:bg-red-700 px-4 py-2 text-sm">{sending ? "Sending…" : "Send"}</Button>
          </form>
        </div>
        <p className={`mt-3 min-h-5 text-sm ${status.includes("could not") || status.includes("unavailable") ? "text-red-700" : "text-neutral-600"}`}>{status}</p>
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

export function OrderFormModal({ open, onClose, product }: { open: boolean; onClose: () => void; product: OrderProduct }) {
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

  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

    setSending(true);
    setSubmitError("");
    try {
      await createOrder(payload, product);
      localStorage.removeItem(LS_ORDER_DRAFT);
      window.location.assign("/order-confirmed/");
    } catch (e: any) {
      setSubmitError(e?.message || "Your order request could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const shippingDisabled = draft.shippingSameAsBuyer;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="text-lg font-bold">Send a jersey order request</h4>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-800">Close</button>
        </div>

        <form onSubmit={submitOrder} className="p-4 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 rounded-xl bg-yellow-50 p-3 text-sm text-neutral-800"><strong>{product.name}</strong> · {product.colour} · €{product.price.toFixed(2)}</div>
          <p className="md:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700">This is an order request, not a payment or a final order. We’ll contact you personally by email to confirm availability, size, delivery options, the final total and payment.</p>
          <div className="md:col-span-2 font-semibold text-neutral-700">Buyer</div>

          <input required name="buyerName" placeholder="Full name" className="border rounded-xl px-3 py-2"
            value={draft.buyerName} onChange={(e) => setDraft({ ...draft, buyerName: e.target.value })} />

          <input required name="buyerEmail" type="email" placeholder="Email" className="border rounded-xl px-3 py-2"
            value={draft.buyerEmail} onChange={(e) => setDraft({ ...draft, buyerEmail: e.target.value })} />

          <input required name="buyerAddress" placeholder="Address" className="border rounded-xl px-3 py-2 md:col-span-2"
            value={draft.buyerAddress} onChange={(e) => setDraft({ ...draft, buyerAddress: e.target.value })} />

          <div className="md:col-span-2 font-semibold text-neutral-700 mt-2">Shipping</div>

          <label className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="h-4 w-4 accent-red-600"
              checked={draft.shippingSameAsBuyer}
              onChange={(e) => setDraft({ ...draft, shippingSameAsBuyer: e.target.checked })} />
            Shipping address is same as buyer
          </label>

          <input required name="shippingName" placeholder="Shipping name"
            className={`border rounded-xl px-3 py-2 ${shippingDisabled ? "bg-neutral-100 text-neutral-500" : ""}`}
            value={draft.shippingName}
            onChange={(e) => setDraft({ ...draft, shippingName: e.target.value })}
            disabled={shippingDisabled} />

          <input required name="shippingAddress" placeholder="Shipping address"
            className={`border rounded-xl px-3 py-2 ${shippingDisabled ? "bg-neutral-100 text-neutral-500" : ""}`}
            value={draft.shippingAddress}
            onChange={(e) => setDraft({ ...draft, shippingAddress: e.target.value })}
            disabled={shippingDisabled} />

          <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-sm text-neutral-700 block mb-1">Gender</label>
              <select name="gender" className="border rounded-xl px-3 py-2 w-full"
                value={draft.gender}
                onChange={(e) => setDraft({ ...draft, gender: e.target.value as OrderDraftT["gender"] })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-neutral-700 block mb-1">Size</label>
              <select name="size" className="border rounded-xl px-3 py-2 w-full"
                value={draft.size}
                onChange={(e) => setDraft({ ...draft, size: e.target.value as OrderDraftT["size"] })}>
                {(["XS", "S", "M", "L", "XL"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {submitError && <p role="alert" className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">{submitError}</p>}
          <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={sending}>{sending ? "Sending request…" : "Send order request"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        storageUrl: `${gpxApiBase()}${up.downloadUrl}`,
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
                  <div className="mt-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span>{km(p.track.distanceKm)} • +{p.track.elevationGainM} m</span>
                      {p.track.fileUrl && <a href={gpxDownloadUrl(p.track.fileUrl)} download className="text-red-600 underline">Download GPX</a>}
                    </div>
                    {p.track.fileUrl && <RouteMap url={gpxDownloadUrl(p.track.fileUrl)} title="Planned ride" />}
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
  const [query, setQuery] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const matchingTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return tracks;
    return tracks.filter((track) => track.title.toLocaleLowerCase().includes(normalizedQuery));
  }, [query, tracks]);

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

    setUploadError("");
    if (!/\.gpx$/i.test(f.name)) {
      setUploadError("Please choose a GPX file (.gpx). Other GPS formats are not supported yet.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setUploadError("The GPX file must be smaller than 10 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      const parsed = await parseGPX(f);
      const [minLat, minLon, maxLat, maxLon] = parsed.bbox;
      const w = 600, h = 300;
      const path = parsed.coords.map(([lat, lon]) => {
        const x = ((lon - minLon) / (maxLon - minLon || 1)) * w;
        const y = h - ((lat - minLat) / (maxLat - minLat || 1)) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      const up = await uploadGpx(f);

      const created = await createTrack({
        title: f.name.replace(/\.(gpx|tcx)$/i, ""),
        storageUrl: `${gpxApiBase()}${up.downloadUrl}`,
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
      setUploadError(err?.message || "The route could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle><Upload className="inline w-5 h-5 mr-2 text-red-600" /> Share a route with the community</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FileInputEn ref={fileRef} accept=".gpx,application/gpx+xml" onChange={onUpload} buttonText={uploading ? "Uploading…" : "Upload GPS file"} />
          <span className="text-sm text-neutral-600">Share your favorite cycling route by uploading a GPS file. GPX files up to 10 MB are supported.</span>
        </div>
        {uploadError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{uploadError}</p>}

        <label className="mt-6 block">
          <span className="sr-only">Search shared routes</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shared routes"
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />
        </label>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {matchingTracks.map(t => (
            <div key={t.id} className="border rounded-xl p-3 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="font-semibold truncate pr-3">{t.title}</div>
                {t.fileUrl ? (
                  <a href={gpxDownloadUrl(t.fileUrl)} download className="text-sm text-red-600 underline">Download</a>
                ) : (
                  <span className="text-sm text-neutral-400">Download</span>
                )}
              </div>

              <div className="text-sm text-neutral-600">{km(t.distanceKm)} • +{t.elevationGainM} m</div>

              {t.fileUrl && <RouteMap url={gpxDownloadUrl(t.fileUrl)} title={t.title} />}
            </div>
          ))}
        </div>
        {tracks.length === 0 && <p className="mt-4 rounded-xl bg-yellow-50 p-4 text-sm text-neutral-700">Be the first to add a route and help fellow riders discover Mallorca.</p>}
        {tracks.length > 0 && matchingTracks.length === 0 && <p className="mt-4 text-sm text-neutral-600">No shared routes match that search yet.</p>}
      </CardContent>
    </Card>
  );
}

export default function IRideMallorcaPage() {
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct | null>(null);
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
    { story: ROUTE_STORIES[0], name: "Sa Calobra (Coll dels Reis)", icon: <Wind className="w-5 h-5" />, blurb: "10 km of switchbacks, a legendary serpentine climb.", img: "/routes/sa-calobra.webp", gpx: "/routes/gpx/sa-calobra.gpx", schematic: false },
    { story: ROUTE_STORIES[1], name: "Cap de Formentor", icon: <MapPin className="w-5 h-5" />, blurb: "Iconic lighthouse and sweeping 360° views.", img: "/routes/formentor.webp", gpx: "/routes/gpx/cap-de-formentor.gpx", schematic: false },
    { story: ROUTE_STORIES[2], name: "Puig Major", icon: <Mountain className="w-5 h-5" />, blurb: "Highest peak in the Balearics — long sustained ascent.", img: "/routes/puig-major.webp", gpx: "/routes/gpx/puig-major.gpx", schematic: false },
    { story: ROUTE_STORIES[3], name: "Coll de Sóller", icon: <Bike className="w-5 h-5" />, blurb: "Classic hairpins, climbed and descended from Port de Sóller.", img: "/routes/coll-soller.webp", gpx: "/routes/gpx/coll-de-soller.gpx", schematic: false },
    { story: ROUTE_STORIES[4], name: "Andratx → Port de Pollença", icon: <ArrowRight className="w-5 h-5" />, blurb: "West coast traverse with panoramic sea views.", img: "/routes/andratx-pollenca.webp", gpx: "/routes/gpx/andratx-pollenca.gpx", schematic: false },
    { story: ROUTE_STORIES[5], name: "Calvià Loop", icon: <MapPin className="w-5 h-5" />, blurb: "Rolling coastal and inland roads through Calviá villages.", img: "/routes/calvia.webp", gpx: "/routes/gpx/calvia-loop.gpx", schematic: false },
  ];

  const moreRoutes = [
    {
      name: "Mallorca 312 — Alcúdia Loop",
      facts: "313.2 km · approx. +4,724 m · Alcúdia loop · 2025 event route",
      gpx: "/routes/gpx/mallorca-312-2025.gpx",
      source: "Official Mallorca 312 route",
      sourceUrl: "https://mallorca312.com/en/mallorca-312/",
    },
    {
      name: "Orient Loop — Can Pastilla",
      facts: "91.9 km · approx. +1,496 m · Can Pastilla – Orient – Can Pastilla",
      gpx: "/routes/gpx/orient-loop.gpx",
      source: "Mallorca Cycling Center route",
      sourceUrl: "https://www.mallorcacyclingcenter.com/en/route/9-orient/",
    },
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
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-2 text-sm">
            {NAV_ITEMS.map((it) => (
              <a key={it.href} href={it.href} className={`px-3 py-2 rounded-md border border-transparent transition-all duration-200 ${it.hover}`}>
                {it.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <nav aria-label="Mobile navigation" className="flex flex-wrap gap-5 border-b bg-white px-4 py-3 text-sm font-medium md:hidden"><a href="/routes/">Cycling routes</a><a href="/jerseys/">Cycling jerseys</a><a href="/about/">About</a></nav>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-10 bg-[radial-gradient(80%_60%_at_50%_10%,#ef4444,transparent),radial-gradient(60%_40%_at_80%_70%,#f59e0b,transparent)]" />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Mallorca Cycling Routes &amp; Jerseys
              <span className="block text-neutral-700 text-2xl md:text-3xl mt-2 font-semibold">More than a Ride</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-700">Explore six Mallorca road cycling routes with GPX downloads, route maps and practical planning notes. Discover Sa Calobra, Cap de Formentor and the Serra de Tramuntana, then take the memories home with an I Ride Mallorca cycling jersey.</p>
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
            <img src="/routes/andratx-pollenca.webp" alt="" aria-hidden="true" width={750} height={420} className="absolute inset-0 -z-20 h-full w-full object-cover" />
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
                            src={`/jerseys/${jersey.key}-${side}.webp`}
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
          <h2 className="text-3xl md:text-4xl font-bold">Iconic Mallorca Cycling Routes</h2>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mt-2">Six routes. One island. Compare the routes, check the GPX details and choose your next ride.</p>

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
                    <p className="mt-2 leading-relaxed text-neutral-600">{routeGuides[i].summary}</p>
                  </div>
                  <span className="flex items-center justify-between gap-3 px-6 pb-6 text-sm font-semibold text-red-700">
                    <span className="group-open:hidden">Read the full story</span>
                    <span className="hidden group-open:inline">Close story</span>
                    <span aria-hidden="true" className="text-xl leading-none group-open:hidden">+</span>
                    <span aria-hidden="true" className="hidden text-xl leading-none group-open:inline">−</span>
                  </span>
                </summary>
                <div className="border-t border-neutral-100 px-6 py-6">
                  <div className="mb-6 space-y-3">
                    <a href={`/routes/${routeGuides[i].slug}/`} className="block font-semibold text-red-700 underline">{routeGuides[i].name}: route guide &amp; GPX details</a>
                    <a href={r.gpx} download className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Download GPX</a>
                    {r.schematic ? <p className="text-sm text-amber-800">Schematic GPX: 16 points only; this file does not follow the road bends and is not suitable for turn-by-turn navigation. Source: Mallorca Cycling Lab (CC BY 4.0).</p> : <RouteMap url={r.gpx} title={r.name} />}
                    {i === 0 && <div className="text-sm text-neutral-600"><a href="/routes/gpx/sa-calobra-ascent-waypoints.gpx" download className="text-red-700 underline">Download ascent-only waypoints</a><p>This alternative contains only 3 waypoints, not a detailed road track. Use the main GPX for the full climb.</p></div>}
                  </div>
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

          <section className="mt-12 border-t border-neutral-200 pt-10" aria-labelledby="more-mallorca-routes">
            <h2 id="more-mallorca-routes" className="text-2xl font-bold">More Mallorca Road Cycling Routes &amp; GPX Downloads</h2>
            <p className="mt-2 text-neutral-600">Free GPX files for longer Mallorca road bike rides.</p>
            <ul className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-200">
              {moreRoutes.map((route) => (
                <li key={route.gpx} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{route.name}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{route.facts}</p>
                    <a href={route.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-neutral-500 underline underline-offset-2">Source: {route.source}</a>
                  </div>
                  <a href={route.gpx} download className="inline-flex shrink-0 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Download GPX</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section id="jersey" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">Mallorca Cycling Jerseys — Wear the Island.</h2>
            <div className="mt-1 h-1 w-56 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
            <p className="mt-3 leading-relaxed text-neutral-600">
              Three designs, each with its own character. Celebrate your Mallorca adventure with a colourful souvenir jersey, or choose the understated style of our Pink and White designs.
            </p>
            <div className="mt-6 space-y-5">
              <div className="border-l-4 border-yellow-400 pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold text-neutral-900">Sunset — Take the Memories Home</h4><span className="font-bold text-neutral-900">€64.50</span></div>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Inspired by the island's sunsets, mountains and palm-lined coast, Sunset captures the colour and spirit of Mallorca. A souvenir jersey to remember the climbs, the coastal roads and the moments that made your trip.
                </p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold text-neutral-900">Pink &amp; White — A More Refined Ride</h4><span className="font-bold text-neutral-900">€87.90</span></div>
                <p className="mt-2 leading-relaxed text-neutral-600">
                  Clean lines, subtle colours and a more professional cycling look. Our Pink and White jerseys bring a quieter expression of Mallorca to your cycling wardrobe — for riders who prefer understated design with a clear island identity.
                </p>
              </div>
            </div>
            <p className="mt-6 font-medium text-neutral-800">Your island. Your style. Your next ride.</p>
            <div className="mt-6 flex gap-3">
              <Button className="bg-neutral-900 hover:bg-neutral-800" onClick={() => { window.location.href = "/jerseys/"; }}>
                <Shirt className="w-4 h-4 mr-2" />Explore Jerseys
              </Button>
              <Button variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50" onClick={() => setSizeOpen(true)}>
                Size Guide
              </Button>
            </div>
          </div>
          <JerseySlideshow />
          <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
            {products.map(product => <article key={product.slug} className="rounded-xl border bg-white p-5 hover:border-red-500"><a href={`/jerseys/${product.slug}/`}><h3 className="font-semibold">{product.name}</h3><p className="mt-2 text-neutral-600">{product.description}</p><p className="mt-3 font-semibold">€{product.price.toFixed(2)} · View jersey</p></a><button type="button" onClick={() => setSelectedProduct(product)} className="mt-4 text-sm font-semibold text-red-700 underline">Send order request</button></article>)}
          </div>
        </div>
      </section>

      <section id="chat" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Mallorca Cycling Community</h2>
          <div className="mt-1 h-1 w-20 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="max-w-3xl text-neutral-600 mb-6">Plan rides, exchange local route knowledge and meet fellow cyclists in one shared Mallorca conversation.</p>
          <CommunityChat />
        </div>
      </section>

      <section id="partners" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Partner Finder</h2>
          <div className="mt-1 h-1 w-28 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <PartnerFinder />
        </div>
      </section>

      <section id="tracks" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Track Share</h2>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-red-500 to-yellow-400 rounded"></div>
          <p className="text-neutral-600 mb-6">A shared library for the Mallorca cycling community. Find a route from another rider or add the roads you loved.</p>
          <TrackShare />
        </div>
      </section>

      <section id="contact" className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ride with us</h2>
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
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-600"><a href="/routes/">Cycling routes</a><a href="/jerseys/">Cycling jerseys</a><a href="/about/">About</a><a href="/legal/">Legal</a><a href="/privacy/">Privacy</a><a href="/cookies/">Cookies</a><a href="/ordering/">Ordering &amp; returns</a><a href="/community-guidelines/">Community guidelines</a></nav>
        </div>
      </footer>

      {selectedProduct && <OrderFormModal open onClose={() => setSelectedProduct(null)} product={selectedProduct} />}
      <SizeGuideModal open={sizeOpen} onClose={() => setSizeOpen(false)} />
    </main>
  );
}
