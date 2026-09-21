(() => {
  "use strict";

  const downloadBtn = document.getElementById("downloadBtn");
  const downloadLabel = document.getElementById("downloadLabel");

  async function buildCompositeCanvas(data, tileImages, tileStates, variantIndex) {
    const tileSize = 640;
    const captionH = 120;
    const n = data.letters.length;

    const canvas = document.createElement("canvas");
    canvas.width = tileSize * n;
    canvas.height = tileSize + captionH;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      await Promise.all([
        document.fonts.load('800 40px "Cairo"'),
        document.fonts.load('400 22px "Cairo"'),
        document.fonts.load('700 34px "Cairo"'),
      ]);
    } catch (e) {
      /* fall back to default font if webfont isn't ready */
    }

    // RTL reading order: the first letter (data.letters[0]) must end up on the
    // rightmost side of the canvas, so we place a left-to-right-reversed copy.
    const order = [...data.letters].reverse();

    order.forEach((letter, i) => {
      const variant = letter.variants[variantIndex] || letter.variants[0];
      const img = tileImages[letter.id];
      const x = i * tileSize;
      const shouldFlip = variant.flip_vertical && tileStates[letter.id] !== "placeholder";

      if (shouldFlip) {
        ctx.save();
        ctx.translate(x, tileSize);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0, tileSize, tileSize);
        ctx.restore();
      } else {
        ctx.drawImage(img, x, 0, tileSize, tileSize);
      }

      if (i > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tileSize);
        ctx.stroke();
      }

      const bx = x + tileSize - 60;
      const by = 60;
      ctx.beginPath();
      ctx.arc(bx, by, 34, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(5,7,13,0.65)";
      ctx.fill();
      ctx.strokeStyle = "rgba(111,211,255,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#eaf3ff";
      ctx.font = '700 34px "Cairo", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter.char, bx, by + 2);
    });

    ctx.fillStyle = "#0a1220";
    ctx.fillRect(0, tileSize, canvas.width, captionH);
    ctx.strokeStyle = "rgba(111,211,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(0, tileSize);
    ctx.lineTo(canvas.width, tileSize);
    ctx.stroke();

    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eaf3ff";
    ctx.font = '800 40px "Cairo", sans-serif';
    ctx.fillText(data.name.ar, canvas.width / 2, tileSize + captionH * 0.4);

    ctx.fillStyle = "#7fb0d9";
    ctx.font = '400 22px "Cairo", sans-serif';
    ctx.fillText(data.credit_ar, canvas.width / 2, tileSize + captionH * 0.78);

    return canvas;
  }

  async function handleDownload() {
    const APP = window.SARA_APP;
    if (!APP || !APP.data) return;

    downloadBtn.disabled = true;
    const prevLabel = downloadLabel.textContent;
    downloadLabel.textContent = "جارِ التجهيز…";

    try {
      const canvas = await buildCompositeCanvas(APP.data, APP.tileImages, APP.tileStates, APP.variantIndex);
      canvas.toBlob((blob) => {
        if (!blob) {
          downloadLabel.textContent = prevLabel;
          downloadBtn.disabled = false;
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(APP.data.name.en || "name").toLowerCase()}-in-landsat.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        downloadLabel.textContent = prevLabel;
        downloadBtn.disabled = false;
      }, "image/png");
    } catch (err) {
      console.error("Failed to build download image:", err);
      downloadLabel.textContent = prevLabel;
      downloadBtn.disabled = false;
    }
  }

  downloadBtn.addEventListener("click", handleDownload);
})();
