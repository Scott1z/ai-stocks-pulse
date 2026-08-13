// ---------------------------------------------------------------------------
// AI QuickCap — data layer.
// On load, tries to fetch ./data.json (written by pipeline/fetch_and_curate.py).
// If it's missing or malformed (e.g. the pipeline hasn't run yet), falls back
// to the DEMO_* constants below so the page always renders something.
// ---------------------------------------------------------------------------

const DEMO_STOCKS = [
  {
    ticker: "NVDA",
    name: "NVIDIA",
    subsector: "semis",
    price: 128.45,
    changePct: 3.2,
    sentiment: "bullish",
    blurb: "La demanda de chips para centros de datos de IA sigue superando las expectativas de los analistas.",
    spark: [110, 112, 109, 115, 118, 116, 121, 119, 124, 122, 126, 128.45],
    fundamentals: { peTTM: 54.2, epsTTM: 2.37, marketCapM: 3150000, week52High: 153.13, week52Low: 86.62, roeTTM: 91.9, netMarginTTM: 55.7 },
    lastEarnings: { period: "2026-05-28", actual: 0.96, estimate: 0.88, surprisePercent: 9.1 },
    thesis: {
      text: "Domina el mercado de GPUs para entrenamiento e inferencia de IA, con márgenes que reflejan esa posición casi monopólica en centros de datos.",
      catalyst: "Próximo resultado trimestral y ritmo de pedidos de la nueva arquitectura de chips.",
    },
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    subsector: "megacap",
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
    subsector: "megacap",
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
    subsector: "megacap",
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
    subsector: "megacap",
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
    subsector: "semis",
    price: 154.75,
    changePct: -2.1,
    sentiment: "bearish",
    blurb: "Analistas rebajan estimaciones ante la fuerte competencia de NVIDIA en GPUs de IA.",
    spark: [163, 161, 159, 160, 158, 156, 157, 155, 153, 156, 155, 154.75],
    fundamentals: { peTTM: 105.3, epsTTM: 1.47, marketCapM: 251000, week52High: 187.28, week52Low: 76.48, roeTTM: 5.1, netMarginTTM: 6.4 },
    lastEarnings: { period: "2026-05-06", actual: 0.62, estimate: 0.68, surprisePercent: -8.8 },
    thesis: {
      text: "Segundo jugador en GPUs de IA, apostando a ganar participación con precio más competitivo frente al líder del mercado.",
      catalyst: "Adopción de su nueva línea de aceleradores por parte de grandes clientes de nube.",
    },
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
    { label: "Empresas al alza", value: "4 / 6", cls: "up", kind: "ratio", raw: 4, total: 6 },
    { label: "Cambio promedio", value: "+0.7%", cls: "up", kind: "percent", raw: 0.7 },
    { label: "Noticias hoy", value: "8", kind: "count", raw: 8 },
  ],
};

const DEMO_EARNINGS = [
  { ticker: "NVDA", name: "NVIDIA", date: "2026-08-20", hour: "amc" },
  { ticker: "AMD", name: "Advanced Micro Devices", date: "2026-08-25", hour: "amc" },
  { ticker: "MSFT", name: "Microsoft", date: "2026-09-09", hour: "amc" },
  { ticker: "GOOGL", name: "Alphabet", date: "2026-09-15", hour: "amc" },
  { ticker: "META", name: "Meta Platforms", date: "2026-10-14", hour: "amc" },
];

const DEMO_ARCHIVE = [
  { date: "2026-08-05", sentiment: "mixed", text: "Jornada dispar: los semiconductores retroceden por toma de ganancias mientras el software de IA sostiene el tono positivo del sector.", stats: { upCount: 3, totalCount: 6, avgChangePct: -0.1, newsCount: 6 }, topMover: { ticker: "MSFT", changePct: 1.8 }, topLoser: { ticker: "AMD", changePct: -2.6 } },
  { date: "2026-08-06", sentiment: "bullish", text: "El sector avanza con fuerza tras señales de demanda sostenida de cómputo para IA en la nube, liderado por los proveedores de infraestructura.", stats: { upCount: 5, totalCount: 6, avgChangePct: 1.4, newsCount: 9 }, topMover: { ticker: "NVDA", changePct: 4.1 }, topLoser: { ticker: "GOOGL", changePct: -0.6 } },
  { date: "2026-08-07", sentiment: "bullish", text: "Nuevo máximo del día para NVIDIA impulsa al resto del sector, aunque el mercado sigue de cerca el gasto en infraestructura de las grandes tecnológicas.", stats: { upCount: 4, totalCount: 6, avgChangePct: 0.9, newsCount: 7 }, topMover: { ticker: "NVDA", changePct: 3.2 }, topLoser: { ticker: "AMD", changePct: -1.1 } },
  { date: "2026-08-08", sentiment: "mixed", text: "Sin una tendencia clara: los resultados mixtos de la semana dejan al sector operando lateral, a la espera de nuevos catalizadores.", stats: { upCount: 3, totalCount: 6, avgChangePct: 0.1, newsCount: 5 }, topMover: { ticker: "META", changePct: 1.6 }, topLoser: { ticker: "GOOGL", changePct: -1.4 } },
  { date: "2026-08-11", sentiment: "bullish", text: "El sector de acciones de IA muestra un tono mayoritariamente alcista, liderado por NVIDIA y Microsoft tras resultados que superan expectativas.", stats: { upCount: 4, totalCount: 6, avgChangePct: 0.7, newsCount: 8 }, topMover: { ticker: "NVDA", changePct: 3.2 }, topLoser: { ticker: "AMD", changePct: -2.1 } },
];

let STOCKS = DEMO_STOCKS;
let NEWS = DEMO_NEWS;
let SECTOR_SUMMARY = DEMO_SECTOR_SUMMARY;
let EARNINGS = DEMO_EARNINGS;
let ARCHIVE = DEMO_ARCHIVE;
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

// Alerta de movimiento — compara el precio actual de cada favorita contra
// el último precio visto (guardado localmente, nunca en un servidor), no
// contra el cambio del día. Se corre una sola vez al cargar la página (no
// en cada auto-refresh de 5 minutos — el punto es "cuánto se movió desde tu
// última VISITA", no reventar de toasts durante la misma sesión) y
// reescribe el snapshot con los precios actuales al final, así la próxima
// visita compara contra este momento. Sin backend, sin cuenta: el umbral
// es fijo (no hay UI para configurarlo todavía) porque agregar esa
// configuración no se pidió y hoy no cambiaría el comportamiento por
// defecto para nadie.
const FAVORITE_ALERTS_KEY = "aisp_favorite_last_prices";
const FAVORITE_ALERT_THRESHOLD_PCT = 5;

function checkFavoritePriceAlerts() {
  if (favorites.size === 0) return;

  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(FAVORITE_ALERTS_KEY) || "{}");
  } catch {
    stored = {};
  }

  const movers = [];
  const nextStored = {};
  favorites.forEach((ticker) => {
    const stock = STOCKS.find((s) => s.ticker === ticker);
    if (!stock || stock.price == null) return;
    nextStored[ticker] = stock.price;
    const prevPrice = stored[ticker];
    if (prevPrice == null || prevPrice <= 0) return;
    const pct = ((stock.price - prevPrice) / prevPrice) * 100;
    if (Math.abs(pct) >= FAVORITE_ALERT_THRESHOLD_PCT) movers.push({ ticker, pct });
  });

  try {
    localStorage.setItem(FAVORITE_ALERTS_KEY, JSON.stringify(nextStored));
  } catch {
    /* localStorage unavailable — la alerta simplemente no persiste entre visitas */
  }

  if (!movers.length) return;
  movers.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const parts = movers.slice(0, 3).map((m) => `${m.ticker} ${m.pct >= 0 ? "+" : ""}${m.pct.toFixed(1)}%`);
  const extra = movers.length > 3 ? ` y ${movers.length - 3} más` : "";
  showToast(`Desde tu última visita: ${parts.join(", ")}${extra}`);
}

// Mi posición — precio de compra + cantidad de acciones, opcional por
// ticker favorito, para calcular una ganancia/pérdida hipotética total.
// Todo local (localStorage), nunca se manda a ningún servidor — no hay
// backend que lo reciba.
const COST_BASIS_KEY = "aisp_cost_basis";
let costBasis = {};
try {
  costBasis = JSON.parse(localStorage.getItem(COST_BASIS_KEY) || "{}");
} catch {
  costBasis = {};
}

// getPosition() normaliza el formato viejo (solo precio, sin cantidad) al
// abrirlo, así una posición cargada antes de sumar "cantidad de acciones"
// no se rompe — simplemente se ve sin cantidad hasta que se re-guarde.
function getPosition(ticker) {
  const raw = costBasis[ticker];
  if (raw == null) return null;
  if (typeof raw === "number") return { price: raw, shares: null };
  return raw;
}

