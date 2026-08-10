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

let STOCKS = DEMO_STOCKS;
let NEWS = DEMO_NEWS;
let SECTOR_SUMMARY = DEMO_SECTOR_SUMMARY;
let isLiveData = false;
let lastUpdatedIso = null;

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
//   "stocks": [{ ticker, name, price, changePct, spark: number[] }],
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

  return { stocks, news, sectorSummary };
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
    isLiveData = true;
    lastUpdatedIso = json.updated_at || null;
  } catch (err) {
    STOCKS = DEMO_STOCKS;
    NEWS = DEMO_NEWS;
    SECTOR_SUMMARY = DEMO_SECTOR_SUMMARY;
    isLiveData = false;
    lastUpdatedIso = null;
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const sentimentLabel = { bullish: "Alcista", bearish: "Bajista", mixed: "Mixta" };

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
    { label: "P/E (TTM)", value: fundamentals.peTTM != null ? fundamentals.peTTM.toFixed(1) : null },
    { label: "Cap. de mercado", value: formatMarketCap(fundamentals.marketCapM) },
    {
      label: "Rango 52 semanas",
      value:
        fundamentals.week52Low != null && fundamentals.week52High != null
          ? `$${fundamentals.week52Low.toFixed(2)} – $${fundamentals.week52High.toFixed(2)}`
          : null,
    },
    { label: "EPS (TTM)", value: fundamentals.epsTTM != null ? `$${fundamentals.epsTTM.toFixed(2)}` : null },
    { label: "ROE (TTM)", value: fundamentals.roeTTM != null ? `${fundamentals.roeTTM.toFixed(1)}%` : null },
    { label: "Margen neto (TTM)", value: fundamentals.netMarginTTM != null ? `${fundamentals.netMarginTTM.toFixed(1)}%` : null },
  ];

  return stats
    .map(
      (s) => `<div class="stat">
        ${s.value != null ? `<div class="stat-value">${s.value}</div>` : na}
        <div class="stat-label">${s.label}</div>
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
function buildCompositeChart(stocks) {
  const length = Math.min(...stocks.map((s) => s.spark.length));
  if (length < 2) return "";

  const composite = [];
  for (let i = 0; i < length; i++) {
    const avgReturn =
      stocks.reduce((sum, s) => sum + ((s.spark[i] - s.spark[0]) / s.spark[0]) * 100, 0) /
      stocks.length;
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

function renderHeroChart() {
  const el = document.getElementById("heroChart");
  const result = buildCompositeChart(STOCKS);
  if (!result) {
    el.innerHTML = "";
    return;
  }
  const sign = result.finalReturn >= 0 ? "+" : "";
  el.innerHTML = `
    <div class="hero-chart-label">
      <span class="hero-chart-title">Índice compuesto del sector</span>
      <span class="hero-chart-value ${result.up ? "up" : "down"}">${sign}${result.finalReturn.toFixed(1)}%</span>
    </div>
    ${result.svg}`;
}

function renderSectorSummary() {
  document.getElementById("sectorSummaryText").textContent =
    SECTOR_SUMMARY.text || "Sin resumen disponible todavía.";

  const sentimentEl = document.getElementById("sectorSentiment");
  sentimentEl.textContent = `Sector ${sentimentLabel[SECTOR_SUMMARY.sentiment].toLowerCase()}`;
  sentimentEl.className = `sentiment-badge sentiment-${SECTOR_SUMMARY.sentiment}`;

  const statsEl = document.getElementById("sectorStats");
  statsEl.innerHTML = SECTOR_SUMMARY.stats
    .map(
      (s) => `<div class="stat">
        <div class="stat-value ${s.cls || ""}">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`
    )
    .join("");
}

function renderStocks(filter = "all", query = "") {
  const grid = document.getElementById("stockGrid");
  const q = query.trim().toLowerCase();

  const filtered = STOCKS.filter((s) => {
    const matchesFilter = filter === "all" || s.sentiment === filter;
    const matchesQuery =
      !q || s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p style="color:var(--text-faint)">No hay empresas que coincidan con tu búsqueda.</p>`;
    return;
  }

  grid.innerHTML = filtered
    .map((s) => {
      const changeSign = s.changePct >= 0 ? "+" : "";
      const changeCls = s.changePct >= 0 ? "up" : "down";
      return `
      <article class="stock-row" data-ticker="${s.ticker}" tabindex="0" role="button" aria-haspopup="dialog">
        <div class="stock-id">
          <span class="stock-ticker">${s.ticker}</span>
          <span class="stock-name">${s.name}</span>
          <p class="stock-blurb">${s.blurb}</p>
        </div>
        <div class="price-value">$${s.price.toFixed(2)}</div>
        <div class="price-change ${changeCls}">${changeSign}${s.changePct.toFixed(1)}%</div>
        ${buildSparkline(s.spark)}
        <span class="stock-tag ${s.sentiment}">${sentimentLabel[s.sentiment]}</span>
      </article>`;
    })
    .join("");
}

function renderNews() {
  const list = document.getElementById("newsList");
  list.innerHTML = NEWS.map((n, i) => `
    <article class="news-item" data-index="${i}" tabindex="0" role="button" aria-haspopup="dialog">
      <span class="news-dot ${n.sentiment}" aria-hidden="true"></span>
      <div class="news-body">
        <p class="news-headline">${n.headline}</p>
        <div class="news-meta">
          <span>${n.source}</span>
          <span>·</span>
          <span>${n.time}</span>
        </div>
      </div>
      ${n.ticker ? `<span class="news-ticker-tag">[${n.ticker}]</span>` : `<span></span>`}
    </article>`
  ).join("");
}

function openNewsModal(item) {
  document.getElementById("modalTicker").textContent = item.ticker ? `[${item.ticker}]` : "";
  document.getElementById("modalTicker").hidden = !item.ticker;
  document.getElementById("modalHeadline").textContent = item.headline;
  document.getElementById("modalMeta").textContent = `${item.source} · ${item.time}`;
  document.getElementById("modalSummary").textContent =
    item.summary || "No hay un resumen disponible para esta noticia.";

  const linkEl = document.getElementById("modalSourceLink");
  if (item.url) {
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

  list.addEventListener("click", (e) => activate(e.target));
  list.addEventListener("keydown", (e) => {
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

function openStockModal(stock) {
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

  document.getElementById("stockModalChart").innerHTML = buildStockDetailChart(stock.spark);
  document.getElementById("stockModalChartCaption").textContent =
    stock.spark.length > 2
      ? `Últimas ${stock.spark.length} actualizaciones de precio (no es un histórico de velas)`
      : "Historial de precio todavía corto — se enriquece cada hora que corre el pipeline.";

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
            <span class="stock-modal-news-headline">${n.headline}</span>
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

  grid.addEventListener("click", (e) => activate(e.target));
  grid.addEventListener("keydown", (e) => {
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
    renderStocks(activeFilter, search.value);
  });

  search.addEventListener("input", () => {
    renderStocks(activeFilter, search.value);
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
  renderStocks();
  renderNews();
  renderLastUpdated();
  renderDataSourcePill();
  renderTickerTape();
  initFilters();
  initNewsModal();
  initStockModal();
  initInstallPrompt();
  initServiceWorker();
  hidePreloader();
}

init();
