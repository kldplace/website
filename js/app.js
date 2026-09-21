(() => {
  "use strict";

  /** Shared state other scripts (download.js) can read once populated. */
  const APP = (window.SARA_APP = {
    data: null,
    tileImages: {}, // id -> <img> element (real photo or placeholder)
    tileStates: {}, // id -> "photo" | "map-preview" | "placeholder"
    variantIndex: 0,
  });

  const tilesEl = document.getElementById("tiles");
  const downloadBtn = document.getElementById("downloadBtn");
  const downloadLabel = document.getElementById("downloadLabel");
  const setToggleEl = document.getElementById("setToggle");

  function activeVariant(letter) {
    return letter.variants[APP.variantIndex] || letter.variants[0];
  }

  /** Builds an inline SVG data URL used until a real photo is added. */
  function placeholderDataUrl(char) {
    const size = 800;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b1730"/>
            <stop offset="55%" stop-color="#123a5e"/>
            <stop offset="100%" stop-color="#081120"/>
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6fd3ff" stroke-opacity="0.06" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <text x="50%" y="48%" font-size="${size * 0.42}" fill="#eaf3ff" fill-opacity="0.9"
              text-anchor="middle" dominant-baseline="middle">${char}</text>
        <text x="50%" y="10%" font-size="${size * 0.032}" fill="#7fb0d9"
              text-anchor="middle" font-family="sans-serif">بطاقة نائبة — أضف صورة في images</text>
      </svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  /**
   * Builds a real satellite-imagery crop for the variant's coordinates using
   * Esri's World Imagery export service (no API key, CORS-enabled). This is
   * only a live preview of the real location — not the final curated
   * Landsat photo — until a matching file is added under images/.
   */
  function buildMapPreviewUrl(variant, size = 800) {
    if (typeof variant.lat !== "number" || typeof variant.lon !== "number") return null;
    const span = variant.zoom_span_deg || 0.05;
    const bbox = [
      variant.lon - span,
      variant.lat - span,
      variant.lon + span,
      variant.lat + span,
    ].join(",");
    return (
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export" +
      `?bbox=${bbox}&bboxSR=4326&imageSR=102100&size=${size},${size}` +
      "&format=png32&transparent=false&f=image"
    );
  }

  function buildCaptionMarkup(variant) {
    return `
      <span class="loc-ar">${variant.location_ar}</span>
      <span class="coords">${variant.coordinates}</span>
    `;
  }

  function tagLineHtml(state) {
    if (state === "map-preview") {
      return '<span class="preview-tag">معاينة تلقائية لموقع الإحداثيات — ليست صورة لاندسات نهائية</span>';
    }
    if (state === "placeholder") {
      return '<span class="preview-tag">بطاقة نائبة — أضف صورة حقيقية في images/</span>';
    }
    return "";
  }

  function createTile(letter, variant) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.setAttribute("aria-label", variant.location_ar);
    tile.setAttribute("aria-expanded", "false");

    const img = document.createElement("img");
    img.alt = `${letter.char} — ${variant.location_ar}`;
    img.loading = "eager";

    const badge = document.createElement("span");
    badge.className = "tile-badge";
    badge.textContent = letter.char;
    badge.setAttribute("aria-hidden", "true");

    const caption = document.createElement("span");
    caption.className = "tile-caption";
    caption.innerHTML = buildCaptionMarkup(variant);

    tile.appendChild(img);
    tile.appendChild(badge);
    tile.appendChild(caption);

    // tap-to-toggle caption on touch/mobile; desktop already gets it via CSS :hover/:focus-visible
    tile.addEventListener("click", () => {
      const isShown = tile.classList.toggle("show-caption");
      tile.setAttribute("aria-expanded", String(isShown));
    });

    return { tile, img };
  }

  /** Assigns `src` and resolves true/false once the image loads or errors. */
  function tryLoad(img, src) {
    return new Promise((resolve) => {
      const onLoad = () => {
        cleanup();
        resolve(true);
      };
      const onError = () => {
        cleanup();
        resolve(false);
      };
      function cleanup() {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      }
      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onError, { once: true });
      img.src = src;
    });
  }

  /**
   * Resolution order for each tile:
   *  1. the real photo at variant.image (images/seen.jpg, etc.)
   *  2. a live satellite crop of variant.lat/lon (Esri World Imagery)
   *  3. a drawn letter-shape placeholder (always succeeds, data: URL)
   * Returns which state was used, for captioning.
   */
  async function resolveTileImage(img, letter, variant, tile) {
    if (await tryLoad(img, variant.image)) {
      return "photo";
    }

    const previewUrl = buildMapPreviewUrl(variant);
    if (previewUrl) {
      img.crossOrigin = "anonymous";
      if (await tryLoad(img, previewUrl)) {
        tile.classList.add("map-preview-tile");
        return "map-preview";
      }
      img.removeAttribute("crossorigin");
    }

    await tryLoad(img, placeholderDataUrl(letter.char));
    tile.classList.add("placeholder-tile");
    return "placeholder";
  }

  /** Some real-world crops need a vertical flip to visually align with the letter (e.g. a curve that opens the "wrong" way). Never flips the drawn-letter placeholder itself. */
  function applyOrientation(img, variant, state) {
    if (variant.flip_vertical && state !== "placeholder") {
      img.classList.add("flip-v");
    }
  }

  function renderTiles(data) {
    tilesEl.innerHTML = "";
    APP.tileImages = {};
    APP.tileStates = {};
    downloadBtn.disabled = true;
    const loads = [];

    data.letters.forEach((letter) => {
      const variant = activeVariant(letter);
      const { tile, img } = createTile(letter, variant);
      tilesEl.appendChild(tile);
      APP.tileImages[letter.id] = img;

      const done = resolveTileImage(img, letter, variant, tile).then((state) => {
        APP.tileStates[letter.id] = state;
        applyOrientation(img, variant, state);
        const tag = tagLineHtml(state);
        if (tag) {
          tile.querySelector(".tile-caption").insertAdjacentHTML("beforeend", tag);
        }
      });
      loads.push(done);
    });

    Promise.all(loads).then(() => {
      downloadBtn.disabled = false;
      downloadLabel.textContent = "تحميل الصورة";
    });
  }

  /** Renders a large, touch-friendly two-way switch for picking the image set. */
  function renderSetToggle() {
    if (!setToggleEl || !APP.data || !APP.data.variant_sets) return;
    const sets = APP.data.variant_sets;

    setToggleEl.innerHTML = "";
    setToggleEl.setAttribute("role", "group");
    setToggleEl.setAttribute("aria-label", "اختيار مجموعة الصور");

    sets.forEach((set, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "set-toggle-btn" + (i === APP.variantIndex ? " active" : "");
      btn.title = set.label_ar;
      btn.setAttribute("aria-label", set.label_ar);
      btn.setAttribute("aria-pressed", String(i === APP.variantIndex));

      const icon = document.createElement("span");
      icon.className = "set-toggle-icon";
      icon.textContent = set.icon || "•";
      icon.setAttribute("aria-hidden", "true");
      btn.appendChild(icon);
      btn.addEventListener("click", () => {
        if (APP.variantIndex === i) return;
        APP.variantIndex = i;
        renderSetToggle(); // reflect the selection immediately, don't wait on image loads
        renderTiles(APP.data);
      });
      setToggleEl.appendChild(btn);
    });
  }

  async function init() {
    const res = await fetch("data/letters.json");
    const data = await res.json();
    APP.data = data;

    document.title = `${data.name.ar} من الفضاء`;
    renderTiles(data);
    renderSetToggle();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
