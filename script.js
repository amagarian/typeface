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

// Maps a TYPE_STYLES class to its display name (for the colophon)
const STYLE_LABEL = {
  "tf-garamond":        "Garamond",
  "tf-garamond-bold":   "Garamond",
  "tf-baskerville":     "Baskerville",
  "tf-baskerville-bold":"Baskerville",
  "tf-bodoni":          "Bodoni",
  "tf-bodoni-heavy":    "Bodoni",
  "tf-playfair":        "Playfair",
  "tf-franklin":        "Franklin Gothic",
  "tf-franklin-light":  "Franklin Gothic",
  "tf-news-cycle":      "News Cycle",
  "tf-oswald":          "Oswald",
  "tf-courier":         "Courier",
};

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

/* ── Update colophon font list based on styles actually in use ── */
function updateColophon(usedStyles) {
  const el = document.querySelector(".col-fontlist");
  if (!el) return;
  const names = [...new Set(usedStyles.map(s => STYLE_LABEL[s]).filter(Boolean))];
  el.textContent = `Set in ${names.join(", ")}`;
}

/* ── Build list from Sanity data ── */
function buildList(data) {
  const ul = document.getElementById("title-list");
  ul.innerHTML = "";

  const usedStyles = [];

  data.forEach((p) => {
    const tf  = p.tf || "tf-garamond";
    const img = p.imageUrl || "";

    usedStyles.push(tf);

    const li = document.createElement("li");
    li.className = "title-row";
    li.dataset.category = p.category;
    li.dataset.image    = img;

    const displayTitle = p.subtitle ? `${p.subtitle} — ${p.title}` : p.title;
    li.innerHTML = `
      <span class="tr-year">${p.year || ""}</span>
      <span class="tr-title ${tf}">${displayTitle}</span>
      <span class="tr-cat">${p.category}</span>
      ${img ? `<div class="title-row-bg"><img src="${img}" alt="" loading="lazy"></div>` : ""}
    `;

    // On touch devices, open immediately on first tap (skip hover state).
    // Ignore if the finger moved (i.e. the user was scrolling).
    let touchStartY = 0;
    li.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    li.addEventListener("touchend", (e) => {
      const delta = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (delta > 8) return; // scrolled — ignore
      e.preventDefault();
      openProject(p, li);
    });
    li.addEventListener("click", () => openProject(p, li));
    ul.appendChild(li);
  });

  updateColophon(usedStyles);
}

/* ── Scale each title to fill its column exactly ── */
function fitTitle(el) {
  // Set large size first, then read the grid-allocated clientWidth
  // (clientWidth reflects the 1fr column size, not content overflow)
  el.style.fontSize = "400px";
  const available = el.clientWidth;

  let lo = 6, hi = 400, mid;
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
let lastRowRect = null;

function fmtTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m?.[1] || null;
}

