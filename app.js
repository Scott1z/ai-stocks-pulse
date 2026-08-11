// ---------------------------------------------------------------------------
// AI Stocks Pulse — data layer.
// On load, tries to fetch ./data.json (written by pipeline/fetch_and_curate.py).
// If it's missing or malformed (e.g. the pipeline hasn't run yet), falls back
// to the DEMO_* constants below so the page always renders something.
// ---------------------------------------------------------------------------

const DEMO_STOCKS = [
  {
    ticker: "NVDA",
    name: "NVIDIA",
    price: 128.45,
    changePct: 3.2,
    sentiment: "bullish",
    blurb: "La demanda de chips para centros de datos de IA sigue superando las expectativas de los analistas.",
    spark: [110, 112, 109, 115, 118, 116, 121, 119, 124, 122, 126, 128.45],
    fundamentals: { peTTM: 54.2, epsTTM: 2.37, marketCapM: 3150000, week52High: 153.13, week52Low: 86.62, roeTTM: 91.9, netMarginTTM: 55.7 },
    lastEarnings: { period: "2026-05-28", actual: 0.96, estimate: 0.88, surprisePercent: 9.1 },
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    price: 441.2,
    changePct: 1.1,
    sentiment: "bullish",
    blurb: "Azure AI reporta un crecimiento acelerado gracias a la adopción empresarial de Copilot.",
    spark: [420, 424, 422, 428, 431, 429, 434, 437, 435, 439, 438, 441.2],
    fundamentals: { peTTM: 36.1, epsTTM: 12.22, marketCapM: 3280000, week52High: 468.35, week52Low: 385.58, roeTTM: 34.3, netMarginTTM: 35.8 },
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    price: 178.9,
    changePct: -0.8,
    sentiment: "mixed",
    blurb: "Gemini gana terreno en búsqueda, pero preocupa el gasto en infraestructura de IA.",
    spark: [182, 181, 183, 180, 179, 181, 178, 177, 179, 178, 180, 178.9],
    fundamentals: { peTTM: 22.4, epsTTM: 7.99, marketCapM: 2190000, week52High: 207.05, week52Low: 140.53, roeTTM: 32.9, netMarginTTM: 29.8 },
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    price: 512.6,
    changePct: 2.4,
    sentiment: "bullish",
    blurb: "Los modelos Llama open-source impulsan nuevas herramientas publicitarias con IA.",
    spark: [488, 492, 495, 490, 498, 501, 499, 505, 503, 508, 506, 512.6],
    fundamentals: { peTTM: 27.6, epsTTM: 18.57, marketCapM: 1310000, week52High: 585.25, week52Low: 414.5, roeTTM: 38.7, netMarginTTM: 39.1 },
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    price: 189.3,
    changePct: 0.4,
    sentiment: "mixed",
    blurb: "AWS lanza nuevos chips de inferencia propios para competir en costos de IA.",
    spark: [186, 187, 185, 188, 187, 189, 186, 188, 190, 187, 188, 189.3],
    fundamentals: { peTTM: 34.8, epsTTM: 5.44, marketCapM: 1990000, week52High: 201.2, week52Low: 151.61, roeTTM: 24.3, netMarginTTM: 10.6 },
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    price: 154.75,
    changePct: -2.1,
    sentiment: "bearish",
    blurb: "Analistas rebajan estimaciones ante la fuerte competencia de NVIDIA en GPUs de IA.",
    spark: [163, 161, 159, 160, 158, 156, 157, 155, 153, 156, 155, 154.75],
    fundamentals: { peTTM: 105.3, epsTTM: 1.47, marketCapM: 251000, week52High: 187.28, week52Low: 76.48, roeTTM: 5.1, netMarginTTM: 6.4 },
    lastEarnings: { period: "2026-05-06", actual: 0.62, estimate: 0.68, surprisePercent: -8.8 },
  },
];

const DEMO_NEWS = [
  {
    headline: "NVIDIA supera expectativas de ingresos por cuarto trimestre consecutivo",
    summary: "NVIDIA reportó ingresos por encima de lo esperado por el mercado, impulsados por la demanda sostenida de chips para centros de datos de IA. Los analistas destacan que la guía para el próximo trimestre también superó estimaciones, reforzando la narrativa de crecimiento del sector.",
    source: "Reuters",
    time: "hace 2 h",
    ticker: "NVDA",
    sentiment: "up",
    url: null,
  },
  {
    headline: "Microsoft anuncia inversión adicional de $10B en infraestructura de IA",
    summary: "Microsoft ampliará su inversión en centros de datos dedicados a IA, citando la fuerte adopción empresarial de Copilot y la demanda de capacidad de cómputo en Azure. La compañía espera que el gasto se traduzca en crecimiento de ingresos durante los próximos trimestres.",
    source: "Bloomberg",
    time: "hace 3 h",
    ticker: "MSFT",
    sentiment: "up",
    url: null,
  },
  {
    headline: "Meta libera nueva versión de Llama con mejoras en razonamiento",
    summary: "Meta lanzó una actualización de su familia de modelos Llama con mejor capacidad de razonamiento y menor costo de inferencia. La compañía busca que más desarrolladores adopten sus modelos open-source frente a alternativas cerradas de la competencia.",
    source: "TechCrunch",
    time: "hace 5 h",
    ticker: "META",
    sentiment: "up",
    url: null,
  },
  {
    headline: "AMD reduce previsión de ventas de GPUs de IA para el próximo trimestre",
    summary: "AMD ajustó a la baja sus proyecciones de ventas de GPUs para IA, citando mayor competencia de NVIDIA y ciclos de compra más cautelosos por parte de los grandes proveedores de nube. La acción cayó tras el anuncio.",
    source: "CNBC",
    time: "hace 6 h",
    ticker: "AMD",
    sentiment: "down",
    url: null,
  },
  {
    headline: "Alphabet enfrenta escrutinio regulatorio por prácticas de datos en Gemini",
    summary: "Reguladores europeos abrieron una revisión sobre cómo Alphabet utiliza datos de usuarios para entrenar su modelo Gemini. La compañía sostiene que cumple con la normativa vigente, pero el proceso podría extenderse varios meses.",
    source: "The Verge",
    time: "hace 8 h",
    ticker: "GOOGL",
    sentiment: "mixed",
    url: null,
  },
  {
    headline: "Amazon presenta chip Trainium3 para entrenamiento de modelos a menor costo",
    summary: "AWS presentó su tercera generación de chips propios para entrenamiento de IA, prometiendo mejor rendimiento por dólar frente a GPUs de terceros. Amazon busca reducir su dependencia de proveedores externos de hardware.",
    source: "Reuters",
    time: "hace 10 h",
    ticker: "AMZN",
    sentiment: "up",
    url: null,
  },
  {
    headline: "Analistas de Wall Street elevan precio objetivo del sector semiconductores IA",
    summary: "Varias casas de análisis subieron sus precios objetivo para el sector de semiconductores ligados a IA, citando demanda estructural de largo plazo. No todos los analistas coinciden: algunos advierten sobre valuaciones ya elevadas.",
    source: "MarketWatch",
    time: "hace 12 h",
    ticker: null,
    sentiment: "up",
    url: null,
  },
  {
    headline: "Preocupa el ritmo de gasto de capital ('capex') de las grandes tecnológicas en IA",
    summary: "Inversores comienzan a cuestionar si el ritmo de inversión en infraestructura de IA de las grandes tecnológicas es sostenible sin un retorno claro todavía. El tema domina las llamadas de resultados del trimestre.",
    source: "Financial Times",
    time: "hace 14 h",
    ticker: null,
    sentiment: "mixed",
    url: null,
  },
];

