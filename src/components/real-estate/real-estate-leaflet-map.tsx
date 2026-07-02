'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import {
  buildCitySearchIndex,
  dealScoreColor,
  getMapBounds,
  getMetroBySlugFromMap,
  getZipsForCity,
  searchMapLocations,
  type MapCityEntry,
  type MapMetroLite,
  type MapMetroPoint,
  type MapZipPoint,
} from '@/lib/real-estate-market/map-data';
import { formatDom, formatPct, formatUsd, formatYield } from '@/lib/real-estate-market/format';

type Theme = 'light' | 'dark';
type MapVariant = 'full' | 'embed';

type MapMetroMarker = MapMetroLite | MapMetroPoint;

function hasZips(metro: MapMetroMarker): metro is MapMetroPoint {
  return 'zips' in metro && Array.isArray(metro.zips);
}

type Props = {
  metros: MapMetroMarker[];
  theme: Theme;
  variant?: MapVariant;
  /** Pre-select a metro on load (full map). */
  initialMetroSlug?: string | null;
  /** Pre-built search index (embed / hub — avoids shipping all ZIP rows). */
  cityIndex?: MapCityEntry[];
};

const TILES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
} as const;

function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const run = () => map.invalidateSize({ animate: false });
    run();
    const t1 = window.setTimeout(run, 50);
    const t2 = window.setTimeout(run, 200);

    const el = map.getContainer().parentElement;
    const ro = el ? new ResizeObserver(() => run()) : null;
    ro?.observe(el);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
    };
  }, [map]);

  return null;
}

function FlyTo({
  center,
  zoom,
  bounds,
}: {
  center?: LatLngExpression;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
}) {
  const map = useMap();
  const prev = useRef<string>('');

  useEffect(() => {
    const key = JSON.stringify({ center, zoom, bounds });
    if (key === prev.current) return;
    prev.current = key;
    if (bounds) {
      map.flyToBounds(bounds, { padding: [48, 48], duration: 0.8 });
    } else if (center) {
      map.flyTo(center, zoom ?? 10, { duration: 0.8 });
    }
  }, [bounds, center, map, zoom]);

  return null;
}

function ZipPopupContent({ zip }: { zip: MapZipPoint }) {
  return (
    <div className="re-map-popup">
      <p className="re-map-popup-title">
        {zip.city ? `${zip.city}, ${zip.stateCode}` : `ZIP ${zip.zip}`}
      </p>
      <p className="re-map-popup-sub">ZIP {zip.zip} · {zip.metro}</p>
      <dl className="re-map-popup-grid">
        <div><dt>Median price</dt><dd>{formatUsd(zip.medianSalePrice, true)}</dd></div>
        <div><dt>Est. rent</dt><dd>{formatUsd(zip.estMonthlyRent)}/mo</dd></div>
        <div><dt>Yield</dt><dd>{formatYield(zip.grossYield)}</dd></div>
        <div><dt>Deal score</dt><dd>{zip.dealScore}</dd></div>
        <div><dt>DOM</dt><dd>{formatDom(zip.medianDom)}</dd></div>
        <div><dt>Price YoY</dt><dd>{formatPct(zip.priceYoy != null ? zip.priceYoy * 100 : null)}</dd></div>
      </dl>
      <div className="re-map-popup-actions">
        <Link href={`/real-estate/zip/${zip.zip}`} className="finance-primary-btn re-map-popup-btn">
          ZIP details
        </Link>
        <Link
          href={`/real-estate/deal-analyzer?price=${zip.medianSalePrice ?? ''}&rent=${zip.estMonthlyRent ?? ''}`}
          className="finance-secondary-btn re-map-popup-btn"
        >
          Analyze deal
        </Link>
      </div>
    </div>
  );
}