function setPosition(ticker, price, shares) {
  costBasis[ticker] = { price, shares };
  try {
    localStorage.setItem(COST_BASIS_KEY, JSON.stringify(costBasis));
  } catch {
    /* localStorage unavailable — no persiste, pero no rompe la sesión actual */
  }
}

function clearPosition(ticker) {
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
//              source_url, source, published_at: "<ISO 8601>"|null }],
//   "archive": [{ date: "YYYY-MM-DD", sentiment, text, stats: {...},
//                 topMover: { ticker, changePct }|null, topLoser: {...}|null }]
//              (últimos 30 días, uno por fecha, más reciente al final)
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

// ---------------------------------------------------------------------------
// Animación — utilidades compartidas para el pase de "hacer la interfaz
// más dinámica": conteo animado de números, y ayuda para respetar
// prefers-reduced-motion en el JS (el CSS global ya lo respeta para
// transiciones/animaciones declarativas; esto cubre las que se calculan
// a mano cuadro a cuadro).
// ---------------------------------------------------------------------------

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Delay (ms) para la animación de entrada escalonada de items de lista
// (.stagger-item en styles.css) — crece con el índice pero con techo, así
// una lista larga no tarda "sensiblemente más" en terminar de aparecer
// que una corta.
function staggerDelay(i) {
  return Math.min(i * 15, 200);
}

// Anima el texto de `el` de `from` a `to`, con easing ease-out cúbico.
// `decimals`/`prefix`/`suffix`/`signed` controlan el formato de cada
// cuadro para que coincida exactamente con el string final que hubiera
// puesto un render estático (así no hay salto al terminar la animación).
function animateNumber(el, from, to, { duration = 700, decimals = 0, prefix = "", suffix = "", signed = false } = {}) {
  if (!el) return;
  const format = (n) => {
    const sign = signed && n >= 0 ? "+" : "";
    return `${sign}${prefix}${n.toFixed(decimals)}${suffix}`;
  };
  if (prefersReducedMotion() || from === to || !Number.isFinite(from) || !Number.isFinite(to)) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function normalizeRealData(json) {
  const news = (json.news || []).map((n) => ({
    headline: n.headline,
    summary: n.summary || "",
    source: n.source || hostnameFromUrl(n.source_url),
    time: relativeTime(n.published_at),
    publishedAt: n.published_at || null,
    ticker: (n.tickers && n.tickers[0]) || null,
    sentiment: NEWS_SENTIMENT_MAP[n.sentiment] || "mixed",
    url: n.source_url || null,
    image: n.image || null,
  }));

  const stocks = (json.stocks || [])
    .filter((s) => s.price != null)
    .map((s) => ({
      ticker: s.ticker,
      name: s.name || s.ticker,
      subsector: s.subsector || null,
      price: s.price,
      changePct: s.changePct ?? 0,
      sentiment: classifyBySign(s.changePct ?? 0),
      blurb: findBlurbForTicker(json.news || [], s.ticker),
      spark: s.spark && s.spark.length >= 2 ? s.spark : [s.price, s.price],
      fundamentals: s.fundamentals || {},
      ohlc: Array.isArray(s.ohlc) ? s.ohlc : [],
      lastEarnings: s.lastEarnings || null,
      thesis: s.thesis && s.thesis.text ? s.thesis : null,
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
        kind: "ratio",
        raw: stats.upCount ?? 0,
        total: stats.totalCount ?? stocks.length,
      },
      {
        label: "Cambio promedio",
        value: `${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%`,
        cls: avg >= 0 ? "up" : "down",
        kind: "percent",
        raw: avg,
      },
      { label: "Noticias hoy", value: String(stats.newsCount ?? news.length), kind: "count", raw: stats.newsCount ?? news.length },
    ],
  };

  const earnings = (json.earningsCalendar || []).map((e) => ({
    ticker: e.ticker,
    name: e.name || e.ticker,
    date: e.date,
    hour: e.hour || "",
  }));

  const archive = (json.archive || [])
    .filter((a) => a.date)
    .map((a) => ({
      date: a.date,
      sentiment: a.sentiment || "mixed",
      text: a.text || "",
      stats: a.stats || {},
      topMover: a.topMover || null,
      topLoser: a.topLoser || null,
    }));

  return { stocks, news, sectorSummary, earnings, archive };
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
    // Sin fallback a DEMO_ARCHIVE acá: si hay datos reales (isLiveData=true)
    // pero el historial todavía está vacío (pipeline recién desplegado, no
    // acumuló días todavía), mostrar días de demostración sería mentir bajo
    // la etiqueta de "datos reales". renderHistory() esconde la sección en
    // ese caso, igual que el calendario de resultados cuando no hay balances.
    ARCHIVE = normalized.archive;
    isLiveData = true;
    lastUpdatedIso = json.updated_at || null;
  } catch (err) {
    STOCKS = DEMO_STOCKS;
    NEWS = DEMO_NEWS;
    SECTOR_SUMMARY = DEMO_SECTOR_SUMMARY;
    EARNINGS = DEMO_EARNINGS;
    ARCHIVE = DEMO_ARCHIVE;
    isLiveData = false;
    lastUpdatedIso = null;
  }
}

// Auto-refresh silencioso: cada REFRESH_INTERVAL_MS, si la pestaña está
// visible, vuelve a pedir data.json y — solo si updated_at cambió de
// verdad — re-renderiza todo con los mismos render*() que usa la carga
// inicial (misma lista de siempre, así nunca queda una sección desactualizada
// mientras otra sí se actualiza). Un fallo de red acá se ignora en
// silencio: a diferencia de loadData(), NO cae a datos de demostración —
// eso reemplazaría datos reales ya buenos por placeholders, peor que
// simplemente reintentar en el próximo ciclo.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function refreshData() {
  if (document.visibilityState === "hidden") return;
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    if (!json.updated_at || json.updated_at === lastUpdatedIso) return; // nada nuevo, no re-renderizar por las dudas

    const normalized = normalizeRealData(json);
    if (!normalized.stocks.length) return;

    STOCKS = normalized.stocks;
    NEWS = normalized.news;
    SECTOR_SUMMARY = normalized.sectorSummary;
    EARNINGS = normalized.earnings;
    ARCHIVE = normalized.archive;
    isLiveData = true;
    lastUpdatedIso = json.updated_at;

    renderHeroChart();
    renderSectorSummary();
    renderHeroMovers();
    renderHeroBreadth();
    renderSelection();
    renderStocksViews();
    renderCompareSection();
    renderNews();
    renderEarningsCalendar();
    renderHistory();
    renderLastUpdated();
    renderDataSourcePill();
    renderTickerTape();
    showToast("Datos actualizados");
  } catch {
    // Falla silenciosa — se reintenta solo en el próximo ciclo.
  }
}

function initAutoRefresh() {
  setInterval(refreshData, REFRESH_INTERVAL_MS);
  // Si la pestaña estuvo oculta un rato largo (usuario cambió de tab),
  // conviene chequear apenas vuelve en vez de esperar hasta el próximo
  // tick del interval, que puede estar lejos.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshData();
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const sentimentLabel = { bullish: "Alcista", bearish: "Bajista", mixed: "Mixta" };

// Sub-sector editorial (ver SUBSECTOR en pipeline/fetch_and_curate.py para el
// criterio de clasificación) — el pipeline manda la clave cruda ("semis" /
// "software" / "megacap"), el frontend es dueño del texto que se muestra,
// mismo patrón que sentimentLabel de arriba.
const SUBSECTOR_LABEL = { semis: "Semis", software: "Software y nube", megacap: "Mega-cap" };

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
    return { series: stocks.map((s) => s.spark.slice(-length)), dates: null };
  }
  const withOhlc = stocks.filter((s) => Array.isArray(s.ohlc) && s.ohlc.length >= 2);
  if (withOhlc.length < 2) return null;
  const days = range === "30d" ? 30 : 60;
  const length = Math.min(days, ...withOhlc.map((s) => s.ohlc.length));
  if (length < 2) return null;
  // Las fechas se toman de un solo ticker (asumiendo ruedas alineadas entre
  // tickers, la misma simplificación que ya usa el resto del cálculo del
  // índice) — solo para las etiquetas de fecha, no afecta el promedio.
  const dates = withOhlc[0].ohlc.slice(-length).map((c) => c.date);
  return { series: withOhlc.map((s) => s.ohlc.slice(-length).map((c) => c.close)), dates };
}