const DEMO_SECTOR_SUMMARY = {
  sentiment: "bullish",
  text:
    "El sector de acciones de IA muestra un tono mayoritariamente alcista hoy, liderado por NVIDIA y Microsoft " +
    "tras resultados que superan expectativas. AMD es la excepción, cayendo por temores de mayor competencia. " +
    "El mercado sigue de cerca el gasto en infraestructura ('capex') de las grandes tecnológicas como principal riesgo a vigilar.",
  stats: [
    { label: "Empresas al alza", value: "4 / 6", cls: "up" },
    { label: "Cambio promedio", value: "+0.7%", cls: "up" },
    { label: "Noticias hoy", value: "8" },
  ],
};

const DEMO_EARNINGS = [
  { ticker: "NVDA", name: "NVIDIA", date: "2026-08-20", hour: "amc" },
  { ticker: "AMD", name: "Advanced Micro Devices", date: "2026-08-25", hour: "amc" },
  { ticker: "MSFT", name: "Microsoft", date: "2026-09-09", hour: "amc" },
  { ticker: "GOOGL", name: "Alphabet", date: "2026-09-15", hour: "amc" },
  { ticker: "META", name: "Meta Platforms", date: "2026-10-14", hour: "amc" },
];

let STOCKS = DEMO_STOCKS;
let NEWS = DEMO_NEWS;
let SECTOR_SUMMARY = DEMO_SECTOR_SUMMARY;
let EARNINGS = DEMO_EARNINGS;
let isLiveData = false;
let lastUpdatedIso = null;

// ---------------------------------------------------------------------------
// Watchlist — favorite tickers persisted locally, no account needed.
// ---------------------------------------------------------------------------

const FAVORITES_KEY = "aisp_favorites";
let favorites = new Set();
try {
  favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
} catch {
  favorites = new Set();
}

function toggleFavorite(ticker) {
  if (favorites.has(ticker)) favorites.delete(ticker);
  else favorites.add(ticker);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    /* localStorage unavailable (private mode, quota) — favorites just won't persist */
  }
}

// Mi posición — precio de compra opcional por ticker favorito, para calcular
// una ganancia/pérdida hipotética. Todo local (localStorage), nunca se manda
// a ningún servidor — no hay backend que lo reciba.
const COST_BASIS_KEY = "aisp_cost_basis";
let costBasis = {};
try {
  costBasis = JSON.parse(localStorage.getItem(COST_BASIS_KEY) || "{}");
} catch {
  costBasis = {};
}

function setCostBasis(ticker, price) {
  costBasis[ticker] = price;
  try {
    localStorage.setItem(COST_BASIS_KEY, JSON.stringify(costBasis));
  } catch {
    /* localStorage unavailable — no persiste, pero no rompe la sesión actual */
  }
}

function clearCostBasis(ticker) {
  delete costBasis[ticker];
  try {
    localStorage.setItem(COST_BASIS_KEY, JSON.stringify(costBasis));
  } catch {
    /* localStorage unavailable */
  }
}

// ---------------------------------------------------------------------------
// data.json loading + normalization
// ---------------------------------------------------------------------------
// Expected shape of data.json (written by pipeline/fetch_and_curate.py):
// {
//   "updated_at": "<ISO 8601>",
//   "sector": {
//     "sentiment": "bullish" | "bearish" | "mixed",
//     "text": "<summary>",
//     "stats": { "upCount": n, "totalCount": n, "avgChangePct": n, "newsCount": n }
//   },
//   "stocks": [{ ticker, name, price, changePct, spark: number[], fundamentals: {...},
//                ohlc: [{ date, open, high, low, close }] (real daily candles, once/day) }],
//   "news": [{ headline, summary, tickers: string[], sentiment: "positive"|"negative"|"neutral",
//              source_url, source, published_at: "<ISO 8601>"|null }]
// }

function classifyBySign(changePct) {
  if (changePct > 0.3) return "bullish";
  if (changePct < -0.3) return "bearish";
  return "mixed";
}

const NEWS_SENTIMENT_MAP = { positive: "up", negative: "down", neutral: "mixed" };

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Fuente";
  }
}

// source_url viaja tal cual desde Finnhub hasta acá — antes de usarlo como
// href de un link real, confirmamos que sea http(s). Sin esto, un
// "javascript:" (u otro esquema ejecutable) en esos datos externos se
// dispararía al hacer click en "Leer artículo original".
function isSafeHttpUrl(url) {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

// Escapa texto que viene de afuera (noticias de Finnhub, resúmenes generados
// por el LLM a partir de esas noticias) antes de insertarlo con innerHTML —
// ninguno de esos textos es confiable, aunque pase por Claude en el medio.
const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
}