function MetroSidebar({
  metro,
  cityFilter,
  onClose,
  onSelectZip,
}: {
  metro: MapMetroPoint;
  cityFilter: string | null;
  onClose: () => void;
  onSelectZip: (zip: MapZipPoint) => void;
}) {
  const zips = useMemo(() => {
    if (cityFilter) return getZipsForCity(metro, cityFilter);
    return [...metro.zips].sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0));
  }, [cityFilter, metro]);

  return (
    <aside className="re-map-sidebar">
      <div className="re-map-sidebar-head">
        <div>
          <h2 className="re-map-sidebar-title">{cityFilter ?? metro.name}</h2>
          <p className="re-map-sidebar-sub">
            {zips.length} ZIP{zips.length === 1 ? '' : 's'}
            {cityFilter ? ` in ${metro.name}` : ''}
          </p>
        </div>
        <button type="button" className="re-map-sidebar-close" onClick={onClose} aria-label="Close panel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="re-map-sidebar-list">
        {zips.map((z) => (
          <li key={z.zip}>
            <button type="button" className="re-map-sidebar-item" onClick={() => onSelectZip(z)}>
              <span className="re-map-sidebar-item-main">
                <strong>{z.city ?? z.zip}</strong>
                <span className="re-map-sidebar-zip">{z.zip}</span>
              </span>
              <span className="re-map-sidebar-item-meta">
                {formatUsd(z.medianSalePrice, true)} · score {z.dealScore}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Link href={`/real-estate/markets/${metro.slug}`} className="finance-secondary-btn re-map-sidebar-link">
        Full metro table →
      </Link>
    </aside>
  );
}

export function RealEstateLeafletMap({
  metros,
  theme,
  variant = 'full',
  initialMetroSlug = null,
  cityIndex: cityIndexProp,
}: Props) {
  const isEmbed = variant === 'embed';
  const cityIndex = useMemo(
    () => cityIndexProp ?? buildCitySearchIndex(metros.filter(hasZips)),
    [cityIndexProp, metros],
  );
  const defaultBounds = useMemo(() => getMapBounds(metros), [metros]);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapCityEntry[]>([]);
  const [selectedMetro, setSelectedMetro] = useState<MapMetroPoint | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{
    center?: LatLngExpression;
    zoom?: number;
    bounds?: LatLngBoundsExpression;
  }>({ bounds: defaultBounds });
  const [focusedZip, setFocusedZip] = useState<MapZipPoint | null>(null);
  const [initialApplied, setInitialApplied] = useState(false);

  const tiles = TILES[theme];

  const visibleZips = useMemo(() => {
    if (isEmbed || !selectedMetro || !hasZips(selectedMetro)) return [];
    if (cityFilter) return getZipsForCity(selectedMetro, cityFilter);
    return selectedMetro.zips;
  }, [cityFilter, isEmbed, selectedMetro]);

  useEffect(() => {
    if (initialApplied || !initialMetroSlug) return;
    const metro = getMetroBySlugFromMap(metros, initialMetroSlug);
    if (!metro) return;
    if (hasZips(metro)) setSelectedMetro(metro);
    setQuery(metro.name);
    setFlyTarget({ center: [metro.lat, metro.lng], zoom: 9 });
    setInitialApplied(true);
  }, [initialApplied, initialMetroSlug, metros]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSuggestions(value.trim() ? searchMapLocations(value, cityIndex) : []);
    },
    [cityIndex],
  );

  const selectLocation = useCallback(
    (entry: MapCityEntry) => {
      const metro = getMetroBySlugFromMap(metros, entry.metroSlug);
      if (!metro) return;

      if (hasZips(metro)) {
        setSelectedMetro(metro);
        setCityFilter(isEmbed ? null : entry.kind === 'city' ? entry.label : null);
      }
      setQuery(entry.label);
      setSuggestions([]);
      setFocusedZip(null);

      if (entry.kind === 'city' && hasZips(metro)) {
        const zips = getZipsForCity(metro, entry.label);
        if (zips.length > 0) {
          const lats = zips.map((z) => z.lat);
          const lngs = zips.map((z) => z.lng);
          setFlyTarget({
            bounds: [
              [Math.min(...lats) - 0.08, Math.min(...lngs) - 0.08],
              [Math.max(...lats) + 0.08, Math.max(...lngs) + 0.08],
            ],
          });
          return;
        }
      }

      setFlyTarget({ center: [entry.lat, entry.lng], zoom: entry.kind === 'metro' ? 9 : 11 });
    },
    [isEmbed, metros],
  );

  const selectMetro = useCallback(
    (metro: MapMetroMarker) => {
      if (isEmbed) {
        setQuery(metro.name);
        setSuggestions([]);
        setFlyTarget({ center: [metro.lat, metro.lng], zoom: 8 });
        return;
      }
      if (hasZips(metro)) {
        setSelectedMetro(metro);
      }
      setCityFilter(null);
      setQuery(metro.name);
      setSuggestions([]);
      setFocusedZip(null);
      setFlyTarget({ center: [metro.lat, metro.lng], zoom: 9 });
    },
    [isEmbed],
  );

  const selectZip = useCallback((zip: MapZipPoint) => {
    setFocusedZip(zip);
    setFlyTarget({ center: [zip.lat, zip.lng], zoom: 12 });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMetro(null);
    setCityFilter(null);
    setFocusedZip(null);
    setQuery('');
    setSuggestions([]);
    setFlyTarget({ bounds: defaultBounds });
  }, [defaultBounds]);

  return (
    <div className={`re-map-shell re-map-shell--${theme}${isEmbed ? ' re-map-shell--embed' : ''}`}>
      <div className="re-map-search-wrap">
        <div className="re-map-search">
          <Search className="re-map-search-icon" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) selectLocation(suggestions[0]);
            }}
            placeholder={isEmbed ? 'Search city or metro…' : 'Search city or metro — e.g. Austin, Miami, Williamson'}
            className="finance-input re-map-search-input"
            aria-label="Search city or metro"
          />
          {(query || selectedMetro) && (
            <button type="button" className="re-map-search-clear" onClick={clearSelection} aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {suggestions.length > 0 && (
          <ul className="re-map-suggestions" role="listbox">
            {suggestions.map((s) => (
              <li key={s.key}>
                <button type="button" className="re-map-suggestion" onClick={() => selectLocation(s)}>
                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span>
                    <strong>{s.label}</strong>
                    <span className="re-map-suggestion-meta">
                      {s.kind === 'metro' ? `${s.zipCount} ZIPs · metro` : `${s.zipCount} ZIPs`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="re-map-layout">
        <div className="re-map-canvas-wrap">
          <MapContainer
            center={[39.5, -98.35]}
            zoom={4}
            className="re-map-canvas"
            scrollWheelZoom={!isEmbed}
            zoomControl={!isEmbed}
            attributionControl={!isEmbed}
          >
            <TileLayer url={tiles.url} attribution={isEmbed ? '' : tiles.attribution} />
            <MapInvalidateSize />
            <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} bounds={flyTarget.bounds} />

            {(isEmbed || !selectedMetro) &&
              metros.map((metro) => (
                <CircleMarker
                  key={metro.slug}
                  center={[metro.lat, metro.lng]}
                  radius={isEmbed ? 7 : 10}
                  pathOptions={{
                    color: theme === 'dark' ? '#ededed' : '#0a0a0a',
                    fillColor: dealScoreColor(metro.dealScoreTop ?? 50),
                    fillOpacity: 0.85,
                    weight: isEmbed ? 1.5 : 2,
                  }}
                  eventHandlers={{ click: () => selectMetro(metro) }}
                >
                  {!isEmbed && (
                    <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                      <span className="re-map-tooltip">{metro.name}</span>
                    </Tooltip>
                  )}
                  <Popup closeButton className="re-map-leaflet-popup">
                    <div className="re-map-popup re-map-popup--compact">
                      <p className="re-map-popup-title">{metro.name}</p>
                      <p className="re-map-popup-sub">
                        {metro.zipCount} ZIPs · Median {formatUsd(metro.medianSalePrice, true)} · Yield{' '}
                        {formatYield(metro.medianYield)}
                      </p>
                      {isEmbed ? (
                        <div className="re-map-popup-actions">
                          <Link
                            href={`/real-estate/map?metro=${encodeURIComponent(metro.slug)}`}
                            className="finance-primary-btn re-map-popup-btn"
                          >
                            Open full map
                          </Link>
                          <Link
                            href={`/real-estate/markets/${metro.slug}`}
                            className="finance-secondary-btn re-map-popup-btn"
                          >
                            Metro table
                          </Link>
                        </div>
                      ) : (
                        <button type="button" className="finance-primary-btn re-map-popup-btn" onClick={() => selectMetro(metro)}>
                          View ZIPs on map
                        </button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {visibleZips.map((zip) => (
              <CircleMarker
                key={zip.zip}
                center={[zip.lat, zip.lng]}
                radius={focusedZip?.zip === zip.zip ? 9 : 6}
                pathOptions={{
                  color: focusedZip?.zip === zip.zip ? (theme === 'dark' ? '#fff' : '#000') : dealScoreColor(zip.dealScore),
                  fillColor: dealScoreColor(zip.dealScore),
                  fillOpacity: 0.9,
                  weight: focusedZip?.zip === zip.zip ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => selectZip(zip) }}
              >
                <Popup closeButton>
                  <ZipPopupContent zip={zip} />
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {!isEmbed && (
            <div className="re-map-legend">
              <span className="re-map-legend-title">Deal score</span>
              {[
                ['75+', '#22c55e'],
                ['55–74', '#eab308'],
                ['35–54', '#f97316'],
                ['<35', '#ef4444'],
              ].map(([label, color]) => (
                <span key={label} className="re-map-legend-item">
                  <span className="re-map-legend-dot" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isEmbed && selectedMetro && (
          <MetroSidebar
            metro={selectedMetro}
            cityFilter={cityFilter}
            onClose={clearSelection}
            onSelectZip={selectZip}
          />
        )}
      </div>
    </div>
  );
}
