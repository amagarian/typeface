/* ── Sanity config ── */
const SANITY_PROJECT_ID = "jnzz8urn";
const SANITY_DATASET    = "production";
const SANITY_API_URL    = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}`;

async function fetchProjects() {
  const query = encodeURIComponent(
    `*[_type == "portfolioItem" && "typeface" in sites] | order(orderRank) {
      title, subtitle, year, category, videoUrl, muxPlaybackId,
      "imageUrl": media.asset->url,
      "galleryUrls": gallery[].asset->url
    }`
  );
  const res  = await fetch(`${SANITY_API_URL}?query=${query}`);
  const data = await res.json();
  return data.result || [];
}

/* ── Logo font pool — printing press & newspaper typefaces ── */
const FONTS = [
  { family: "EB Garamond",       weight: "400", style: "normal"  }, // Garamond 1530
  { family: "EB Garamond",       weight: "400", style: "italic"  },
  { family: "EB Garamond",       weight: "700", style: "normal"  },
  { family: "EB Garamond",       weight: "800", style: "normal"  },
  { family: "Libre Baskerville", weight: "400", style: "normal"  }, // Baskerville 1757
  { family: "Libre Baskerville", weight: "400", style: "italic"  },
  { family: "Libre Baskerville", weight: "700", style: "normal"  },
  { family: "Bodoni Moda",       weight: "400", style: "italic"  }, // Bodoni 1798
  { family: "Bodoni Moda",       weight: "700", style: "normal"  },
  { family: "Bodoni Moda",       weight: "900", style: "normal"  },
  { family: "Playfair Display",  weight: "400", style: "italic"  }, // Victorian editorial
  { family: "Playfair Display",  weight: "700", style: "italic"  },
  { family: "Playfair Display",  weight: "900", style: "normal"  },
  { family: "Libre Franklin",    weight: "100", style: "normal"  }, // Franklin Gothic 1902
  { family: "Libre Franklin",    weight: "400", style: "normal"  },
  { family: "Libre Franklin",    weight: "900", style: "normal"  },
  { family: "News Cycle",        weight: "400", style: "normal"  }, // Newspaper face
  { family: "News Cycle",        weight: "700", style: "normal"  },
  { family: "Oswald",            weight: "200", style: "normal"  }, // Condensed grotesque
  { family: "Oswald",            weight: "400", style: "normal"  },
  { family: "Oswald",            weight: "700", style: "normal"  },
  { family: "Courier Prime",     weight: "400", style: "normal"  }, // Press typewriter 1955
  { family: "Courier Prime",     weight: "400", style: "italic"  },
];

/* ── Fallback data (used only if Sanity is unreachable) ── */
const projects = [
  { title: "HAHAHA",                   subtitle: "LIL DICKY",             category: "music-video"  },
  { title: "MANCHILD",                 subtitle: "SABRINA CARPENTER",     category: "music-video"  },
  { title: "POWERBEATS PRO 2",         subtitle: "BEATS x OPEN",          category: "commercial"   },
  { title: "GREEDY",                   subtitle: "TATE MCRAE",            category: "music-video"  },
  { title: "THATS NOT HOW THIS WORKS", subtitle: "CHARLIE PUTH",          category: "music-video"  },
  { title: "SHORT AND SWEET ALBUM",    subtitle: "SABRINA CARPENTER",     category: "photoshoot"   },
  { title: "EXES",                     subtitle: "TATE MCRAE",            category: "music-video"  },
  { title: "ENERGIZING COMFORT",       subtitle: "MERCEDES BENZ",         category: "commercial"   },
];

/* ── Type style classes — printing press & newspaper typefaces ── */
const TYPE_STYLES = [
  "tf-garamond",        // Garamond 1530 — Renaissance text face
  "tf-garamond-bold",   // Garamond heavy display
  "tf-baskerville",     // Baskerville 1757 — transitional
  "tf-baskerville-bold",// Baskerville bold
  "tf-bodoni",          // Bodoni 1798 — newspaper headline serif
  "tf-bodoni-heavy",    // Bodoni heavy display
  "tf-playfair",        // Victorian editorial headline
  "tf-franklin",        // Franklin Gothic 1902 — newspaper grotesque
  "tf-franklin-light",  // Franklin Gothic ultra-thin
  "tf-news-cycle",      // News Cycle — newspaper face
  "tf-oswald",          // Condensed grotesque headline
  "tf-courier",         // Courier 1955 — press typewriter
];

function assignTypeStyles(data) {
  // Shuffle a copy of the styles so no two adjacent rows share a family
  const shuffled = [...TYPE_STYLES].sort(() => Math.random() - 0.5);
  return data.map((p, i) => ({
    ...p,
    tf: shuffled[i % shuffled.length],
  }));
}

let currentFilter = "all";

/* ── Init ── */
async function init() {
  setupLogo();
  setEdition();
  setupOverlay();

  // Fetch from Sanity, fall back to hardcoded if offline
  let data;
  try {
    data = await fetchProjects();
    if (!data.length) throw new Error("empty");
  } catch {
    data = projects.map(p => ({ ...p, imageUrl: p.image }));
  }

  buildList(assignTypeStyles(data));
  setupFilters();
  setupPreview();
  fitAllTitles();
  window.addEventListener("resize", fitAllTitles);
}

/* ── Build list from Sanity data ── */
function buildList(data) {
  const ul = document.getElementById("title-list");
  ul.innerHTML = "";

  data.forEach((p) => {
    const tf  = p.tf || "tf-garamond";
    const img = p.imageUrl || "";

    const li = document.createElement("li");
    li.className = "title-row";
    li.dataset.category = p.category;
    li.dataset.image    = img;

    const displayTitle = p.subtitle ? `${p.title} — ${p.subtitle}` : p.title;
    li.innerHTML = `
      <span class="tr-year">${p.year || ""}</span>
      <span class="tr-title ${tf}">${displayTitle}</span>
      <span class="tr-cat">${p.category}</span>
      ${img ? `<div class="title-row-bg"><img src="${img}" alt="" loading="lazy"></div>` : ""}
    `;

    li.addEventListener("click", () => openProject(p));
    ul.appendChild(li);
  });
}

/* ── Scale each title to fill its column exactly ── */
function fitTitle(el) {
  const col = el.parentElement;
  // Center column width = total - year col - cat col - padding
  const style = getComputedStyle(col);
  const totalW = col.clientWidth
    - parseFloat(style.paddingLeft)
    - parseFloat(style.paddingRight);
  const yearW  = col.querySelector(".tr-year").offsetWidth;
  const catW   = col.querySelector(".tr-cat")?.offsetWidth || 0;
  const gap    = 16 * 1.75 * 2; // rough gap compensation
  const available = totalW - yearW - catW;

  // Binary search for the right font size
  let lo = 6, hi = 400, mid;
  el.style.fontSize = hi + "px";

  while (lo <= hi) {
    mid = (lo + hi) / 2;
    el.style.fontSize = mid + "px";
    if (el.scrollWidth <= available) {
      lo = mid + 0.5;
    } else {
      hi = mid - 0.5;
    }
  }
  el.style.fontSize = (hi - 0.5) + "px";
}

function fitAllTitles() {
  document.querySelectorAll(".tr-title").forEach(fitTitle);
}

/* ── Filters — fade non-matching rows rather than hide, preserving the composition ── */
function setupFilters() {
  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      if (f === currentFilter) return;
      currentFilter = f;

      document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".title-row").forEach((row) => {
        const match = f === "all" || row.dataset.category === f;
        row.classList.toggle("filtered-out", !match);
        row.classList.toggle("filtered-in", match);
      });
    });
  });
}

/* ── Floating image preview ── */
function setupPreview() {
  const preview = document.getElementById("img-float");
  const img     = document.getElementById("img-float-src");

  document.querySelectorAll(".title-row").forEach((row) => {
    const src = row.dataset.image;

    row.addEventListener("mouseenter", () => {
      if (!src) return;
      img.src = src;
      preview.classList.add("on");
    });

    row.addEventListener("mousemove", (e) => {
      if (!src) return;
      const x = Math.min(e.clientX + 28, window.innerWidth - 320);
      const y = Math.min(e.clientY - 80, window.innerHeight - preview.offsetHeight - 20);
      preview.style.transform = `translate(${x}px, ${y}px)`;
    });

    row.addEventListener("mouseleave", () => {
      preview.classList.remove("on");
    });
  });
}

/* ── Logo font cycling ── */
function applyFont(letter, exclude) {
  const pool = FONTS.filter((f) => f.family !== exclude);
  const font  = pool[Math.floor(Math.random() * pool.length)];
  letter.style.fontFamily = `'${font.family}', serif`;
  letter.style.fontWeight = font.weight;
  letter.style.fontStyle  = font.style;
  return font.family;
}

function setupLogo() {
  const letters = [...document.querySelectorAll(".logo-l")];
  const logo    = document.getElementById("logo");

  letters.forEach((l) => applyFont(l, null));
  letters.forEach((l) => {
    l.addEventListener("mouseenter", () => applyFont(l, l.style.fontFamily));
  });

  logo.addEventListener("mousemove", (e) => {
    const mx = e.clientX;
    letters.forEach((l) => {
      const rect = l.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const d    = Math.abs(mx - cx);
      if (d < 70 && Math.random() < (1 - d / 70) * 0.2) {
        applyFont(l, l.style.fontFamily);
      }
    });
  });
}

/* ── Edition number ── */
function setEdition() {
  const el = document.getElementById("edition");
  if (!el) return;
  const days = Math.floor((Date.now() - new Date("2021-01-01")) / 86400000);
  el.textContent = String(days).padStart(4, "0");
}

/* ── Project overlay ── */
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m?.[1] || null;
}

function openProject(p) {
  const overlay  = document.getElementById("project-overlay");
  const titleEl  = overlay.querySelector(".ov-title");
  const yearEl   = overlay.querySelector(".ov-year");
  const catEl    = overlay.querySelector(".ov-cat");
  const body     = overlay.querySelector(".ov-body");

  titleEl.textContent = p.title;
  titleEl.className   = `ov-title ${p.tf || ""}`;
  yearEl.textContent  = p.year;
  catEl.textContent   = p.category;

  body.innerHTML = "";

  const muxId   = p.muxPlaybackId || null;
  const ytId    = getYouTubeId(p.videoUrl);
  const gallery = p.galleryUrls?.filter(Boolean) || [];

  if (muxId) {
    const wrap = document.createElement("div");
    wrap.className = "ov-video";
    wrap.innerHTML = `<mux-player playback-id="${muxId}" stream-type="on-demand" autoplay style="width:100%;height:100%;"></mux-player>`;
    body.appendChild(wrap);
  } else if (ytId) {
    const wrap = document.createElement("div");
    wrap.className = "ov-video";
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
    body.appendChild(wrap);
  } else if (gallery.length) {
    const grid = document.createElement("div");
    grid.className = "ov-gallery";
    gallery.forEach(url => {
      const img = document.createElement("img");
      img.src     = url;
      img.loading = "lazy";
      grid.appendChild(img);
    });
    body.appendChild(grid);
  } else if (p.imageUrl) {
    const wrap = document.createElement("div");
    wrap.className = "ov-single";
    wrap.innerHTML = `<img src="${p.imageUrl}" alt="${p.title}">`;
    body.appendChild(wrap);
  } else {
    body.innerHTML = `<p class="ov-empty">No media available.</p>`;
  }

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeProject() {
  const overlay = document.getElementById("project-overlay");
  overlay.classList.remove("open");
  document.body.style.overflow = "";
  // Stop any playing video
  const iframe = overlay.querySelector("iframe");
  if (iframe) iframe.src = "";
  const muxPlayer = overlay.querySelector("mux-player");
  if (muxPlayer) muxPlayer.pause();
}

function setupOverlay() {
  const overlay = document.getElementById("project-overlay");
  const closeBtn = document.getElementById("ov-close");
  closeBtn.addEventListener("click", closeProject);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeProject();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProject();
  });
}

document.addEventListener("DOMContentLoaded", init);