// Conversión Catmull-Rom → Bézier cúbico (tensión uniforme 1/6) para que la
// línea pase suave por cada punto real en vez de quebrarse en segmentos
// rectos — mismo dato, mejor lectura. Fórmula estándar, sin overshoot para
// series financieras con este espaciado.
function smoothPath(coords) {
  if (coords.length < 3) {
    return `M${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L")}`;
  }
  let d = `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTH_NAMES_ES[m - 1].slice(0, 3)}`;
}

function buildCompositeChart({ series, dates }) {
  const length = Math.min(...series.map((s) => s.length));
  if (length < 2) return null;

  const composite = [];
  for (let i = 0; i < length; i++) {
    const avgReturn =
      series.reduce((sum, s) => sum + ((s[i] - s[0]) / s[0]) * 100, 0) / series.length;
    composite.push(avgReturn);
  }

  const w = 520, h = 180, padX = 12, padTop = 16, padBottom = 26;
  const innerH = h - padTop - padBottom;
  const min = Math.min(...composite, 0);
  const max = Math.max(...composite, 0);
  const range = max - min || 1;
  const stepX = (w - padX * 2) / (composite.length - 1);
  const coords = composite.map((v, i) => ({
    x: padX + i * stepX,
    y: padTop + (1 - (v - min) / range) * innerH,
  }));
  const zeroY = padTop + (1 - (0 - min) / range) * innerH;
  const baseline = h - padBottom;

  const finalReturn = composite[composite.length - 1];
  const up = finalReturn >= 0;
  const color = up ? "var(--rise)" : "var(--fall)";
  const colorDim = up ? "var(--rise-dim)" : "var(--fall-dim)";

  const linePath = smoothPath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${first.x.toFixed(1)},${baseline.toFixed(1)} Z`;

  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const y = (padTop + f * innerH).toFixed(1);
      return `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    })
    .join("");

  const startLabel = dates ? formatShortDate(dates[0]) : "Inicio";
  const endLabel = dates ? formatShortDate(dates[dates.length - 1]) : "Ahora";

  const svg = `<svg class="hero-chart-svg" id="heroChartSvg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLines}
    <line x1="${padX}" y1="${zeroY.toFixed(1)}" x2="${w - padX}" y2="${zeroY.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3,3"/>
    <path d="${areaPath}" fill="url(#heroChartFill)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="7" fill="${colorDim}"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.5" fill="${color}"/>
    <line class="hero-chart-crosshair" x1="0" y1="${padTop}" x2="0" y2="${baseline.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1" opacity="0"/>
    <circle class="hero-chart-hover-dot" cx="0" cy="0" r="4" fill="${color}" stroke="var(--panel)" stroke-width="1.5" opacity="0"/>
    <text x="${padX}" y="${h - 6}" class="hero-chart-axis-label">${escapeHtml(startLabel)}</text>
    <text x="${(w - padX).toFixed(1)}" y="${h - 6}" class="hero-chart-axis-label" text-anchor="end">${escapeHtml(endLabel)}</text>
  </svg>`;

  return { finalReturn, up, svg, coords, composite, dates, w, h };
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
let heroChartData = null; // último resultado de buildCompositeChart, para el hover/crosshair

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
  heroChartData = result || null;

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

// Crosshair + tooltip al pasar el mouse (o el dedo) sobre la curva — antes
// el gráfico solo mostraba el valor final, sin forma de leer un punto
// intermedio. El tooltip vive en document.body (position: fixed) en vez de
// adentro de #heroChart, porque renderHeroChart() reemplaza ese innerHTML
// entero en cada render (cambio de rango) y se lo hubiera llevado puesto.
function initHeroChartInteraction() {
  const container = document.getElementById("heroChart");
  const tooltip = document.createElement("div");
  tooltip.className = "hero-chart-tooltip";
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  const hide = () => {
    tooltip.hidden = true;
    const svg = document.getElementById("heroChartSvg");
    svg?.querySelector(".hero-chart-hover-dot")?.setAttribute("opacity", "0");
    svg?.querySelector(".hero-chart-crosshair")?.setAttribute("opacity", "0");
  };

  const handleMove = (clientX, clientY) => {
    if (!heroChartData) return hide();
    const svg = document.getElementById("heroChartSvg");
    if (!svg) return hide();
    const rect = svg.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return hide();
    }
    const relX = ((clientX - rect.left) / rect.width) * heroChartData.w;
    let nearest = 0;
    let nearestDist = Infinity;
    heroChartData.coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    const point = heroChartData.coords[nearest];
    const value = heroChartData.composite[nearest];
    const dateLabel = heroChartData.dates ? formatShortDate(heroChartData.dates[nearest]) : null;

    svg.querySelector(".hero-chart-hover-dot")?.setAttribute("cx", point.x.toFixed(1));
    svg.querySelector(".hero-chart-hover-dot")?.setAttribute("cy", point.y.toFixed(1));
    svg.querySelector(".hero-chart-hover-dot")?.setAttribute("opacity", "1");
    svg.querySelector(".hero-chart-crosshair")?.setAttribute("x1", point.x.toFixed(1));
    svg.querySelector(".hero-chart-crosshair")?.setAttribute("x2", point.x.toFixed(1));
    svg.querySelector(".hero-chart-crosshair")?.setAttribute("opacity", "1");

    const sign = value >= 0 ? "+" : "";
    tooltip.innerHTML = `${
      dateLabel ? `<span class="hero-chart-tooltip-date">${dateLabel}</span>` : ""
    }<span class="hero-chart-tooltip-value ${value >= 0 ? "up" : "down"}">${sign}${value.toFixed(1)}%</span>`;
    tooltip.hidden = false;

    const tw = tooltip.offsetWidth;
    let left = clientX + 14;
    if (left + tw > window.innerWidth - 8) left = clientX - tw - 14;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(8, clientY - 12)}px`;
  };

  container.addEventListener("mousemove", (e) => handleMove(e.clientX, e.clientY));
  container.addEventListener("mouseleave", hide);
  container.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  container.addEventListener("touchend", hide);
}

function initHeroChartRange() {
  document.getElementById("heroChart").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-range]");
    if (!btn) return;
    heroChartRange = btn.dataset.range;
    renderHeroChart();
  });
}

// ---------------------------------------------------------------------------
// Comparador de acciones — hasta 3 tickers superpuestos en un mismo
// gráfico. Reusa exactamente la curva suave (smoothPath) y el rango
// Hoy/30d/60d del gráfico compuesto del hero, pero sin promediar: cada
// ticker es su propia línea. Tres colores fijos, no uno por ticker — la
// misma excepción ya documentada para Category Icons (tertiary, fuera del
// One Accent Rule, pero acotada y desaturada), extendida acá en vez de
// inventar una paleta nueva.
// ---------------------------------------------------------------------------

const COMPARE_COLORS = ["var(--accent)", "var(--icon-teal)", "var(--icon-indigo)"];
const COMPARE_MAX = 3;
let compareTickers = [];
let compareRange = "today";

function buildCompareSeries(tickers, range) {
  return tickers.map((ticker) => {
    const stock = STOCKS.find((s) => s.ticker === ticker);
    if (!stock) return { ticker, name: ticker, points: null, dates: null, unavailable: true };
    if (range === "today") {
      return { ticker, name: stock.name, points: stock.spark, dates: null, unavailable: false };
    }
    const days = range === "30d" ? 30 : 60;
    if (!Array.isArray(stock.ohlc) || stock.ohlc.length < 2) {
      return { ticker, name: stock.name, points: null, dates: null, unavailable: true };
    }
    const slice = stock.ohlc.slice(-Math.min(days, stock.ohlc.length));
    return {
      ticker,
      name: stock.name,
      points: slice.map((c) => c.close),
      dates: slice.map((c) => c.date),
      unavailable: false,
    };
  });
}

function buildCompareChart(entries) {
  const available = entries.filter((e) => !e.unavailable && e.points && e.points.length >= 2);
  if (available.length < 2) return null;

  const length = Math.min(...available.map((e) => e.points.length));
  const w = 520, h = 200, padX = 12, padTop = 16, padBottom = 26;
  const innerH = h - padTop - padBottom;

  const series = available.map((e) => {
    const windowed = e.points.slice(-length);
    const base = windowed[0];
    return windowed.map((v) => ((v - base) / base) * 100);
  });

  const allValues = series.flat().concat([0]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const stepX = (w - padX * 2) / (length - 1);
  const zeroY = padTop + (1 - (0 - min) / range) * innerH;

  const gridLines = [0.25, 0.5, 0.75]
    .map((f) => {
      const y = (padTop + f * innerH).toFixed(1);
      return `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    })
    .join("");

  const paths = available
    .map((e, i) => {
      const coords = series[i].map((v, j) => ({
        x: padX + j * stepX,
        y: padTop + (1 - (v - min) / range) * innerH,
      }));
      const linePath = smoothPath(coords);
      const last = coords[coords.length - 1];
      const color = COMPARE_COLORS[i % COMPARE_COLORS.length];
      return `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.5" fill="${color}"/>`;
    })
    .join("");

  const dated = available.find((e) => e.dates);
  const startLabel = dated ? formatShortDate(dated.dates[dated.dates.length - length]) : "Inicio";
  const endLabel = dated ? formatShortDate(dated.dates[dated.dates.length - 1]) : "Ahora";

  const svg = `<svg class="hero-chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${gridLines}
    <line x1="${padX}" y1="${zeroY.toFixed(1)}" x2="${w - padX}" y2="${zeroY.toFixed(1)}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3,3"/>
    ${paths}
    <text x="${padX}" y="${h - 6}" class="hero-chart-axis-label">${escapeHtml(startLabel)}</text>
    <text x="${(w - padX).toFixed(1)}" y="${h - 6}" class="hero-chart-axis-label" text-anchor="end">${escapeHtml(endLabel)}</text>
  </svg>`;

  const legend = available
    .map((e, i) => {
      const finalReturn = series[i][series[i].length - 1];
      const sign = finalReturn >= 0 ? "+" : "";
      const cls = finalReturn >= 0 ? "up" : "down";
      return `<span class="compare-legend-item">
        <span class="compare-legend-dot" style="background:${COMPARE_COLORS[i % COMPARE_COLORS.length]}"></span>
        ${escapeHtml(e.ticker)}<span class="compare-legend-value ${cls}">${sign}${finalReturn.toFixed(1)}%</span>
      </span>`;
    })
    .join("");

  const skipped = entries.filter((e) => e.unavailable);
  const skippedNote = skipped.length
    ? `<p class="compare-skipped-note">${escapeHtml(
        skipped.map((e) => e.ticker).join(", ")
      )} sin cobertura de velas diarias para este rango — se excluye del gráfico.</p>`
    : "";

  return { svg, legend, skippedNote };
}