function relativeTime(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "justo ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

function findBlurbForTicker(newsItems, ticker) {
  const match = newsItems.find((n) => (n.tickers || []).includes(ticker));
  return match ? match.summary : "Sin noticias recientes para este ticker.";
}

function normalizeRealData(json) {
  const news = (json.news || []).map((n) => ({
    headline: n.headline,
    summary: n.summary || "",
    source: n.source || hostnameFromUrl(n.source_url),
    time: relativeTime(n.published_at),
    ticker: (n.tickers && n.tickers[0]) || null,
    sentiment: NEWS_SENTIMENT_MAP[n.sentiment] || "mixed",
    url: n.source_url || null,
  }));

  const stocks = (json.stocks || [])
    .filter((s) => s.price != null)
    .map((s) => ({
      ticker: s.ticker,
      name: s.name || s.ticker,
      price: s.price,
      changePct: s.changePct ?? 0,
      sentiment: classifyBySign(s.changePct ?? 0),
      blurb: findBlurbForTicker(json.news || [], s.ticker),
      spark: s.spark && s.spark.length >= 2 ? s.spark : [s.price, s.price],
      fundamentals: s.fundamentals || {},
      ohlc: Array.isArray(s.ohlc) ? s.ohlc : [],
      lastEarnings: s.lastEarnings || null,
    }));

  const stats = json.sector?.stats || {};
  const avg = stats.avgChangePct ?? 0;
  const sectorSummary = {
    sentiment: json.sector?.sentiment || "mixed",
    text: json.sector?.text || "",
    stats: [
      {
        label: "Empresas al alza",
        value: `${stats.upCount ?? 0} / ${stats.totalCount ?? stocks.length}`,
        cls: (stats.upCount ?? 0) >= (stats.totalCount ?? stocks.length) / 2 ? "up" : "down",
      },
      {
        label: "Cambio promedio",
        value: `${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%`,
        cls: avg >= 0 ? "up" : "down",
      },
      { label: "Noticias hoy", value: String(stats.newsCount ?? news.length) },
    ],
  };

  const earnings = (json.earningsCalendar || []).map((e) => ({
    ticker: e.ticker,
    name: e.name || e.ticker,
    date: e.date,
    hour: e.hour || "",
  }));

  return { stocks, news, sectorSummary, earnings };
}

async function loadData() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`data.json respondió ${res.status}`);
    const json = await res.json();
    const normalized = normalizeRealData(json);

    if (!normalized.stocks.length) throw new Error("data.json no tiene precios válidos");

    STOCKS = normalized.stocks;
    NEWS = normalized.news;
    SECTOR_SUMMARY = normalized.sectorSummary;
    EARNINGS = normalized.earnings;
    isLiveData = true;
    lastUpdatedIso = json.updated_at || null;
  } catch (err) {
    STOCKS = DEMO_STOCKS;
    NEWS = DEMO_NEWS;
    SECTOR_SUMMARY = DEMO_SECTOR_SUMMARY;
    EARNINGS = DEMO_EARNINGS;
    isLiveData = false;
    lastUpdatedIso = null;
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const sentimentLabel = { bullish: "Alcista", bearish: "Bajista", mixed: "Mixta" };

// Category icon set — inspired by how broker sites like invertironline
// color-code a small icon per product/data category. Deliberately outside
// the page's One-Accent Rule (each icon keeps its own color), but the
// shapes stay in the same restrained stroke language as the trend glyphs
// and charts elsewhere, and colors stay desaturated to match the palette.
const ICON_PATHS = {
  pulse: '<path d="M4 20V13M9.5 20V7M15 20V16M20 20V4"/>',
  building: '<path d="M4 20h16M5 20V9.5L12 5l7 4.5V20M9 20v-6h6v6"/>',
  newspaper:
    '<path d="M5 4.5h11.5A1.5 1.5 0 0 1 18 6v13a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5V6a1.5 1.5 0 0 1 1-1.4Z"/><path d="M8 9h6M8 12.5h6M8 16h3.5"/>',
  coin:
    '<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9M9.3 9.8c0-1.1 1.2-2 2.7-2s2.7.8 2.7 1.8c0 2.4-5.4 1-5.4 3.4 0 1 1.2 1.8 2.7 1.8s2.7-.8 2.7-1.9"/>',
  calendarRange: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M9 14.5h6"/>',
  percentCircle:
    '<circle cx="12" cy="12" r="8"/><path d="M9 15l6-6"/><circle cx="9.4" cy="9" r="0.9" fill="currentColor" stroke="none"/><circle cx="14.6" cy="15" r="0.9" fill="currentColor" stroke="none"/>',
  scaleBalance:
    '<path d="M12 4v16M8 20h8M6 8h5M18 8h-5M6 8l-2.5 5a2.5 2.5 0 0 0 5 0Zm12 0l-2.5 5a2.5 2.5 0 0 0 5 0Z"/>',
};

function icon(name, colorClass) {
  return `<svg class="icon-glyph ${colorClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
}

// Finnhub reporta marketCapitalization en millones de USD.
function formatMarketCap(millions) {
  if (millions == null) return null;
  if (millions >= 1e6) return `$${(millions / 1e6).toFixed(2)}T`;
  if (millions >= 1e3) return `$${(millions / 1e3).toFixed(1)}B`;
  return `$${millions.toFixed(0)}M`;
}

function buildFundamentalsGrid(fundamentals = {}) {
  const na = `<span class="stat-value unavailable">N/D</span>`;
  const stats = [
    { label: "P/E (TTM)", icon: icon("scaleBalance", "icon-indigo"), value: fundamentals.peTTM != null ? fundamentals.peTTM.toFixed(1) : null },
    { label: "Cap. de mercado", icon: icon("coin", "icon-green"), value: formatMarketCap(fundamentals.marketCapM) },
    {
      label: "Rango 52 semanas",
      icon: icon("calendarRange", "icon-navy"),
      value:
        fundamentals.week52Low != null && fundamentals.week52High != null
          ? `$${fundamentals.week52Low.toFixed(2)} - $${fundamentals.week52High.toFixed(2)}`
          : null,
    },
    { label: "EPS (TTM)", icon: icon("coin", "icon-green"), value: fundamentals.epsTTM != null ? `$${fundamentals.epsTTM.toFixed(2)}` : null },
    { label: "ROE (TTM)", icon: icon("percentCircle", "icon-indigo"), value: fundamentals.roeTTM != null ? `${fundamentals.roeTTM.toFixed(1)}%` : null },
    { label: "Margen neto (TTM)", icon: icon("percentCircle", "icon-indigo"), value: fundamentals.netMarginTTM != null ? `${fundamentals.netMarginTTM.toFixed(1)}%` : null },
  ];

  return stats
    .map(
      (s) => `<div class="stat">
        ${s.value != null ? `<div class="stat-value">${s.value}</div>` : na}
        <div class="stat-label">${s.icon}${s.label}</div>
      </div>`
    )
    .join("");
}

function buildSparkline(values) {
  const w = 240, h = 44, pad = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (values.length - 1);
  const coords = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `M${first.x.toFixed(1)},${h - pad} L${linePoints
    .split(" ")
    .join(" L")} L${last.x.toFixed(1)},${h - pad} Z`;

  const up = values[values.length - 1] >= values[0];
  const color = up ? "var(--rise)" : "var(--fall)";

  return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="var(--line)" stroke-width="1"/>
    <path d="${areaPath}" fill="${color}" opacity="0.12" stroke="none"/>
    <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="2.5" fill="${color}"/>
  </svg>`;
}

// Equal-weighted % return across every tracked stock — a real composite
// "sector index" built from the same price history that feeds the
// sparklines, not decoration. This is the hero's dominant visual.
// Rango del índice compuesto del hero: "today" usa el spark corto (snapshots
// de precio por corrida del pipeline, ~última media jornada); "30d"/"60d"
// usan los cierres diarios reales (stock.ohlc), que llegan hasta 60 ruedas
// (ver OHLC_DAYS_KEPT en el pipeline) — por eso no hay opción "90d" todavía,
// sería prometer un historial que no tenemos.
const HERO_CHART_RANGES = [
  { key: "today", label: "Hoy" },
  { key: "30d", label: "30 días" },
  { key: "60d", label: "60 días" },
];

function buildCompositeSeries(stocks, range) {
  if (range === "today") {
    const length = Math.min(...stocks.map((s) => s.spark.length));
    if (length < 2) return null;
    return stocks.map((s) => s.spark.slice(-length));
  }
  const withOhlc = stocks.filter((s) => Array.isArray(s.ohlc) && s.ohlc.length >= 2);
  if (withOhlc.length < 2) return null;
  const days = range === "30d" ? 30 : 60;
  const length = Math.min(days, ...withOhlc.map((s) => s.ohlc.length));
  if (length < 2) return null;
  return withOhlc.map((s) => s.ohlc.slice(-length).map((c) => c.close));
}

function buildCompositeChart(series) {
  const length = Math.min(...series.map((s) => s.length));
  if (length < 2) return null;

  const composite = [];
  for (let i = 0; i < length; i++) {
    const avgReturn =
      series.reduce((sum, s) => sum + ((s[i] - s[0]) / s[0]) * 100, 0) / series.length;
    composite.push(avgReturn);
  }

  const w = 520, h = 168, pad = 10;
  const min = Math.min(...composite, 0);
  const max = Math.max(...composite, 0);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (composite.length - 1);
  const coords = composite.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const zeroY = pad + (1 - (0 - min) / range) * (h - pad * 2);
  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `M${first.x.toFixed(1)},${h - pad} L${linePoints
    .split(" ")
    .join(" L")} L${last.x.toFixed(1)},${h - pad} Z`;

  const finalReturn = composite[composite.length - 1];
  const up = finalReturn >= 0;
  const color = up ? "var(--rise)" : "var(--fall)";

  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const y = (pad + f * (h - pad * 2)).toFixed(1);
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    })
    .join("");

  return {
    finalReturn,
    up,
    svg: `<svg class="hero-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      ${gridLines}
      <line x1="${pad}" y1="${zeroY.toFixed(1)}" x2="${w - pad}" y2="${zeroY.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3,3"/>
      <path d="${areaPath}" fill="${color}" opacity="0.14" stroke="none"/>
      <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.5" fill="${color}"/>
    </svg>`,
  };
}

