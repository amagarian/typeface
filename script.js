/* ── Sanity config ── */
const SANITY_PROJECT_ID = "jnzz8urn";
const SANITY_DATASET    = "production";
const SANITY_API_URL    = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}`;

async function fetchProjects() {
  const query = encodeURIComponent(
    `*[_type == "project" && "typeface" in sites] | order(order asc) {
      title, year, category,
      "imageUrl": image.asset->url
    }`
  );
  const res  = await fetch(`${SANITY_API_URL}?query=${query}`);
  const data = await res.json();
  return data.result || [];
}

/* ── Logo font pool — historically significant typefaces ── */
const FONTS = [
  { family: "EB Garamond",        weight: "400", style: "normal"  }, // Garamond ~1530
  { family: "EB Garamond",        weight: "400", style: "italic"  },
  { family: "EB Garamond",        weight: "800", style: "normal"  },
  { family: "Cinzel",             weight: "400", style: "normal"  }, // Roman inscription, 113 AD
  { family: "Cinzel",             weight: "900", style: "normal"  },
  { family: "Libre Baskerville",  weight: "400", style: "normal"  }, // Baskerville 1754
  { family: "Libre Baskerville",  weight: "400", style: "italic"  },
  { family: "Libre Baskerville",  weight: "700", style: "normal"  },
  { family: "Bodoni Moda",        weight: "400", style: "italic"  }, // Bodoni 1798
  { family: "Bodoni Moda",        weight: "900", style: "normal"  },
  { family: "UnifrakturMaguntia", weight: "400", style: "normal"  }, // Fraktur / Gutenberg ~1450
  { family: "Libre Franklin",     weight: "100", style: "normal"  }, // Franklin Gothic 1902
  { family: "Libre Franklin",     weight: "900", style: "normal"  },
  { family: "Josefin Sans",       weight: "100", style: "normal"  }, // Futura 1927
  { family: "Josefin Sans",       weight: "700", style: "normal"  },
  { family: "Oswald",             weight: "200", style: "normal"  }, // Trade Gothic 1948
  { family: "Oswald",             weight: "700", style: "normal"  },
  { family: "Courier Prime",      weight: "400", style: "normal"  }, // IBM Courier 1955
  { family: "Playfair Display",   weight: "900", style: "italic"  }, // Victorian display
  { family: "Playfair Display",   weight: "400", style: "italic"  },
];

/* ── Fallback project data (used if Sanity fetch fails) ── */
const projects = [
  { year: "2024", title: "Lil Dicky — Hahaha",                            category: "MUSIC VIDEO",  image: "images/01-lil-dicky-hahaha.jpg" },
  { year: "2025", title: "Sabrina Carpenter — Mans Best Friend",           category: "PHOTO",        image: "images/02-sabrina-carpenter-mans-best-friend.webp" },
  { year: "2025", title: "Adela — Sex on the Beat",                        category: "MUSIC VIDEO",  image: "images/03-adela-sex-on-the-beat.png" },
  { year: "2025", title: "Open x Beats — Power Beats Pro 2",               category: "COMMERCIAL",   image: null },
  { year: "2024", title: "Coin — Take It or Leave It",                     category: "MUSIC VIDEO",  image: "images/05-coin-take-it-or-leave-it.jpg" },
  { year: "2023", title: "Charlie Puth — Thats Not How This Works",        category: "MUSIC VIDEO",  image: "images/06-charlie-puth.png" },
  { year: "2024", title: "Tate McRae — So Close to What (Album Teaser)",  category: "MUSIC VIDEO",  image: null },
  { year: "2024", title: "Sabrina Carpenter — Short & Sweet Press Stills", category: "PHOTO",        image: "images/08-sabrina-carpenter-short-sweet.jpg" },
  { year: "2025", title: "Halsey — So Good",                               category: "MUSIC VIDEO",  image: null },
  { year: "2025", title: "Mercedes — Energizing Comfort",                  category: "COMMERCIAL",   image: null },
  { year: "2025", title: "Sans Gêne — Pre-Fall 2022 Campaign",             category: "COMMERCIAL",   image: null },
  { year: "2025", title: "Olivia Obrien — Olivia Obrien",                  category: "PHOTO",        image: "images/12-olivia-obrien.jpg" },
  { year: "2022", title: "Sabrina Carpenter — Fast Times",                 category: "MUSIC VIDEO",  image: "images/13-sabrina-carpenter-fast-times.jpg" },
  { year: "2024", title: "Tate McRae — So Close to What",                  category: "MUSIC VIDEO",  image: "images/14-tate-mcrae-so-close.jpg" },
  { year: "2021", title: "Spring Summer 2021 — Tatras",                    category: "PHOTO",        image: "images/15-tatras-spring-summer.jpg" },
];

/* ── Type style classes — one per historical typeface era ── */
const TYPE_STYLES = [
  "tf-garamond",       // Claude Garamond, ~1530
  "tf-garamond-bold",  // EB Garamond heavy display
  "tf-cinzel",         // Roman inscription, 113 AD
  "tf-baskerville",    // John Baskerville, 1754
  "tf-bodoni",         // Bodoni, 1798 — didone italic
  "tf-bodoni-heavy",   // Bodoni, 1798 — heavy display
  "tf-fraktur",        // Gutenberg blackletter, ~1450
  "tf-franklin",       // Franklin Gothic, 1902
  "tf-futura",         // Futura, 1927 — Bauhaus
  "tf-oswald",         // Trade Gothic condensed, 1948
  "tf-courier",        // IBM Courier, 1955
  "tf-playfair",       // Victorian high-contrast display
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
    const tf  = p.tf || "tf-cormorant";
    const img = p.imageUrl  || "";

    const li = document.createElement("li");
    li.className = "title-row";
    li.dataset.category = p.category;
    li.dataset.image    = img;

    li.innerHTML = `
      <span class="tr-year">${p.year}</span>
      <span class="tr-title ${tf}">${p.title}</span>
      <span class="tr-cat">${p.category}</span>
      ${img ? `<div class="title-row-bg"><img src="${img}" alt="" loading="lazy"></div>` : ""}
    `;

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
      const x = Math.min(e.clientX + 28, window.innerWidth  - 340);
      const y = Math.min(e.clientY - 80,  window.innerHeight - 220);
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

document.addEventListener("DOMContentLoaded", init);