function renderCompareChips() {
  const el = document.getElementById("compareChips");
  el.innerHTML = compareTickers
    .map((ticker, i) => {
      const stock = STOCKS.find((s) => s.ticker === ticker);
      const label = stock ? stock.ticker : ticker;
      return `<span class="compare-chip">
        <span class="compare-chip-dot" style="background:${COMPARE_COLORS[i % COMPARE_COLORS.length]}"></span>
        ${escapeHtml(label)}
        <button type="button" class="compare-chip-remove" data-remove="${escapeHtml(ticker)}" aria-label="Quitar ${escapeHtml(label)} del comparador">×</button>
      </span>`;
    })
    .join("");
}

function renderCompareSuggestions(query) {
  const box = document.getElementById("compareSuggestions");
  const q = query.trim().toLowerCase();
  if (!q || compareTickers.length >= COMPARE_MAX) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  const matches = STOCKS.filter(
    (s) =>
      !compareTickers.includes(s.ticker) &&
      (s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  ).slice(0, 6);
  if (!matches.length) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  box.innerHTML = matches
    .map(
      (s) => `<button type="button" class="compare-suggestion-item" data-add="${escapeHtml(s.ticker)}">
      <span class="compare-suggestion-ticker">${escapeHtml(s.ticker)}</span>
      <span class="compare-suggestion-name">${escapeHtml(s.name)}</span>
    </button>`
    )
    .join("");
  box.hidden = false;
}

function renderCompareSection() {
  renderCompareChips();
  const chartEl = document.getElementById("compareChart");
  const rangeToggle = `<div class="hero-chart-range" role="tablist" aria-label="Rango del comparador">
    ${HERO_CHART_RANGES.map(
      (r) =>
        `<button type="button" role="tab" aria-selected="${r.key === compareRange}" class="${
          r.key === compareRange ? "active" : ""
        }" data-compare-range="${r.key}">${r.label}</button>`
    ).join("")}
  </div>`;

  if (compareTickers.length < 2) {
    chartEl.innerHTML = `${rangeToggle}<p class="compare-empty"><svg class="icon-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V9M12 19V4M20 19v-6"/></svg>Agregá al menos 2 empresas para comparar su rendimiento.</p>`;
    return;
  }

  const entries = buildCompareSeries(compareTickers, compareRange);
  const result = buildCompareChart(entries);
  if (!result) {
    const skipped = entries.filter((e) => e.unavailable);
    const message = skipped.length
      ? `${escapeHtml(skipped.map((e) => e.ticker).join(", "))} ${
          skipped.length > 1 ? "no tienen" : "no tiene"
        } cobertura de velas diarias para este rango — probá "Hoy" o cambiá la selección.`
      : "Todavía no hay suficiente historial diario para este rango con estas empresas.";
    chartEl.innerHTML = `${rangeToggle}<p class="compare-empty">${message}</p>`;
    return;
  }
  chartEl.innerHTML = `${rangeToggle}<div class="compare-legend">${result.legend}</div>${result.svg}${result.skippedNote}`;
}

function initCompareSection() {
  const searchInput = document.getElementById("compareSearchInput");
  const suggestions = document.getElementById("compareSuggestions");
  const chipsEl = document.getElementById("compareChips");
  const chartEl = document.getElementById("compareChart");

  searchInput.addEventListener("input", () => renderCompareSuggestions(searchInput.value));
  searchInput.addEventListener("focus", () => renderCompareSuggestions(searchInput.value));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".compare-search")) suggestions.hidden = true;
  });

  suggestions.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const ticker = btn.dataset.add;
    if (!compareTickers.includes(ticker) && compareTickers.length < COMPARE_MAX) {
      compareTickers.push(ticker);
      searchInput.value = "";
      suggestions.hidden = true;
      renderCompareSection();
    }
  });

  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    compareTickers = compareTickers.filter((t) => t !== btn.dataset.remove);
    renderCompareSection();
  });

  chartEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-compare-range]");
    if (!btn) return;
    compareRange = btn.dataset.compareRange;
    renderCompareSection();
  });
}

// Guarda los valores numéricos crudos del render anterior de los stats del
// hero, para poder animar "del valor viejo al nuevo" en vez de siempre
// arrancar desde 0 — así una actualización en vivo (auto-refresh) cuenta
// desde donde estaba, y solo la primera carga cuenta desde cero.
let prevSectorStatsRaw = null;

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
      (s, i) => `<div class="stat">
        <div class="stat-value ${s.cls || ""}" data-stat-index="${i}">${s.value}</div>
        <div class="stat-label">${HERO_STAT_ICONS[s.label] || ""}${s.label}</div>
      </div>`
    )
    .join("");

  const valueEls = statsEl.querySelectorAll(".stat-value");
  SECTOR_SUMMARY.stats.forEach((s, i) => {
    const el = valueEls[i];
    if (typeof s.raw !== "number") return; // sin dato numérico crudo, dejar el texto estático ya puesto
    const from = prevSectorStatsRaw ? prevSectorStatsRaw[i] : 0;
    if (s.kind === "ratio") animateNumber(el, from, s.raw, { decimals: 0, suffix: ` / ${s.total}` });
    else if (s.kind === "percent") animateNumber(el, from, s.raw, { decimals: 1, suffix: "%", signed: true });
    else animateNumber(el, from, s.raw, { decimals: 0 });
  });
  prevSectorStatsRaw = SECTOR_SUMMARY.stats.map((s) => (typeof s.raw === "number" ? s.raw : 0));
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

// "Tu selección" — landing section for favorited tickers, separate from the
// existing "Favoritas" filter chip inside the ledger below. Reuses the exact
// hero-mover button (ticker + price change, opens the Stock Detail Modal)
// already used for the hero's top movers and Historial's daily movers — no
// new card component. Hidden entirely until the visitor has favorited at
// least one ticker; never touches the sector-wide hero stats above it, which
// must keep reflecting the full 50-ticker universe, not a personal subset.
function renderSelection() {
  const section = document.getElementById("seleccion");
  const container = document.getElementById("selectionMovers");
  if (favorites.size === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const favStocks = STOCKS.filter((s) => favorites.has(s.ticker));

  container.innerHTML = favStocks
    .map((stock) => {
      const hasChange = stock.changePct != null;
      const tagCls = hasChange ? (stock.changePct >= 0 ? "bullish" : "bearish") : "mixed";
      const changeCls = hasChange ? (stock.changePct >= 0 ? "up" : "down") : "";
      const sign = hasChange && stock.changePct >= 0 ? "+" : "";
      const changeText = hasChange ? `${sign}${stock.changePct.toFixed(1)}%` : "—";
      return `<button type="button" class="hero-mover" data-ticker="${escapeHtml(stock.ticker)}">
        <span class="hero-mover-label">${escapeHtml(stock.name)}</span>
        <span class="hero-mover-row">
          <span class="stock-tag ${tagCls}">${escapeHtml(stock.ticker)}</span>
          <span class="hero-mover-change ${changeCls}">${changeText}</span>
        </span>
      </button>`;
    })
    .join("");
}

function initSelection() {
  const container = document.getElementById("selectionMovers");
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ticker]");
    if (!btn) return;
    const stock = STOCKS.find((s) => s.ticker === btn.dataset.ticker);
    if (stock) openStockModal(stock);
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
let stocksExpanded = false;
let newsExpanded = false;

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
    const matchesSubsector = currentSubsectorFilter === "all" || s.subsector === currentSubsectorFilter;
    const matchesQuery =
      !q || s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    return matchesFilter && matchesSubsector && matchesQuery;
  });

  if (!filtered.length) {
    grid.innerHTML =
      filter === "favorites" && currentSubsectorFilter === "all"
        ? `<p class="favorites-empty"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.6l1.87 3.98 4.33.5-3.23 3.02.9 4.4L8 11.35l-3.87 2.15.9-4.4-3.23-3.02 4.33-.5L8 1.6Z"/></svg>Todavía no marcaste ninguna acción como favorita. Tocá la estrella junto al ticker para agregarla.</p>`
        : `<p style="color:var(--text-faint)">No hay empresas que coincidan con estos filtros.</p>`;
    return;
  }

  const sorted = applySort(filtered);
  const showToggle = sorted.length > STOCKS_COLLAPSE_LIMIT;
  const visible = stocksExpanded ? sorted : sorted.slice(0, STOCKS_COLLAPSE_LIMIT);
  const STAR_ICON =
    '<svg viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.6l1.87 3.98 4.33.5-3.23 3.02.9 4.4L8 11.35l-3.87 2.15.9-4.4-3.23-3.02 4.33-.5L8 1.6Z"/></svg>';

  const rowsHtml = visible
    .map((s, i) => {
      const changeSign = s.changePct >= 0 ? "+" : "";
      const changeCls = s.changePct >= 0 ? "up" : "down";
      const isFav = favorites.has(s.ticker);
      return `
      <article class="stock-row stagger-item" style="animation-delay:${staggerDelay(i)}ms" data-ticker="${s.ticker}" tabindex="0" role="button" aria-haspopup="dialog">
        <div class="stock-id">
          <div class="stock-id-top">
            <button type="button" class="stock-star ${isFav ? "active" : ""}" data-star="${s.ticker}" aria-pressed="${isFav}" aria-label="${isFav ? "Quitar de favoritas" : "Agregar a favoritas"}">${STAR_ICON}</button>
            <span class="stock-ticker">${s.ticker}</span>
          </div>
          <span class="stock-name">${s.name}${s.subsector ? ` · ${SUBSECTOR_LABEL[s.subsector] || ""}` : ""}</span>
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

// ---------------------------------------------------------------------------
// Heatmap del sector — vista alternativa de la misma sección "Empresas",
// no una sección nueva: mismos filtros/búsqueda, mismo destino al hacer
// click. Tamaño de celda por rango de capitalización (3 niveles fijos por
// posición en el ranking, no un treemap continuo — mucho más simple de
// razonar y de no romper con 50+ tickers) vía CSS Grid con
// grid-auto-flow: dense; color por intensidad de la variación del día,
// reusando los mismos tonos rise/fall/mixed de siempre — cero colores
// nuevos, solo más pasos de opacidad.
// ---------------------------------------------------------------------------

let stocksView = "table";
let currentStocksFilter = "all";
let currentStocksQuery = "";
// Eje de filtro independiente del chip de sentimiento/favoritas — se
// combinan con AND ("Alcistas" + "Semis" es válido), no se leen como
// parámetro de renderStocks()/renderHeatmap() porque hay varios call sites
// que las invocan directo (ver initLedgerSort, el toggle de estrella) y
// forzarlos a pasar un tercer argumento en cada uno es más frágil que leer
// este estado de módulo, mismo patrón que stocksExpanded.
let currentSubsectorFilter = "all";

function heatmapIntensityClass(changePct) {
  const abs = Math.abs(changePct);
  if (abs <= 0.1) return "heatmap-flat";
  const dir = changePct > 0 ? "up" : "down";
  const level = abs >= 3 ? "3" : abs >= 1 ? "2" : "1";
  return `heatmap-${dir}-${level}`;
}

function renderHeatmap(filter = "all", query = "") {
  const grid = document.getElementById("heatmapGrid");
  const q = query.trim().toLowerCase();

  const filtered = STOCKS.filter((s) => {
    const matchesFilter =
      filter === "all" || (filter === "favorites" ? favorites.has(s.ticker) : s.sentiment === filter);
    const matchesSubsector = currentSubsectorFilter === "all" || s.subsector === currentSubsectorFilter;
    const matchesQuery = !q || s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    return matchesFilter && matchesSubsector && matchesQuery && s.changePct != null;
  });

  if (!filtered.length) {
    grid.innerHTML =
      filter === "favorites" && currentSubsectorFilter === "all"
        ? `<p class="favorites-empty"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.6l1.87 3.98 4.33.5-3.23 3.02.9 4.4L8 11.35l-3.87 2.15.9-4.4-3.23-3.02 4.33-.5L8 1.6Z"/></svg>Todavía no marcaste ninguna acción como favorita. Tocá la estrella junto al ticker para agregarla.</p>`
        : `<p style="color:var(--text-faint)">No hay empresas que coincidan con estos filtros.</p>`;
    return;
  }

  // Por capitalización de mercado cuando está disponible; si falta (poco
  // frecuente, cobertura de Finnhub free varía por ticker), va al final,
  // nunca se inventa un número para ordenarlo mejor.
  const ranked = [...filtered].sort((a, b) => (b.fundamentals.marketCapM || 0) - (a.fundamentals.marketCapM || 0));

  grid.innerHTML = ranked
    .map((s, i) => {
      const tierClass = i < 3 ? "heatmap-tile-lg" : i < 10 ? "heatmap-tile-md" : "heatmap-tile-sm";
      const sign = s.changePct >= 0 ? "+" : "";
      return `<button type="button" class="heatmap-tile stagger-item ${tierClass} ${heatmapIntensityClass(s.changePct)}" style="animation-delay:${staggerDelay(i)}ms" data-ticker="${escapeHtml(s.ticker)}" title="${escapeHtml(s.name)}">
        <span class="heatmap-tile-ticker">${escapeHtml(s.ticker)}</span>
        <span class="heatmap-tile-change">${sign}${s.changePct.toFixed(1)}%</span>
      </button>`;
    })
    .join("");
}