// Enlarged single-stock chart for the stock detail modal — same visual
// language as the hero composite chart (grid, area fill, endpoint), but
// plotting raw price instead of % return. Not candles: we only track the
// price at each pipeline run (price_history.json), not real OHLC data, so
// this is honestly a richer version of the row's sparkline, not a
// TradingView-grade chart.
function buildStockDetailChart(spark) {
  const w = 560, h = 200, pad = 14;
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const range = max - min || 1;
  const stepX = spark.length > 1 ? (w - pad * 2) / (spark.length - 1) : 0;
  const coords = spark.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];
  const areaPath = `M${first.x.toFixed(1)},${h - pad} L${linePoints
    .split(" ")
    .join(" L")} L${last.x.toFixed(1)},${h - pad} Z`;

  const up = spark[spark.length - 1] >= spark[0];
  const color = up ? "var(--rise)" : "var(--fall)";

  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const y = (pad + f * (h - pad * 2)).toFixed(1);
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    })
    .join("");

  return `<svg class="stock-detail-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${gridLines}
    <path d="${areaPath}" fill="${color}" opacity="0.14" stroke="none"/>
    <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="4" fill="${color}"/>
  </svg>`;
}

function buildCandlestickChart(ohlc) {
  const w = 560, h = 200, pad = 14;
  const min = Math.min(...ohlc.map((d) => d.low));
  const max = Math.max(...ohlc.map((d) => d.high));
  const range = max - min || 1;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const stepX = innerW / ohlc.length;
  const bodyWidth = Math.max(2, Math.min(stepX * 0.6, 10));
  const y = (v) => pad + (1 - (v - min) / range) * innerH;

  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const gy = (pad + f * innerH).toFixed(1);
      return `<line x1="${pad}" y1="${gy}" x2="${w - pad}" y2="${gy}" stroke="var(--line)" stroke-width="1"/>`;
    })
    .join("");

  const candles = ohlc
    .map((d, i) => {
      const cx = pad + stepX * i + stepX / 2;
      const up = d.close >= d.open;
      const color = up ? "var(--rise)" : "var(--fall)";
      const yOpen = y(d.open);
      const yClose = y(d.close);
      const bodyTop = Math.min(yOpen, yClose).toFixed(1);
      const bodyHeight = Math.max(1, Math.abs(yOpen - yClose)).toFixed(1);
      return `<line x1="${cx.toFixed(1)}" y1="${y(d.high).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${y(d.low).toFixed(1)}" stroke="${color}" stroke-width="1"/><rect x="${(cx - bodyWidth / 2).toFixed(1)}" y="${bodyTop}" width="${bodyWidth.toFixed(1)}" height="${bodyHeight}" fill="${color}"/>`;
    })
    .join("");

  return `<svg class="stock-detail-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${gridLines}
    ${candles}
  </svg>`;
}

let heroChartRange = "today";

