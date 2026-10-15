import { useEffect, useRef, useState } from "react";

let leafletPromise: Promise<any> | undefined;
function loadLeaflet(): Promise<any> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    css.crossOrigin = "";
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    let cssReady = false;
    let jsReady = false;
    const timer = window.setTimeout(fail, 20000);
    function fail() {
      window.clearTimeout(timer);
      css.remove();
      script.remove();
      leafletPromise = undefined;
      reject(new Error("Map library could not load."));
    }
    function ready() {
      if (cssReady && jsReady) {
        window.clearTimeout(timer);
        resolve((window as any).L);
      }
    }
    css.onload = () => { cssReady = true; ready(); };
    script.onload = () => { jsReady = true; ready(); };
    css.onerror = script.onerror = fail;
    document.head.append(css, script);
  });
  return leafletPromise;
}

type Point = [number, number];
function readSegments(xml: string): Point[][] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length || doc.documentElement.localName !== "gpx") {
    throw new Error("Invalid GPX.");
  }
  const elements = (root: Document | Element, name: string) =>
    Array.from(root.getElementsByTagNameNS("*", name));
  const tracks = elements(doc, "trkseg");
  const groups = tracks.length ? tracks : elements(doc, "rte");
  const pointName = tracks.length ? "trkpt" : "rtept";
  const segments = groups.map(group => {
    const points: Point[] = [];
    for (const node of elements(group, pointName)) {
      const lat = node.getAttribute("lat");
      const lon = node.getAttribute("lon");
      if (lat === null || lon === null || !lat.trim() || !lon.trim()) continue;
      const a = Number(lat), b = Number(lon);
      if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        points.push([a, b]);
      }
    }
    return points;
  }).filter(points => points.length >= 2);
  if (!segments.length) throw new Error("No route coordinates.");
  return segments;
}

export default function RouteMap({ url, title = "Cycling route" }: { url: string; title?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const fit = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading route map…");
  const [error, setError] = useState(false);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !container.current || !url) return;
    let disposed = false;
    let map: any;
    let resize: ResizeObserver | undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    setError(false);
    setTileError(false);
    setStatus("Loading route map…");
    (async () => {
      try {
        const [L, response] = await Promise.all([
          loadLeaflet(),
          fetch(url, { signal: controller.signal, credentials: "omit" }),
        ]);
        if (!response.ok) throw new Error("Route unavailable.");
        const segments = readSegments(await response.text());
        if (disposed || !container.current) return;
        map = L.map(container.current, { scrollWheelZoom: false });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).on("tileerror", () => { if (!disposed) setTileError(true); }).addTo(map);
        L.polyline(segments, { color: "#ffffff", weight: 7, opacity: 0.9, interactive: false }).addTo(map);
        const route = L.polyline(segments, { color: "#dc2626", weight: 4, opacity: 1 }).addTo(map);
        const start = segments[0][0];
        const last = segments[segments.length - 1];
        const finish = last[last.length - 1];
        L.circleMarker(start, { radius: 9, color: "#ffffff", weight: 2, fillColor: "#15803d", fillOpacity: 1 })
          .addTo(map).bindTooltip("Start");
        L.circleMarker(finish, { radius: 5, color: "#ffffff", weight: 2, fillColor: "#111827", fillOpacity: 1 })
          .addTo(map).bindTooltip("Finish");
        fit.current = () => map.fitBounds(route.getBounds(), { padding: [24, 24], maxZoom: 15 });
        fit.current();
        resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resize.observe(container.current);
        setStatus("");
      } catch {
        if (!disposed) {
          map?.remove();
          map = undefined;
          fit.current = null;
          setError(true);
          setStatus("The map could not load. You can still download the GPX.");
        }
      } finally {
        window.clearTimeout(timer);
      }
    })();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller.abort();
      resize?.disconnect();
      fit.current = null;
      map?.remove();
    };
  }, [url, visible, attempt]);

  return (
    <div className="mt-3">
      <div className="relative isolate overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
        <div ref={container} role="region" aria-label={title + " interactive route map"} style={{ height: 300, width: "100%", zIndex: 0 }} />
        {status && <div role={error ? "alert" : "status"} className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-100 p-5 text-center text-sm text-neutral-600">
          <span>{status}</span>
          {error && <button type="button" onClick={() => setAttempt(value => value + 1)} className="rounded-lg border bg-white px-4 py-2 text-neutral-900">Retry map</button>}
        </div>}
      </div>
      {!status && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
        <span><span className="text-green-700">●</span> Start &nbsp; <span className="text-neutral-900">●</span> Finish · Drag to explore</span>
        <button type="button" onClick={() => fit.current?.()} className="rounded border px-3 py-1 hover:bg-neutral-100">Show full route</button>
      </div>}
      {tileError && <p role="status" className="mt-1 text-xs text-neutral-600">Some background tiles are unavailable. The route and GPX download remain available.</p>}
    </div>
  );
}
