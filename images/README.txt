The site has two image SETS, switchable with the icon toggle under the
poem: 🇸🇦 "من السعودية" and 🌍 "حول العالم". Put your own photos here
using exactly these filenames:

  Saudi Arabia set (default)   World set
  seen.jpg  -> س                seen-2.jpg  -> س
  alef.jpg  -> ا                alef-2.jpg  -> ا
  ra.jpg    -> ر                ra-2.jpg    -> ر
  ha.jpg    -> ه                ha-2.jpg    -> ه

Until a file exists, each tile falls back automatically, in this order:

  1. images/<name>.jpg or images/<name>-2.jpg   (what you provide)
  2. a live satellite crop of that variant's lat/lon in data/letters.json
     (Esri World Imagery; see js/app.js -> buildMapPreviewUrl())
  3. a generated tile showing just the Arabic letter, if there's no
     lat/lon or the live preview can't be reached (offline, etc.)

Current locations in data/letters.json:

  Saudi Arabia set:
  - seen (س): Wadi Al Disah, Tabuk Province — Wikipedia documents three
              separate canyons converging here, approximating Seen's teeth.
  - alef (ا): A site near Duba, Tabuk Province (27.3320805, 35.7191649) —
              chosen directly for its straight line. Zoomed to 0.004°,
              which is as tight as the live preview can go at that exact
              spot before the satellite service errors out (its maximum
              available resolution there) — see note below.
  - ra (ر):   A site near Duba, Tabuk Province (27.3377796, 35.7061381) —
              chosen directly for its downward-facing curve. Same 0.004°
              zoom ceiling as alef.
  - ha (ه):   One center-pivot irrigation circle near Tabuk — radius
              ~1.15km, matching known Saudi pivot-circle sizes, cropped
              tightly so it fills the tile on its own.

  World set:
  - seen (س): Mississippi bird's-foot delta, Louisiana — flipped vertically
              (flip_vertical: true) so the branching channels point up like
              Seen's teeth instead of down toward the Gulf.
  - alef (ا): Suez Canal at El Qantara, Egypt — dead straight.
  - ra (ر):   Horseshoe Bend, Arizona — a sharp single hook.
  - ha (ه):   Crater Lake, Oregon — a near-perfect circle.

A note on zoom limits: the free Esri World Imagery layer only has a certain
maximum resolution at any given spot. If you tighten zoom_span_deg past
what's available, the export request errors out and the tile silently
falls back to the plain-letter placeholder instead of showing a closer
crop. If a tile you expect to show a live preview shows the placeholder
instead, that's the most likely reason — try a slightly larger
zoom_span_deg, or add a real photo file (see below) instead.

Tips for choosing/preparing real images:
- Roughly square photos (e.g. 1000x1000 or larger) crop best into the tiles.
- Good sources: NASA Earth Observatory, NASA Worldview, USGS EarthExplorer,
  ESA Sentinel Hub — all offer public-domain or openly licensed Landsat
  imagery with location/date metadata you can copy into data/letters.json.
- After adding a photo, update its matching variant entry in
  data/letters.json with the real location name, coordinates (lat/lon), and
  a short note about why the feature resembles the letter. The lat/lon and
  coordinates fields are independent — coordinates is just the display
  string, lat/lon drives the live preview fallback above, so keep both in
  sync.
- These live crops are still just a preview of the real place — replacing
  them with an actual curated Landsat photo (properly framed, correct
  bands/colors) from the sources above will always look better than the
  automatic satellite-basemap crop, and lets you zoom in as tight as you
  like since you control the framing yourself.
- Want a third (or more) set? Add another object to "variant_sets" (with an
  "icon" emoji and "label_ar") and push a matching variant onto every
  letter's "variants" array in data/letters.json — the toggle grows another
  button automatically.