function renderStocksViews(filter = currentStocksFilter, query = currentStocksQuery) {
  currentStocksFilter = filter;
  currentStocksQuery = query;
  renderStocks(filter, query);
  renderHeatmap(filter, query);
}

// La vista de Empresas siempre arranca en "Tabla" — nunca se guarda en
// localStorage a propósito, es una preferencia de sesión de lectura, no una
// configuración persistente. applyStocksView() fuerza el estado del DOM a
// mano en vez de confiar en los atributos estáticos del HTML, porque el
// bfcache del navegador (restaurar la página al volver con "atrás") puede
// reponer un estado visual viejo (ej. el heatmap quedó activo) sin volver a
// correr este script — el listener de "pageshow" de más abajo cubre
// justamente ese caso.
function applyStocksView(view) {
  stocksView = view;
  const toggle = document.getElementById("stocksViewToggle");
  const ledgerHead = document.getElementById("ledgerHead");
  const stockGrid = document.getElementById("stockGrid");
  const heatmapGrid = document.getElementById("heatmapGrid");
  const isHeatmap = view === "heatmap";

  toggle.querySelectorAll("[data-view]").forEach((b) => {
    const active = b.dataset.view === view;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
  });
  ledgerHead.hidden = isHeatmap;
  stockGrid.hidden = isHeatmap;
  heatmapGrid.hidden = !isHeatmap;
}

function initStocksViewToggle() {
  const toggle = document.getElementById("stocksViewToggle");
  const heatmapGrid = document.getElementById("heatmapGrid");

  applyStocksView("table");
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) applyStocksView("table");
  });

  toggle.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    applyStocksView(btn.dataset.view);
  });

  heatmapGrid.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-ticker]");
    if (!tile) return;
    const stock = STOCKS.find((s) => s.ticker === tile.dataset.ticker);
    if (stock) openStockModal(stock);
  });
}