function renderHeroChart() {
  const el = document.getElementById("heroChart");
  const rangeToggle = `<div class="hero-chart-range" role="tablist" aria-label="Rango del índice compuesto">
    ${HERO_CHART_RANGES.map(
      (r) =>
        `<button type="button" role="tab" aria-selected="${r.key === heroChartRange}" class="${
          r.key === heroChartRange ? "active" : ""
        }" data-range="${r.key}">${r.label}</button>`
    ).join("")}
  </div>`;

  const series = buildCompositeSeries(STOCKS, heroChartRange);
  const result = series && buildCompositeChart(series);

  if (!result) {
    el.innerHTML = `${rangeToggle}<p class="hero-chart-empty">Todavía no hay suficiente historial diario para este rango.</p>`;
    return;
  }
  const sign = result.finalReturn >= 0 ? "+" : "";
  el.innerHTML = `
    ${rangeToggle}
    <div class="hero-chart-label">
      <span class="hero-chart-title">Índice compuesto del sector</span>
      <span class="hero-chart-value ${result.up ? "up" : "down"}">${sign}${result.finalReturn.toFixed(1)}%</span>
    </div>
    ${result.svg}`;
}

function initHeroChartRange() {
  document.getElementById("heroChart").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-range]");
    if (!btn) return;
    heroChartRange = btn.dataset.range;
    renderHeroChart();
  });
}

function renderSectorSummary() {
  document.getElementById("sectorSummaryText").textContent =
    SECTOR_SUMMARY.text || "Sin resumen disponible todavía.";

  const sentimentEl = document.getElementById("sectorSentiment");
  sentimentEl.textContent = `Sector ${sentimentLabel[SECTOR_SUMMARY.sentiment].toLowerCase()}`;
  sentimentEl.className = `sentiment-badge sentiment-${SECTOR_SUMMARY.sentiment}`;

  const HERO_STAT_ICONS = {
    "Empresas al alza": icon("building", "icon-teal"),
    "Cambio promedio": icon("pulse", "icon-navy"),
    "Noticias hoy": icon("newspaper", "icon-indigo"),
  };

  const statsEl = document.getElementById("sectorStats");
  statsEl.innerHTML = SECTOR_SUMMARY.stats
    .map(
      (s) => `<div class="stat">
        <div class="stat-value ${s.cls || ""}">${s.value}</div>
        <div class="stat-label">${HERO_STAT_ICONS[s.label] || ""}${s.label}</div>
      </div>`
    )
    .join("");
}

function renderHeroMovers() {
  const container = document.getElementById("heroMovers");
  const withChange = STOCKS.filter((s) => s.changePct != null);
  if (withChange.length < 2) {
    container.innerHTML = "";
    return;
  }

  const sorted = [...withChange].sort((a, b) => b.changePct - a.changePct);
  const gainer = sorted[0];
  const loser = sorted[sorted.length - 1];

  const moverCard = (stock, label) => {
    const tagCls = stock.changePct >= 0 ? "bullish" : "bearish";
    const changeCls = stock.changePct >= 0 ? "up" : "down";
    const sign = stock.changePct >= 0 ? "+" : "";
    return `<button class="hero-mover" data-ticker="${stock.ticker}" type="button">
      <span class="hero-mover-label">${label}</span>
      <span class="hero-mover-row">
        <span class="stock-tag ${tagCls}">${stock.ticker}</span>
        <span class="hero-mover-change ${changeCls}">${sign}${stock.changePct.toFixed(1)}%</span>
      </span>
    </button>`;
  };

  // Third mover: not another price-change extreme (the gainer/loser above
  // already cover that), but a different lens on the same list — the
  // largest company by market cap, from real fundamentals data already on
  // each stock. Reuses the exact same button/tag markup, just swaps the
  // metric shown.
  const withCap = STOCKS.filter((s) => s.fundamentals && s.fundamentals.marketCapM != null);
  let capCard = "";
  if (withCap.length) {
    const biggest = [...withCap].sort((a, b) => b.fundamentals.marketCapM - a.fundamentals.marketCapM)[0];
    const cap = formatMarketCap(biggest.fundamentals.marketCapM);
    capCard = `<button class="hero-mover" data-ticker="${biggest.ticker}" type="button">
      <span class="hero-mover-label">Mayor capitalización</span>
      <span class="hero-mover-row">
        <span class="stock-tag mixed">${biggest.ticker}</span>
        <span class="hero-mover-change">${cap}</span>
      </span>
    </button>`;
  }

  container.innerHTML = moverCard(gainer, "Mayor suba") + moverCard(loser, "Mayor baja") + capCard;

  container.querySelectorAll(".hero-mover").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stock = STOCKS.find((s) => s.ticker === btn.dataset.ticker);
      if (stock) openStockModal(stock);
    });
  });
}

// Market breadth: how many tracked stocks are bullish/bearish/mixed right
// now, computed client-side from the same STOCKS list the ledger and
// movers already use. A thin proportional bar for the at-a-glance read,
// plus the exact counts reusing the existing stock-tag pill (no new
// component) — the same pattern Bloomberg/Yahoo Finance movers widgets
// use, adapted to this page's flat/hairline language instead of a card.
function renderHeroBreadth() {
  const container = document.getElementById("heroBreadth");
  const withSentiment = STOCKS.filter((s) => s.sentiment);
  const total = withSentiment.length;
  if (total < 2) {
    container.innerHTML = "";
    return;
  }

  const counts = { bullish: 0, bearish: 0, mixed: 0 };
  withSentiment.forEach((s) => {
    if (counts[s.sentiment] != null) counts[s.sentiment] += 1;
  });

  const segLabel = { bullish: "Alcistas", bearish: "Bajistas", mixed: "Mixtas" };
  const segments = ["bullish", "bearish", "mixed"]
    .filter((key) => counts[key] > 0)
    .map((key) => `<span class="hero-breadth-seg ${key}" style="flex-basis:${((counts[key] / total) * 100).toFixed(2)}%"></span>`)
    .join("");

  const badges = ["bullish", "bearish", "mixed"]
    .filter((key) => counts[key] > 0)
    .map((key) => `<span class="stock-tag ${key}">${counts[key]} ${segLabel[key]}</span>`)
    .join("");

  container.innerHTML = `
    <p class="hero-breadth-label">Amplitud del sector · ${total} empresas</p>
    <div class="hero-breadth-bar">${segments}</div>
    <div class="hero-breadth-counts">${badges}</div>`;
}

let sortState = { key: null, dir: "asc" };

function applySort(list) {
  if (!sortState.key) return list;
  const { key, dir } = sortState;
  return [...list].sort((a, b) => {
    let av = a[key];
    let bv = b[key];
    if (key === "name") {
      av = av.toLowerCase();
      bv = bv.toLowerCase();
    }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function updateSortIndicators() {
  document.querySelectorAll(".ledger-sort").forEach((btn) => {
    const arrow = btn.querySelector(".ledger-sort-arrow");
    if (arrow) arrow.remove();
    if (sortState.key === btn.dataset.sort) {
      btn.setAttribute("aria-sort", sortState.dir === "asc" ? "ascending" : "descending");
      btn.insertAdjacentHTML(
        "beforeend",
        `<span class="ledger-sort-arrow" aria-hidden="true">${sortState.dir === "asc" ? "▲" : "▼"}</span>`
      );
    } else {
      btn.removeAttribute("aria-sort");
    }
  });
}

const STOCKS_COLLAPSE_LIMIT = 3;
const NEWS_COLLAPSE_LIMIT = 3;
const EARNINGS_COLLAPSE_LIMIT = 3;
let stocksExpanded = false;
let newsExpanded = false;
let earningsExpanded = false;

function buildListToggle(kind, remaining, expanded) {
  const label = expanded ? "Ver menos" : `Ver ${remaining} más`;
  return `<button type="button" class="list-toggle" data-toggle="${kind}">${label}</button>`;
}

function renderStocks(filter = "all", query = "") {
  const grid = document.getElementById("stockGrid");
  const q = query.trim().toLowerCase();

  const filtered = STOCKS.filter((s) => {
    const matchesFilter =
      filter === "all" || (filter === "favorites" ? favorites.has(s.ticker) : s.sentiment === filter);
    const matchesQuery =
      !q || s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  if (!filtered.length) {
    grid.innerHTML =
      filter === "favorites"
        ? `<p style="color:var(--text-faint)">Todavía no marcaste ninguna acción como favorita. Tocá la estrella junto al ticker para agregarla.</p>`
        : `<p style="color:var(--text-faint)">No hay empresas que coincidan con tu búsqueda.</p>`;
    return;
  }

  const sorted = applySort(filtered);
  const showToggle = sorted.length > STOCKS_COLLAPSE_LIMIT;
  const visible = stocksExpanded ? sorted : sorted.slice(0, STOCKS_COLLAPSE_LIMIT);
  const STAR_ICON =
    '<svg viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.6l1.87 3.98 4.33.5-3.23 3.02.9 4.4L8 11.35l-3.87 2.15.9-4.4-3.23-3.02 4.33-.5L8 1.6Z"/></svg>';

  const rowsHtml = visible
    .map((s) => {
      const changeSign = s.changePct >= 0 ? "+" : "";
      const changeCls = s.changePct >= 0 ? "up" : "down";
      const isFav = favorites.has(s.ticker);
      return `
      <article class="stock-row" data-ticker="${s.ticker}" tabindex="0" role="button" aria-haspopup="dialog">
        <div class="stock-id">
          <div class="stock-id-top">
            <button type="button" class="stock-star ${isFav ? "active" : ""}" data-star="${s.ticker}" aria-pressed="${isFav}" aria-label="${isFav ? "Quitar de favoritas" : "Agregar a favoritas"}">${STAR_ICON}</button>
            <span class="stock-ticker">${s.ticker}</span>
          </div>
          <span class="stock-name">${s.name}</span>
          <p class="stock-blurb">${escapeHtml(s.blurb)}</p>
        </div>
        <div class="price-value">$${s.price.toFixed(2)}</div>
        <div class="price-change ${changeCls}">${changeSign}${s.changePct.toFixed(1)}%</div>
        ${buildSparkline(s.spark)}
        <span class="stock-tag ${s.sentiment}">${sentimentLabel[s.sentiment]}</span>
      </article>`;
    })
    .join("");

  grid.innerHTML =
    rowsHtml + (showToggle ? buildListToggle("stocks", sorted.length - STOCKS_COLLAPSE_LIMIT, stocksExpanded) : "");
}

function renderNews() {
  const list = document.getElementById("newsList");
  const indexed = NEWS.map((n, i) => ({ n, i }));
  const showToggle = indexed.length > NEWS_COLLAPSE_LIMIT;
  const visible = newsExpanded ? indexed : indexed.slice(0, NEWS_COLLAPSE_LIMIT);

  const itemsHtml = visible
    .map(
      ({ n, i }) => `
    <article class="news-item" data-index="${i}" tabindex="0" role="button" aria-haspopup="dialog">
      <span class="news-dot ${n.sentiment}" aria-hidden="true"></span>
      <div class="news-body">
        <p class="news-headline">${escapeHtml(n.headline)}</p>
        <div class="news-meta">
          <span>${escapeHtml(n.source)}</span>
          <span>·</span>
          <span>${n.time}</span>
        </div>
      </div>
      ${n.ticker ? `<span class="news-ticker-tag">[${escapeHtml(n.ticker)}]</span>` : `<span></span>`}
    </article>`
    )
    .join("");

  list.innerHTML =
    itemsHtml + (showToggle ? buildListToggle("news", indexed.length - NEWS_COLLAPSE_LIMIT, newsExpanded) : "");
}

const MONTH_NAMES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const EARNINGS_HOUR_LABEL = { bmo: "Antes de apertura", amc: "Después del cierre", dmh: "Durante la rueda" };

// Parses "YYYY-MM-DD" by hand instead of `new Date(str)` — the latter reads
// as UTC midnight, which shifts a day backward once converted to any
// negative-UTC-offset local time (e.g. Argentina), a classic off-by-one.
function formatEarningsMonth(dateStr) {
  const [y, m] = dateStr.split("-").map(Number);
  const name = MONTH_NAMES_ES[m - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}
function earningsDay(dateStr) {
  return dateStr.split("-")[2];
}

function renderEarningsCalendar() {
  const section = document.querySelector(".earnings");
  const list = document.getElementById("earningsList");
  if (!EARNINGS.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  const showToggle = EARNINGS.length > EARNINGS_COLLAPSE_LIMIT;
  const visible = earningsExpanded ? EARNINGS : EARNINGS.slice(0, EARNINGS_COLLAPSE_LIMIT);

  let lastMonth = null;
  const rowsHtml = visible
    .map((e) => {
      const monthLabel = formatEarningsMonth(e.date);
      const monthHtml = monthLabel !== lastMonth ? `<div class="earnings-month-label">${monthLabel}</div>` : "";
      lastMonth = monthLabel;
      return `${monthHtml}
      <article class="earnings-row" data-ticker="${e.ticker}" tabindex="0" role="button" aria-haspopup="dialog">
        <span class="earnings-date">${earningsDay(e.date)}</span>
        <div class="earnings-body">
          <span class="earnings-ticker">${e.ticker}</span>
          <span class="earnings-name">${e.name}</span>
        </div>
        <span class="earnings-hour">${EARNINGS_HOUR_LABEL[e.hour] || ""}</span>
      </article>`;
    })
    .join("");

  list.innerHTML =
    rowsHtml +
    (showToggle ? buildListToggle("earnings", EARNINGS.length - EARNINGS_COLLAPSE_LIMIT, earningsExpanded) : "");
}

function initEarningsCalendar() {
  const list = document.getElementById("earningsList");

  list.addEventListener("click", (e) => {
    if (e.target.closest(".list-toggle")) {
      earningsExpanded = !earningsExpanded;
      renderEarningsCalendar();
      return;
    }
    const row = e.target.closest(".earnings-row");
    if (!row) return;
    const stock = STOCKS.find((s) => s.ticker === row.dataset.ticker);
    if (stock) openStockModal(stock);
  });

  list.addEventListener("keydown", (e) => {
    if (e.target.closest(".list-toggle")) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest(".earnings-row");
    if (!row) return;
    e.preventDefault();
    const stock = STOCKS.find((s) => s.ticker === row.dataset.ticker);
    if (stock) openStockModal(stock);
  });
}

function openNewsModal(item) {
  document.getElementById("modalTicker").textContent = item.ticker ? `[${item.ticker}]` : "";
  document.getElementById("modalTicker").hidden = !item.ticker;
  document.getElementById("modalHeadline").textContent = item.headline;
  document.getElementById("modalMeta").textContent = `${item.source} · ${item.time}`;
  document.getElementById("modalSummary").textContent =
    item.summary || "No hay un resumen disponible para esta noticia.";

  const linkEl = document.getElementById("modalSourceLink");
  if (item.url && isSafeHttpUrl(item.url)) {
    linkEl.href = item.url;
    linkEl.hidden = false;
  } else {
    linkEl.hidden = true;
  }

  const overlay = document.getElementById("newsModal");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  overlay.querySelector(".modal-close").focus();
}

function closeNewsModal() {
  document.getElementById("newsModal").hidden = true;
  document.body.style.overflow = "";
}

function initNewsModal() {
  const list = document.getElementById("newsList");
  const overlay = document.getElementById("newsModal");

  const activate = (target) => {
    const item = target.closest(".news-item");
    if (!item) return;
    const news = NEWS[Number(item.dataset.index)];
    if (news) openNewsModal(news);
  };

  list.addEventListener("click", (e) => {
    if (e.target.closest(".list-toggle")) {
      newsExpanded = !newsExpanded;
      renderNews();
      return;
    }
    activate(e.target);
  });
  list.addEventListener("keydown", (e) => {
    if (e.target.closest(".list-toggle")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(e.target);
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest(".modal-close")) closeNewsModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeNewsModal();
  });
}

// Mi posición — solo se ofrece a acciones ya favoritas: la estrella es la
// intención declarada de "esto me importa", cargar un precio de compra es
// el paso siguiente natural, no algo que se le pida a cualquier fila.
function renderPositionSection(stock) {
  const el = document.getElementById("stockModalPosition");
  if (!favorites.has(stock.ticker)) {
    el.innerHTML = `<p class="position-nudge">Marcá esta acción como favorita (★) para trackear tu posición acá — el precio de compra queda solo en tu navegador, nunca se manda a ningún servidor.</p>`;
    return;
  }
  const cost = costBasis[stock.ticker];
  if (cost == null) {
    el.innerHTML = `
      <p class="position-label">Mi posición</p>
      <form class="position-form" data-position-form>
        <input type="number" inputmode="decimal" step="0.01" min="0" placeholder="Precio de compra, ej: ${stock.price.toFixed(2)}" aria-label="Precio de compra">
        <button type="submit" class="btn-ghost">Guardar</button>
      </form>`;
    return;
  }
  const pnlPct = ((stock.price - cost) / cost) * 100;
  const pnlAbs = stock.price - cost;
  const cls = pnlPct >= 0 ? "up" : "down";
  const sign = pnlPct >= 0 ? "+" : "";
  el.innerHTML = `
    <p class="position-label">Mi posición — compraste a $${cost.toFixed(2)}</p>
    <div class="position-summary">
      <span class="position-pnl ${cls}">${sign}$${pnlAbs.toFixed(2)} (${sign}${pnlPct.toFixed(1)}%)</span>
      <button type="button" class="position-clear" data-position-clear>Borrar</button>
    </div>`;
}

function initPositionSection() {
  const el = document.getElementById("stockModalPosition");
  el.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-position-form]");
    if (!form || !currentModalStock) return;
    e.preventDefault();
    const input = form.querySelector("input");
    const value = parseFloat(input.value);
    if (!Number.isFinite(value) || value <= 0) return;
    setCostBasis(currentModalStock.ticker, value);
    renderPositionSection(currentModalStock);
  });
  el.addEventListener("click", (e) => {
    if (!e.target.closest("[data-position-clear]") || !currentModalStock) return;
    clearCostBasis(currentModalStock.ticker);
    renderPositionSection(currentModalStock);
  });
}

// Beat/miss del último resultado — dato real de Finnhub (actual vs.
// estimado de consenso), no una inferencia nuestra. Se esconde entero si el
// pipeline todavía no trajo esta información para el ticker.
function renderLastEarnings(stock) {
  const el = document.getElementById("stockModalLastEarnings");
  const e = stock.lastEarnings;
  if (!e || e.surprisePercent == null) {
    el.innerHTML = "";
    return;
  }
  const beat = e.surprisePercent > 0.5;
  const miss = e.surprisePercent < -0.5;
  const cls = beat ? "up" : miss ? "down" : "mixed";
  const label = beat
    ? `Superó la estimación en ${e.surprisePercent.toFixed(1)}%`
    : miss
    ? `Por debajo de la estimación en ${Math.abs(e.surprisePercent).toFixed(1)}%`
    : "En línea con la estimación";
  const periodLabel = e.period ? formatEarningsMonth(e.period) : "";
  const actualLabel = e.actual != null ? `$${e.actual.toFixed(2)}` : "N/D";
  const estimateLabel = e.estimate != null ? `$${e.estimate.toFixed(2)}` : "N/D";
  el.innerHTML = `
    <span class="earnings-surprise ${cls}">${label}</span>
    <span class="earnings-surprise-meta">Último resultado${periodLabel ? " · " + periodLabel : ""} — EPS real ${actualLabel} vs. estimado ${estimateLabel}</span>`;
}

let currentModalStock = null;

function openStockModal(stock) {
  currentModalStock = stock;
  const changeSign = stock.changePct >= 0 ? "+" : "";
  const changeCls = stock.changePct >= 0 ? "up" : "down";

  document.getElementById("stockModalTicker").textContent = stock.ticker;
  document.getElementById("stockModalName").textContent = stock.name;
  document.getElementById("stockModalPrice").textContent = `$${stock.price.toFixed(2)}`;
  const changeEl = document.getElementById("stockModalChange");
  changeEl.textContent = `${changeSign}${stock.changePct.toFixed(1)}%`;
  changeEl.className = `stock-modal-change ${changeCls}`;
  const tagEl = document.getElementById("stockModalTag");
  tagEl.textContent = sentimentLabel[stock.sentiment];
  tagEl.className = `stock-tag ${stock.sentiment}`;

  renderPositionSection(stock);

  const hasOhlc = Array.isArray(stock.ohlc) && stock.ohlc.length > 1;
  document.getElementById("stockModalChart").innerHTML = hasOhlc
    ? buildCandlestickChart(stock.ohlc)
    : buildStockDetailChart(stock.spark);
  document.getElementById("stockModalChartCaption").textContent = hasOhlc
    ? `Histórico diario real (apertura/máximo/mínimo/cierre), últimas ${stock.ohlc.length} ruedas`
    : stock.spark.length > 2
    ? `Últimas ${stock.spark.length} actualizaciones de precio (no es un histórico de velas)`
    : "Historial de precio todavía corto: se enriquece cada hora que corre el pipeline.";

  renderLastEarnings(stock);

  document.getElementById("stockModalFundamentals").innerHTML = buildFundamentalsGrid(stock.fundamentals);
  document.getElementById("fundamentalsHelp").hidden = true;
  document.getElementById("fundamentalsHelpToggle").setAttribute("aria-expanded", "false");

  const related = NEWS.filter((n) => n.ticker === stock.ticker);
  const relatedEl = document.getElementById("stockModalNews");
  relatedEl.innerHTML = related.length
    ? related
        .map(
          (n) => `<button class="stock-modal-news-item" data-related-index="${NEWS.indexOf(n)}">
            <span class="news-dot ${n.sentiment}" aria-hidden="true"></span>
            <span class="stock-modal-news-headline">${escapeHtml(n.headline)}</span>
          </button>`
        )
        .join("")
    : `<p class="stock-modal-news-empty">Sin noticias recientes para este ticker.</p>`;

  const overlay = document.getElementById("stockModal");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  overlay.querySelector(".modal-close").focus();
}

function closeStockModal() {
  document.getElementById("stockModal").hidden = true;
  document.body.style.overflow = "";
}

function initStockModal() {
  const grid = document.getElementById("stockGrid");
  const overlay = document.getElementById("stockModal");
  const helpToggle = document.getElementById("fundamentalsHelpToggle");
  const helpPanel = document.getElementById("fundamentalsHelp");

  helpToggle.addEventListener("click", () => {
    const expanded = helpToggle.getAttribute("aria-expanded") === "true";
    helpToggle.setAttribute("aria-expanded", String(!expanded));
    helpPanel.hidden = expanded;
  });

  const activate = (target) => {
    const row = target.closest(".stock-row");
    if (!row) return;
    const stock = STOCKS.find((s) => s.ticker === row.dataset.ticker);
    if (stock) openStockModal(stock);
  };

  grid.addEventListener("click", (e) => {
    if (e.target.closest(".list-toggle")) {
      stocksExpanded = !stocksExpanded;
      const activeChip = document.querySelector(".chip.active");
      renderStocks(activeChip ? activeChip.dataset.filter : "all", document.getElementById("searchInput").value);
      return;
    }
    const starBtn = e.target.closest(".stock-star");
    if (starBtn) {
      e.stopPropagation();
      toggleFavorite(starBtn.dataset.star);
      const activeChip = document.querySelector(".chip.active");
      renderStocks(activeChip ? activeChip.dataset.filter : "all", document.getElementById("searchInput").value);
      return;
    }
    activate(e.target);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.target.closest(".stock-star") || e.target.closest(".list-toggle")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(e.target);
    }
  });

  overlay.addEventListener("click", (e) => {
    const relatedBtn = e.target.closest(".stock-modal-news-item");
    if (relatedBtn) {
      const news = NEWS[Number(relatedBtn.dataset.relatedIndex)];
      closeStockModal();
      if (news) openNewsModal(news);
      return;
    }
    if (e.target === overlay || e.target.closest(".modal-close")) closeStockModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeStockModal();
  });
}

function renderLastUpdated() {
  const date = lastUpdatedIso ? new Date(lastUpdatedIso) : new Date();
  const formatted = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("lastUpdated").textContent = `Actualizado a las ${formatted}`;
}

function renderDataSourcePill() {
  const pill = document.getElementById("dataSourcePill");
  if (isLiveData) {
    pill.textContent = "DATOS EN VIVO";
    pill.classList.add("live-pill");
  } else {
    pill.textContent = "DATOS DE DEMOSTRACIÓN";
    pill.classList.remove("live-pill");
  }
}

function isNyseOpenNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const map = {};
  parts.forEach((p) => (map[p.type] = p.value));
  const isWeekday = !["Sat", "Sun"].includes(map.weekday);
  const minutesSinceMidnight = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);
  // Regular session only, 9:30-16:00 ET. Doesn't account for market
  // holidays (Thanksgiving, etc.) — a known simplification, not a bug.
  return isWeekday && minutesSinceMidnight >= 9 * 60 + 30 && minutesSinceMidnight < 16 * 60;
}

function renderMarketStatus() {
  const el = document.getElementById("marketStatus");
  const open = isNyseOpenNow();
  el.textContent = open ? "Mercado abierto" : "Mercado cerrado";
  el.classList.toggle("open", open);
  el.classList.toggle("closed", !open);
}

function renderTickerTape() {
  const track = document.getElementById("tickerTrack");
  const items = STOCKS.map((s) => {
    const changeSign = s.changePct >= 0 ? "+" : "";
    const changeCls = s.changePct >= 0 ? "up" : "down";
    return `<span class="ticker-item">
      <span class="t-ticker">${s.ticker}</span>
      <span class="t-price">$${s.price.toFixed(2)}</span>
      <span class="t-change ${changeCls}">${changeSign}${s.changePct.toFixed(1)}%</span>
    </span>`;
  }).join("");
  // Duplicated once so the CSS translateX(-50%) loop is seamless.
  track.innerHTML = items + items;
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

function initFilters() {
  const group = document.getElementById("filterGroup");
  const search = document.getElementById("searchInput");
  let activeFilter = "all";

  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    group.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    stocksExpanded = false;
    renderStocks(activeFilter, search.value);
  });

  search.addEventListener("input", () => {
    stocksExpanded = false;
    renderStocks(activeFilter, search.value);
  });
}

function initLedgerSort() {
  const head = document.getElementById("ledgerHead");
  head.addEventListener("click", (e) => {
    const btn = e.target.closest(".ledger-sort");
    if (!btn) return;
    const key = btn.dataset.sort;
    if (sortState.key === key) {
      sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
    } else {
      sortState.key = key;
      sortState.dir = key === "name" ? "asc" : "desc";
    }
    updateSortIndicators();
    const activeChip = document.querySelector(".chip.active");
    const filter = activeChip ? activeChip.dataset.filter : "all";
    renderStocks(filter, document.getElementById("searchInput").value);
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3000);
}

function initInstallPrompt() {
  const installBtn = document.getElementById("installBtn");
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") showToast("¡App instalada!");
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installBtn.hidden = true;
    showToast("¡App instalada!");
  });
}

function initServiceWorker() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        /* offline support is best-effort for the demo */
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Preloader — shown instantly from the HTML, hidden once init() has
// actually painted real content (not on a fixed timer, and not on window
// "load", which would wait on fonts/icons that don't block first paint).
// A small minimum display time keeps it from flashing imperceptibly on a
// fast local fetch; window "load" stays as a safety net in case init()
// throws somewhere unexpected.
// ---------------------------------------------------------------------------

const PRELOADER_MIN_MS = 250;
const preloaderStart = performance.now();

function hidePreloader() {
  const el = document.getElementById("preloader");
  if (!el || el.dataset.hidden) return;
  el.dataset.hidden = "1";
  const wait = Math.max(0, PRELOADER_MIN_MS - (performance.now() - preloaderStart));
  setTimeout(() => {
    el.classList.add("hidden");
    setTimeout(() => el.remove(), 400);
  }, wait);
}

window.addEventListener("load", hidePreloader);

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  await loadData();
  renderHeroChart();
  renderSectorSummary();
  renderHeroMovers();
  renderHeroBreadth();
  renderStocks();
  renderNews();
  renderEarningsCalendar();
  renderLastUpdated();
  renderDataSourcePill();
  renderTickerTape();
  renderMarketStatus();
  setInterval(renderMarketStatus, 60000);
  initFilters();
  initLedgerSort();
  initNewsModal();
  initStockModal();
  initPositionSection();
  initHeroChartRange();
  initEarningsCalendar();
  initInstallPrompt();
  initServiceWorker();
  hidePreloader();
}

init();