function openProject(p, rowEl) {
  const overlay  = document.getElementById("project-overlay");
  const panel    = overlay.querySelector(".ov-panel");
  const titleEl  = overlay.querySelector(".ov-title");
  const yearEl   = overlay.querySelector(".ov-year");
  const catEl    = overlay.querySelector(".ov-cat");
  const capYearEl = overlay.querySelector(".ov-cap-year");
  const capSepEl  = overlay.querySelector(".ov-cap-sep");
  const capCatEl  = overlay.querySelector(".ov-cap-cat");
  const body     = overlay.querySelector(".ov-body");

  lastRowRect = rowEl.getBoundingClientRect();

  // Populate ink bleed-through ghost — clone the full ul so CSS grid layout is preserved
  const ghost  = overlay.querySelector(".ov-ghost");
  const list   = document.getElementById("title-list");
  const header = overlay.querySelector(".ov-header");
  if (ghost && list) {
    ghost.innerHTML = "";
    ghost.appendChild(list.cloneNode(true));
    // Push ghost below the overlay header so it doesn't bleed over it
    ghost.style.top = (header ? header.offsetHeight : 0) + "px";
  }

  titleEl.textContent = p.title;
  titleEl.className   = `ov-title ${p.tf || ""}`;
  yearEl.textContent  = p.year || "";
  catEl.textContent   = p.category || "";

  // Mobile caption strip
  capYearEl.textContent = p.year || "";
  capSepEl.style.display = (p.year && p.category) ? "" : "none";
  capCatEl.textContent  = p.category || "";

  body.innerHTML = "";

  const muxId   = p.muxPlaybackId || null;
  const ytId    = getYouTubeId(p.videoUrl);
  const gallery = p.galleryUrls?.filter(Boolean) || [];

  if (muxId) {
    const wrap = document.createElement("div");
    wrap.className = "ov-mux-wrap";
    wrap.innerHTML = `
      <div class="ov-video" id="ov-video-click">
        <mux-player id="ov-mux" playback-id="${muxId}" stream-type="on-demand" autoplay muted></mux-player>
      </div>
      <div class="ov-controls">
        <div class="ov-progress" id="ov-progress">
          <div class="ov-progress-track"><div class="ov-progress-fill" id="ov-progress-fill"></div></div>
        </div>
        <div class="ov-control-row">
          <div class="ov-control-left">
            <button class="ov-ctrl-btn" id="ov-btn-play">Pause</button>
            <button class="ov-ctrl-btn" id="ov-btn-mute">Unmute</button>
          </div>
          <span class="ov-ctrl-time" id="ov-time">0:00 / 0:00</span>
        </div>
      </div>
    `;
    body.appendChild(wrap);

    // Wire up custom controls after mux-player initialises
    setTimeout(() => {
      const player   = document.getElementById("ov-mux");
      const playBtn  = document.getElementById("ov-btn-play");
      const muteBtn  = document.getElementById("ov-btn-mute");
      const fill     = document.getElementById("ov-progress-fill");
      const timeEl   = document.getElementById("ov-time");
      const progress = document.getElementById("ov-progress");
      const videoBox = document.getElementById("ov-video-click");
      if (!player) return;

      const togglePlay = () => {
        if (player.paused) { player.play(); playBtn.textContent = "Pause"; }
        else               { player.pause(); playBtn.textContent = "Play"; }
      };
      const toggleMute = () => {
        player.muted = !player.muted;
        muteBtn.textContent = player.muted ? "Unmute" : "Mute";
      };

      videoBox.addEventListener("click", togglePlay);
      playBtn.addEventListener("click", togglePlay);
      muteBtn.addEventListener("click", toggleMute);

      player.addEventListener("timeupdate", () => {
        if (!player.duration) return;
        const pct = (player.currentTime / player.duration) * 100;
        fill.style.width = pct + "%";
        timeEl.textContent = fmtTime(player.currentTime) + " / " + fmtTime(player.duration);
      });

      progress.addEventListener("click", (e) => {
        const rect = progress.getBoundingClientRect();
        const frac = (e.clientX - rect.left) / rect.width;
        if (player.duration) player.currentTime = frac * player.duration;
      });
    }, 150);

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

  // Start clip-path at row position, then expand to full
  const vh = window.innerHeight;
  const top = Math.round(lastRowRect.top);
  const bot = Math.round(vh - lastRowRect.bottom);
  panel.style.transition = "none";
  panel.style.clipPath = `inset(${top}px 0px ${bot}px 0px)`;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.style.transition = "clip-path 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      panel.style.clipPath = "inset(0px 0px 0px 0px)";
    });
  });
}

function closeProject() {
  const overlay = document.getElementById("project-overlay");
  const panel   = overlay.querySelector(".ov-panel");

  // Stop any playing video immediately
  const iframe = overlay.querySelector("iframe");
  if (iframe) iframe.src = "";
  const muxPlayer = overlay.querySelector("mux-player");
  if (muxPlayer) muxPlayer.pause();

  // Collapse back toward the originating row
  const vh  = window.innerHeight;
  const top = lastRowRect ? Math.round(lastRowRect.top)  : Math.round(vh / 2);
  const bot = lastRowRect ? Math.round(vh - lastRowRect.bottom) : Math.round(vh / 2);
  panel.style.transition = "clip-path 0.4s cubic-bezier(0.55, 0, 1, 0.45)";
  panel.style.clipPath = `inset(${top}px 0px ${bot}px 0px)`;

  overlay.classList.remove("open");
  document.body.style.overflow = "";

  setTimeout(() => {
    panel.style.transition = "none";
    panel.style.clipPath = "";
  }, 420);
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