function renderNews() {
  const list = document.getElementById("newsList");
  const indexed = NEWS.map((n, i) => ({ n, i }));
  const showToggle = indexed.length > NEWS_COLLAPSE_LIMIT;
  const visible = newsExpanded ? indexed : indexed.slice(0, NEWS_COLLAPSE_LIMIT);

  const itemsHtml = visible
    .map(({ n, i }, visibleIndex) => {
      const hasThumb = n.image && isSafeHttpUrl(n.image);
      return `
    <article class="news-item stagger-item${hasThumb ? " has-thumb" : ""}" style="animation-delay:${staggerDelay(visibleIndex)}ms" data-index="${i}" tabindex="0" role="button" aria-haspopup="dialog">
      ${hasThumb ? `<img class="news-thumb" src="${escapeHtml(n.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
      <span class="news-dot ${n.sentiment}" aria-hidden="true"></span>
      <div class="news-body">
        <p class="news-headline">${escapeHtml(n.headline)}</p>
        <div class="news-meta">
          <span>${escapeHtml(n.source)}</span>
          <span>·</span>
          <span data-published-at="${escapeHtml(n.publishedAt || "")}">${n.time}</span>
        </div>
      </div>
      ${n.ticker ? `<span class="news-ticker-tag">[${escapeHtml(n.ticker)}]</span>` : `<span></span>`}
    </article>`;
    })
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

const WEEKDAY_LABELS_ES = ["L", "M", "M", "J", "V", "S", "D"];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
// 0=lunes..6=domingo (Date.getDay() da 0=domingo, se rota para que la
// semana arranque el lunes, como en el resto de LatAm/Argentina).
function firstWeekdayMonFirst(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function groupEarningsByDate(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!e.date) continue;
    (byDate[e.date] ||= []).push(e);
  }
  return byDate;
}

const today = new Date();
let calendarView = { year: today.getFullYear(), month: today.getMonth() };

function renderEarningsCalendar() {
  const section = document.querySelector(".earnings");
  const list = document.getElementById("earningsList");
  if (!EARNINGS.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  const byDate = groupEarningsByDate(EARNINGS);
  const { year, month } = calendarView;
  const totalDays = daysInMonth(year, month);
  const leadingBlanks = firstWeekdayMonFirst(year, month);
  const todayStr = today.toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(`<div class="cal-cell cal-cell-pad"></div>`);
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entries = byDate[dateStr] || [];
    const cls = ["cal-cell"];
    if (entries.length) cls.push("has-entry");
    if (dateStr === todayStr) cls.push("is-today");
    const entryButtons = entries
      .map((e) => {
        const hourLabel = EARNINGS_HOUR_LABEL[e.hour];
        const title = hourLabel ? ` title="${escapeHtml(e.name)} · ${hourLabel}"` : ` title="${escapeHtml(e.name)}"`;
        return `<button type="button" class="cal-entry" data-ticker="${escapeHtml(e.ticker)}"${title}>${escapeHtml(e.ticker)}</button>`;
      })
      .join("");
    cells.push(`<div class="${cls.join(" ")}"><span class="cal-day-num">${d}</span>${entryButtons}</div>`);
  }

  const monthName = MONTH_NAMES_ES[month];
  const monthLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  list.innerHTML = `
    <div class="cal-header">
      <button type="button" class="cal-nav" data-cal-nav="-1" ${canGoPrev ? "" : "disabled"} aria-label="Mes anterior">‹</button>
      <span class="cal-month-label">${monthLabel}</span>
      <button type="button" class="cal-nav" data-cal-nav="1" aria-label="Mes siguiente">›</button>
    </div>
    <div class="cal-weekdays">${WEEKDAY_LABELS_ES.map((w) => `<span>${w}</span>`).join("")}</div>
    <div class="cal-grid">${cells.join("")}</div>`;
}

// ---------------------------------------------------------------------------
// Historial del sector — resumen de cada día, últimos 30 (ver
// ARCHIVE_DAYS_KEPT en el pipeline). Reusa el markup de "hero-mover"
// (mismo botón que abre el modal de una acción) para el mayor suba/baja de
// cada día, en vez de inventar un componente nuevo.
// ---------------------------------------------------------------------------

function renderHistory() {
  const section = document.querySelector(".history");
  const list = document.getElementById("historyList");
  if (!ARCHIVE.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  const moverButton = (mover, label) => {
    if (!mover) return "";
    const tagCls = mover.changePct >= 0 ? "bullish" : "bearish";
    const changeCls = mover.changePct >= 0 ? "up" : "down";
    const sign = mover.changePct >= 0 ? "+" : "";
    return `<button type="button" class="hero-mover" data-ticker="${escapeHtml(mover.ticker)}">
      <span class="hero-mover-label">${label}</span>
      <span class="hero-mover-row">
        <span class="stock-tag ${tagCls}">${escapeHtml(mover.ticker)}</span>
        <span class="hero-mover-change ${changeCls}">${sign}${mover.changePct.toFixed(1)}%</span>
      </span>
    </button>`;
  };

  const sortedDesc = [...ARCHIVE].sort((a, b) => (a.date < b.date ? 1 : -1));

  list.innerHTML = sortedDesc
    .map((entry, i) => {
      const stats = entry.stats || {};
      const avg = stats.avgChangePct ?? 0;
      return `<article class="history-card stagger-item" style="animation-delay:${staggerDelay(i)}ms">
        <div class="history-card-head">
          <span class="history-date">${formatShortDate(entry.date)}</span>
          <span class="sentiment-badge sentiment-${entry.sentiment}">${sentimentLabel[entry.sentiment] || entry.sentiment}</span>
        </div>
        <p class="history-text">${escapeHtml(entry.text) || "Sin resumen disponible para este día."}</p>
        <div class="history-footer">
          <div class="history-stats">
            <span class="history-stat"><span class="stat-value ${(stats.upCount ?? 0) >= (stats.totalCount ?? 0) / 2 ? "up" : "down"}">${stats.upCount ?? 0}/${stats.totalCount ?? 0}</span> en alza</span>
            <span class="history-stat"><span class="stat-value ${avg >= 0 ? "up" : "down"}">${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%</span> promedio</span>
            <span class="history-stat"><span class="stat-value">${stats.newsCount ?? 0}</span> noticias</span>
          </div>
          <div class="history-movers">
            ${moverButton(entry.topMover, "Mayor suba")}
            ${moverButton(entry.topLoser, "Mayor baja")}
          </div>
        </div>
      </article>`;
    })
    .join("");
}

function initHistory() {
  const list = document.getElementById("historyList");
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ticker]");
    if (!btn) return;
    const stock = STOCKS.find((s) => s.ticker === btn.dataset.ticker);
    if (stock) openStockModal(stock);
  });
}

function initEarningsCalendar() {
  const list = document.getElementById("earningsList");

  list.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-cal-nav]");
    if (navBtn) {
      if (navBtn.disabled) return;
      let { year, month } = calendarView;
      month += Number(navBtn.dataset.calNav);
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      calendarView = { year, month };
      renderEarningsCalendar();
      return;
    }
    const entryBtn = e.target.closest(".cal-entry");
    if (!entryBtn) return;
    const stock = STOCKS.find((s) => s.ticker === entryBtn.dataset.ticker);
    if (stock) openStockModal(stock);
  });
}

function openNewsModal(item) {
  const imageEl = document.getElementById("modalImage");
  if (item.image && isSafeHttpUrl(item.image)) {
    imageEl.src = item.image;
    imageEl.hidden = false;
  } else {
    imageEl.removeAttribute("src");
    imageEl.hidden = true;
  }

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

// Las portadas son URLs externas (dominios de cada fuente de noticias) que
// pueden dar 404, bloquear hotlinking, o simplemente rotar con el tiempo —
// a diferencia del resto de la data, esto no lo controla el pipeline. En
// vez de dejar el ícono roto del navegador, se saca el elemento entero al
// fallar la carga y el layout cae de nuevo al de "sin portada". "error" en
// <img> no burbujea, así que se escucha en fase de captura sobre todo el
// documento en vez de delegar sobre un contenedor con addEventListener normal.
function initNewsImageFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      if (img.classList.contains("news-thumb")) {
        img.closest(".news-item")?.classList.remove("has-thumb");
        img.remove();
      } else if (img.id === "modalImage") {
        img.hidden = true;
        img.removeAttribute("src");
      }
    },
    true
  );
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
    el.innerHTML = `<p class="position-nudge">Marcá esta acción como favorita (★) para trackear tu posición acá — el precio de compra y la cantidad quedan solo en tu navegador, nunca se mandan a ningún servidor.</p>`;
    return;
  }
  const pos = getPosition(stock.ticker);
  if (!pos) {
    el.innerHTML = `
      <p class="position-label">Mi posición</p>
      <form class="position-form" data-position-form>
        <input type="number" inputmode="decimal" step="0.01" min="0" placeholder="Precio de compra, ej: ${stock.price.toFixed(2)}" aria-label="Precio de compra" data-field="price">
        <input type="number" inputmode="decimal" step="any" min="0" placeholder="Cantidad de acciones" aria-label="Cantidad de acciones" data-field="shares">
        <button type="submit" class="btn btn-ghost">Guardar</button>
      </form>`;
    return;
  }
  const { price: cost, shares } = pos;
  const pnlPct = ((stock.price - cost) / cost) * 100;
  const cls = pnlPct >= 0 ? "up" : "down";
  const sign = pnlPct >= 0 ? "+" : "";

  // La cantidad es opcional (compatibilidad con posiciones guardadas antes
  // de sumar este campo) — sin ella se muestra el % pero no el $ total.
  const hasShares = shares != null && shares > 0;
  const totalLine = hasShares
    ? `<span class="position-pnl ${cls}">${sign}$${(stock.price * shares - cost * shares).toFixed(2)} (${sign}${pnlPct.toFixed(1)}%)</span>`
    : `<span class="position-pnl ${cls}">${sign}${pnlPct.toFixed(1)}%</span>`;
  const label = hasShares
    ? `Mi posición — ${shares} ${shares === 1 ? "acción" : "acciones"} a $${cost.toFixed(2)}`
    : `Mi posición — compraste a $${cost.toFixed(2)}`;
  const currentValueLine = hasShares
    ? `<span class="position-current-value">Valor actual: $${(stock.price * shares).toFixed(2)}</span>`
    : "";

  el.innerHTML = `
    <p class="position-label">${label}</p>
    <div class="position-summary">
      <div class="position-summary-values">
        ${totalLine}
        ${currentValueLine}
      </div>
      <button type="button" class="position-clear" data-position-clear>Borrar</button>
    </div>`;
}

function initPositionSection() {
  const el = document.getElementById("stockModalPosition");
  el.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-position-form]");
    if (!form || !currentModalStock) return;
    e.preventDefault();
    const price = parseFloat(form.querySelector('[data-field="price"]').value);
    const sharesRaw = form.querySelector('[data-field="shares"]').value;
    const shares = sharesRaw.trim() === "" ? null : parseFloat(sharesRaw);
    if (!Number.isFinite(price) || price <= 0) return;
    if (shares != null && (!Number.isFinite(shares) || shares <= 0)) return;
    setPosition(currentModalStock.ticker, price, shares);
    renderPositionSection(currentModalStock);
  });
  el.addEventListener("click", (e) => {
    if (!e.target.closest("[data-position-clear]") || !currentModalStock) return;
    clearPosition(currentModalStock.ticker);
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

// Tesis de inversión + catalizador por ticker, generada por el pipeline una
// vez por semana (ver pipeline/fetch_and_curate.py). Se esconde entero si
// todavía no hay una para este ticker — nunca se fabrica en el frontend.
function renderThesis(stock) {
  const section = document.getElementById("stockModalThesisSection");
  if (!stock.thesis) {
    section.hidden = true;
    return;
  }
  document.getElementById("stockModalThesisText").textContent = stock.thesis.text;
  const catalystEl = document.getElementById("stockModalThesisCatalyst");
  if (stock.thesis.catalyst) {
    catalystEl.textContent = `Catalizador: ${stock.thesis.catalyst}`;
    catalystEl.hidden = false;
  } else {
    catalystEl.hidden = true;
  }
  section.hidden = false;
}

let currentModalStock = null;

function openStockModal(stock) {
  currentModalStock = stock;
  const changeCls = stock.changePct >= 0 ? "up" : "down";

  document.getElementById("stockModalTicker").textContent = stock.ticker;
  document.getElementById("stockModalName").textContent = stock.name;
  document.getElementById("stockModalAvatar").textContent = stock.ticker.charAt(0);
  animateNumber(document.getElementById("stockModalPrice"), 0, stock.price, { decimals: 2, prefix: "$", duration: 500 });
  const changeEl = document.getElementById("stockModalChange");
  changeEl.className = `stock-modal-change ${changeCls}`;
  animateNumber(changeEl, 0, stock.changePct, { decimals: 1, suffix: "%", signed: true, duration: 500 });
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
  renderThesis(stock);

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
    : `<p class="stock-modal-news-empty"><svg class="icon-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5h11.5A1.5 1.5 0 0 1 18 6v13a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5V6a1.5 1.5 0 0 1 1-1.4Z"/><path d="M8 9h6M8 12.5h6M8 16h3.5"/></svg>Sin noticias recientes para este ticker.</p>`;

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
      renderSelection();
      const activeChip = document.querySelector(".chip.active");
      renderStocksViews(activeChip ? activeChip.dataset.filter : "all", document.getElementById("searchInput").value);
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
    renderStocksViews(activeFilter, search.value);
  });

  search.addEventListener("input", () => {
    stocksExpanded = false;
    renderStocksViews(activeFilter, search.value);
  });
}

function initSubsectorFilter() {
  const group = document.getElementById("subsectorFilterGroup");
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    group.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    currentSubsectorFilter = btn.dataset.subsector;
    stocksExpanded = false;
    renderStocksViews();
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

// Resalta en la topbar-nav qué sección está a la vista mientras se scrollea,
// no solo al hacer click — sin esto la nav es una lista de links sin
// feedback de "dónde estoy". rootMargin recorta el área de detección a una
// franja angosta cerca del centro del viewport, así la sección activa
// cambia cuando realmente cruza el medio de la pantalla, no apenas asoma.
function initSectionNav() {
  const links = [...document.querySelectorAll(".topbar-nav a")];
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((e) => e.isIntersecting);
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}

// Botón flotante de "volver arriba" — aparece recién después de bajar un
// poco (no tiene sentido mostrarlo con el hero a la vista). El threshold
// coincide aproximadamente con la altura del hero, así que aparece justo
// cuando el visitante ya scrolleó más allá del punto de partida.
function initScrollTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  const SHOW_AFTER_PX = 480;

  window.addEventListener(
    "scroll",
    () => {
      btn.hidden = window.scrollY < SHOW_AFTER_PX;
    },
    { passive: true }
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
}

// Revelado por scroll — cada .reveal-target arranca invisible/corrido SOLO
// si ya estaba fuera de la ventana al momento de llamar esto (chequeado con
// getBoundingClientRect antes de sumarle la clase), así el contenido que
// ya se ve al cargar (ej. la sección Empresas en una pantalla grande)
// nunca parpadea con un fade que el usuario no llega a percibir como
// "entrada", solo como un salto raro.
// Recalcula "hace X min/h/d" de las noticias visibles cada minuto, sin
// tocar el resto del DOM — mucho más barato que re-renderizar la lista
// entera solo para que el reloj relativo no se quede viejo mientras la
// pestaña sigue abierta. Los items de datos de demostración no tienen
// data-published-at real (string vacío), así que se saltean solos.
function tickRelativeTimes() {
  document.querySelectorAll("[data-published-at]").forEach((el) => {
    const iso = el.dataset.publishedAt;
    if (!iso) return;
    el.textContent = relativeTime(iso);
  });
}

function initScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(".reveal-target");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) return; // ya se ve: se queda como está, sin animar
    el.classList.add("reveal-pending");
    observer.observe(el);
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ---------------------------------------------------------------------------
// Compartir el resumen del día como imagen — dibujado a mano en <canvas>,
// sin librerías (html2canvas y similares no entrarían igual: los bloquea
// script-src 'self' de la CSP salvo que se auto-hospedaran). Lee los
// colores actuales vía custom properties al momento de dibujar, así la
// imagen respeta el tema claro/oscuro activo sin duplicar la paleta acá.
// ---------------------------------------------------------------------------

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function buildShareCanvas() {
  if (document.fonts?.ready) await document.fonts.ready;
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  const paper = v("--paper");
  const text = v("--text");
  const textDim = v("--text-dim");
  const textFaint = v("--text-faint");
  const accent = v("--accent");
  const line = v("--line");
  const rise = v("--rise");
  const fall = v("--fall");

  const w = 1200;
  const h = 630;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 6);

  ctx.textBaseline = "alphabetic";
  ctx.font = "700 34px Montserrat, sans-serif";
  ctx.fillStyle = text;
  ctx.fillText("AI Stocks ", 64, 92);
  const brandLead = ctx.measureText("AI Stocks ").width;
  ctx.fillStyle = accent;
  ctx.fillText("Pulse", 64 + brandLead, 92);

  const updated = (document.getElementById("lastUpdated")?.textContent || "").toUpperCase();
  ctx.font = "600 18px 'Montserrat', sans-serif";
  ctx.fillStyle = textFaint;
  ctx.fillText(updated, 64, 128);
  const updatedWidth = ctx.measureText(updated).width;

  const sentimentText = (document.getElementById("sectorSentiment")?.textContent || "").toUpperCase();
  const sentimentColor =
    SECTOR_SUMMARY.sentiment === "bullish" ? rise : SECTOR_SUMMARY.sentiment === "bearish" ? fall : textDim;
  ctx.font = "700 18px 'Montserrat', sans-serif";
  ctx.fillStyle = sentimentColor;
  ctx.fillText(sentimentText, 64 + updatedWidth + 20, 128);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 156);
  ctx.lineTo(w - 64, 156);
  ctx.stroke();

  ctx.font = "400 30px Montserrat, sans-serif";
  ctx.fillStyle = text;
  const summary = SECTOR_SUMMARY.text || "Sin resumen disponible todavía.";
  const lines = wrapCanvasText(ctx, summary, w - 128).slice(0, 6);
  let y = 214;
  for (const l of lines) {
    ctx.fillText(l, 64, y);
    y += 44;
  }

  const withChange = STOCKS.filter((s) => s.changePct != null);
  if (withChange.length >= 2) {
    const sorted = [...withChange].sort((a, b) => b.changePct - a.changePct);
    const gainer = sorted[0];
    const loser = sorted[sorted.length - 1];
    const statY = h - 140;

    const drawStat = (x, label, stock, color) => {
      ctx.font = "600 15px 'Montserrat', sans-serif";
      ctx.fillStyle = textFaint;
      ctx.fillText(label.toUpperCase(), x, statY);
      ctx.font = "700 26px 'Montserrat', sans-serif";
      ctx.fillStyle = text;
      ctx.fillText(stock.ticker, x, statY + 36);
      const tickerWidth = ctx.measureText(`${stock.ticker}  `).width;
      const sign = stock.changePct >= 0 ? "+" : "";
      ctx.fillStyle = color;
      ctx.fillText(`${sign}${stock.changePct.toFixed(1)}%`, x + tickerWidth, statY + 36);
    };

    drawStat(64, "Mayor suba", gainer, rise);
    drawStat(64 + 340, "Mayor baja", loser, fall);
  }

  ctx.font = "600 15px 'Montserrat', sans-serif";
  ctx.fillStyle = textFaint;
  ctx.fillText("scott1z.github.io/ai-stocks-pulse", 64, h - 40);

  return canvas;
}

async function shareSectorSummary() {
  const btn = document.getElementById("shareBtn");
  if (!btn || btn.disabled) return;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Generando…";
  try {
    const canvas = await buildShareCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo generar la imagen");
    const file = new File([blob], "ai-quickcap-resumen.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "AI QuickCap",
        text: "Resumen del sector de acciones de IA de hoy",
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-quickcap-resumen.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Imagen descargada");
    }
  } catch (err) {
    if (err && err.name !== "AbortError") {
      // AbortError = el usuario cerró la hoja de compartir sin elegir nada, no es un error real
      showToast("No se pudo generar la imagen para compartir");
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function initShareButton() {
  document.getElementById("shareBtn")?.addEventListener("click", shareSectorSummary);
}

// Modo oscuro — sin elección guardada, sigue prefers-color-scheme vía CSS
// pura (ver @media en styles.css, cero JS involucrado, así que no hay flash
// de tema equivocado en la primera pintura). Esta función solo entra en
// juego para: aplicar una elección YA guardada al cargar, y manejar el
// click del toggle. Nunca fuerza un tema si el usuario no lo pidió.
const THEME_KEY = "aisp_theme";

function applyTheme(theme) {
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const isDark =
    theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const themeColor = isDark ? "#0a1120" : "#f7f8fa";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  document.getElementById("themeToggle")?.setAttribute("aria-pressed", String(isDark));
  document.getElementById("themeToggle")?.setAttribute(
    "aria-label",
    isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
  );
}

function initThemeManager() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* localStorage unavailable — el toggle sigue funcionando, solo no persiste */
  }
  applyTheme(saved);

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const currentlyDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = currentlyDark ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* localStorage unavailable — el tema se aplica igual, solo no persiste */
    }
  });
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

// ---------------------------------------------------------------------------
// Clave pública VAPID — es pública por diseño, segura de enviar al navegador.
// Tiene que ser byte-idéntica a VAPID_PUBLIC_KEY en Vercel: el navegador ata
// la suscripción a esta clave exacta al momento de suscribirse, y cualquier
// diferencia hace que el envío falle con 401/403. El par se genera una sola
// vez para la vida del producto — regenerarlo invalida todas las
// suscripciones existentes, así que nunca se rota por rutina.
// ---------------------------------------------------------------------------
const VAPID_PUBLIC_KEY = "BACPmh4L94DuAOLgZWz9MJ8uZJUVdpWw5tp4zEVnMtz-Xzh0ba5SSa9b8Ts6dTs1GKYdpqgk9zcvksCKUSpqXtA";

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
// Push notifications (opt-in) — implementa OPTIN-01..06. Punto crítico: una
// vez que el visitante elige "Bloquear" en el prompt nativo del navegador,
// Notification.permission queda en "denied" para siempre — no existe ninguna
// API de JS para revertirlo. Por eso requestPermission() solo puede llamarse
// desde gestos directos del usuario y siempre detrás de un chequeo
// permission === "default"; nunca automáticamente ni al cargar la página.
// ---------------------------------------------------------------------------

const PUSH_SOFT_ASK_SEEN_KEY = "aisp_push_soft_ask_seen";
// D-01: el banner no aparece en la primera pintura — espera este tiempo de
// permanencia antes de mostrarse. 6000ms, elegido dentro de la banda 5-10s.
const PUSH_SOFT_ASK_DELAY_MS = 6000;

function pushSupported() {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function isIosNonStandalone() {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  // Safari en iOS históricamente solo expone navigator.standalone (no
  // estándar); display-mode: standalone es el chequeo moderno/estándar.
  // Se consultan los dos porque ninguno solo alcanza en todos los casos.
  const isStandalone =
    window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isStandalone;
}

// Conversión base64url -> Uint8Array probada en la Fase 1 contra el par de
// claves VAPID real (scripts/make-test-subscription.js) — copiada tal cual,
// no reescribir.
function urlBase64ToUint8Array(base64) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

// Única fuente de verdad de qué debe mostrar la UI. El orden de evaluación
// importa: iOS se chequea antes que el permiso (en una pestaña de Safari en
// iOS no hay nada que activar, sin importar el permiso), y "subscribed" solo
// se da si además de "granted" existe una suscripción viva en este
// navegador — un permiso concedido no implica una suscripción activa.
async function getPushState() {
  if (!pushSupported()) return "unsupported";
  if (isIosNonStandalone()) return "ios-not-installed";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) return "subscribed";
    } catch {
      /* sin registro/listo aún — se degrada a "default" */
    }
  }
  return "default";
}

// Único lugar que toca el DOM de #pushToggle.
function renderPushToggle(state) {
  const toggle = document.getElementById("pushToggle");
  if (!toggle) return;
  if (state === "unsupported" || state === "ios-not-installed") {
    toggle.hidden = true;
    return;
  }
  toggle.hidden = false;
  toggle.setAttribute("data-push-state", state);
  const labels = {
    default: "Activar notificaciones",
    subscribed: "Notificaciones activadas — click para desactivar",
    denied: "Notificaciones bloqueadas por el navegador",
  };
  toggle.setAttribute("aria-label", labels[state]);
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
  renderSelection();
  renderStocksViews();
  renderCompareSection();
  renderNews();
  renderEarningsCalendar();
  renderHistory();
  renderLastUpdated();
  renderDataSourcePill();
  renderTickerTape();
  renderMarketStatus();
  setInterval(renderMarketStatus, 60000);
  initFilters();
  initSubsectorFilter();
  initLedgerSort();
  initStocksViewToggle();
  initNewsModal();
  initNewsImageFallback();
  initStockModal();
  initPositionSection();
  initHeroChartRange();
  initHeroChartInteraction();
  initCompareSection();
  initShareButton();
  initEarningsCalendar();
  initHistory();
  initSelection();
  initSectionNav();
  initScrollTopButton();
  initScrollReveal();
  initThemeManager();
  initInstallPrompt();
  initServiceWorker();
  initAutoRefresh();
  setInterval(tickRelativeTimes, 60000);
  hidePreloader();
  // Con un pequeño delay para que el toast no aparezca tapado por el
  // preloader saliendo — una sola vez por carga de página, no en cada
  // auto-refresh (ver checkFavoritePriceAlerts()).
  setTimeout(checkFavoritePriceAlerts, 800);
}

init();
