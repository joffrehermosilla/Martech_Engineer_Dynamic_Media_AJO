import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../public/index.html");

let raw = fs.readFileSync(htmlPath, "utf-8");
const isCrlf = raw.includes("\r\n");
let html = raw.replace(/\r\n/g, "\n");

console.log("Original HTML length:", html.length);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Modificar renderCatalogGrid para incluir thumbnail fallback vectorial
//    previniendo imágenes rotas (Image 2 y 3)
// ─────────────────────────────────────────────────────────────────────────────
const targetCatalogCard = `            const thumbUrl = a.deliveryUrl || "/damcraft/jobs/sample_card/visa_signature.png";`;

const replacementCatalogCard = `            // Fallback vectorial con branding oficial BCP si la URL de AEM Cloud no responde
            const fallbackSvg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(\`
              <svg width="400" height="240" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="bcpCardGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#002A8F"/><stop offset="100%" stop-color="#05080E"/></linearGradient></defs>
                <rect width="100%" height="100%" fill="url(#bcpCardGrad)"/>
                <rect x="20" y="20" width="80" height="32" rx="6" fill="#FF7800"/>
                <text x="60" y="42" fill="#FFFFFF" font-family="'Archivo', sans-serif" font-weight="900" font-size="16" text-anchor="middle">BCP</text>
                <text x="24" y="110" fill="#FFFFFF" font-family="'Archivo', sans-serif" font-weight="bold" font-size="18">\${(a.title || 'Activo BCP').substring(0, 26)}</text>
                <text x="24" y="140" fill="#FF7800" font-family="monospace" font-size="12">\${a.assetId || ''}</text>
                <text x="24" y="170" fill="#94A3B8" font-family="'Archivo', sans-serif" font-size="13">\${a.category || 'ASSET_DAM'}</text>
              </svg>
            \`);
            const thumbUrl = a.deliveryUrl && !a.deliveryUrl.includes("adobeaemcloud.com") ? a.deliveryUrl : fallbackSvg;`;

if (html.includes(targetCatalogCard)) {
  html = html.replace(targetCatalogCard, replacementCatalogCard);
  console.log("✅ 1. Fallback vectorial de thumbnails para evitar imágenes rotas añadido");
} else {
  console.warn("⚠️ 1. targetCatalogCard no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Modificar img tag en catálogo para que su onerror use fallbackSvg
// ─────────────────────────────────────────────────────────────────────────────
const targetCatalogImg = `<img src="\${thumbUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=\\'text-align:center;color:#64748B;font-size:0.85rem;\\'>🖼️ \${a.title}</div>';">`;

const replacementCatalogImg = `<img src="\${thumbUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='\${fallbackSvg}';">`;

if (html.includes(targetCatalogImg)) {
  html = html.replace(targetCatalogImg, replacementCatalogImg);
  console.log("✅ 2. Manejador onerror del catálogo actualizado");
} else {
  console.warn("⚠️ 2. targetCatalogImg no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Inyectar funciones para:
//    - addOfficialBcpLogo(variant)
//    - Drag & drop de capas en canvas con el mouse
//    - Selección, centrado y alineación con mouse
//    - Buscador en vivo de piezas en el compositor
//    - Exportación de video en formato .mp4
//    - Modal y sincronización de Nuevos Casos de Uso / Iniciativas
// ─────────────────────────────────────────────────────────────────────────────
const targetInitCompositor = `    function initCompositor() {
      compositorCanvas = document.getElementById("multiLayerCanvas");
      if (!compositorCanvas) return;
      compositorCtx = compositorCanvas.getContext("2d");

      // Poblar selector de piezas con activos aprobados del catálogo
      populateCompositorPicker();

      // Si no hay capas, inicializar con fondo corporativo BCP
      if (compositorLayers.length === 0) {
        renderCompositorCanvas();
      }
    }`;

const replacementInitCompositor = `    let selectedLayerIndex = null;
    let isDraggingLayer = false;
    let dragStartX = 0;
    let dragStartY = 0;

    function initCompositor() {
      compositorCanvas = document.getElementById("multiLayerCanvas");
      if (!compositorCanvas) return;
      compositorCtx = compositorCanvas.getContext("2d");

      // Adjuntar eventos de ratón para arrastre interactivo (Drag & Drop en Canvas)
      setupCanvasInteractions();

      // Cargar iniciativas en los selectores
      loadGovernanceInitiatives();

      // Poblar selector de piezas con activos aprobados del catálogo
      populateCompositorPicker();

      // Si no hay capas, inicializar con fondo corporativo BCP
      if (compositorLayers.length === 0) {
        renderCompositorCanvas();
      }
    }

    // ─── INTERACCIÓN Y ARRASTRE DE CAPAS CON EL MOUSE (DRAG & DROP) ───────────
    function setupCanvasInteractions() {
      if (!compositorCanvas || compositorCanvas._hasDragListeners) return;
      compositorCanvas._hasDragListeners = true;

      compositorCanvas.style.cursor = "move";

      function getCanvasCoords(e) {
        const rect = compositorCanvas.getBoundingClientRect();
        const scaleX = compositorCanvas.width / rect.width;
        const scaleY = compositorCanvas.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        };
      }

      compositorCanvas.addEventListener("mousedown", (e) => {
        const { x, y } = getCanvasCoords(e);
        let foundIdx = null;

        // Búsqueda en orden inverso de Z-index (capa superior primero)
        for (let i = compositorLayers.length - 1; i >= 0; i--) {
          const l = compositorLayers[i];
          const lw = (l.width || (l.img && l.img.naturalWidth) || 300) * (l.scale || 1.0);
          const lh = (l.height || (l.img && l.img.naturalHeight) || 120) * (l.scale || 1.0);

          if (x >= l.x && x <= l.x + lw && y >= l.y && y <= l.y + lh) {
            foundIdx = i;
            break;
          }
        }

        if (foundIdx !== null) {
          selectedLayerIndex = foundIdx;
          isDraggingLayer = true;
          dragStartX = x - compositorLayers[foundIdx].x;
          dragStartY = y - compositorLayers[foundIdx].y;
          renderCompositorCanvas();
          updateLayerStackUI();
        } else {
          selectedLayerIndex = null;
          renderCompositorCanvas();
          updateLayerStackUI();
        }
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDraggingLayer || selectedLayerIndex === null) return;
        const { x, y } = getCanvasCoords(e);
        const l = compositorLayers[selectedLayerIndex];
        if (l) {
          l.x = Math.round(x - dragStartX);
          l.y = Math.round(y - dragStartY);
          renderCompositorCanvas();
        }
      });

      window.addEventListener("mouseup", () => {
        if (isDraggingLayer) {
          isDraggingLayer = false;
        }
      });
    }

    // ─── ALINEACIÓN DE CAPA SELECCIONADA (CENTRAR H / V / TODO) ──────────────
    function alignSelectedLayer(mode) {
      if (selectedLayerIndex === null || !compositorLayers[selectedLayerIndex]) {
        showToast("Selecciona una capa en el lienzo o en la pila para alinear.", "warning");
        return;
      }
      const l = compositorLayers[selectedLayerIndex];
      const cw = compositorCanvas.width;
      const ch = compositorCanvas.height;
      const lw = (l.width || (l.img && l.img.naturalWidth) || 300) * (l.scale || 1.0);
      const lh = (l.height || (l.img && l.img.naturalHeight) || 120) * (l.scale || 1.0);

      if (mode === "centerH" || mode === "centerBoth") {
        l.x = Math.round((cw - lw) / 2);
      }
      if (mode === "centerV" || mode === "centerBoth") {
        l.y = Math.round((ch - lh) / 2);
      }
      renderCompositorCanvas();
      showToast(\`Capa #\${selectedLayerIndex + 1} centrada correctamente\`, "success");
    }

    // ─── LOGOS OFICIALES BCP EN CUALQUIER FORMATO ─────────────────────────────
    function addOfficialBcpLogo(variant) {
      const layerId = "bcp_logo_" + variant + "_" + Date.now();
      let svgMarkup = "";
      let title = "Logo Oficial BCP";

      if (variant === "orange") {
        title = "Logo BCP Naranja Oficial";
        svgMarkup = \`<svg width="240" height="90" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" rx="14" fill="#FF7800"/>
          <text x="32" y="58" font-family="'Archivo', sans-serif" font-weight="900" font-size="44" fill="#FFFFFF">BCP</text>
          <path d="M160 30 L185 45 L160 60 Z" fill="#FFFFFF"/>
          <path d="M185 30 L210 45 L185 60 Z" fill="#002A8F"/>
        </svg>\`;
      } else if (variant === "blue") {
        title = "Logo BCP Azul Corporativo";
        svgMarkup = \`<svg width="240" height="90" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" rx="14" fill="#002A8F" stroke="#FF7800" stroke-width="2"/>
          <text x="32" y="58" font-family="'Archivo', sans-serif" font-weight="900" font-size="44" fill="#FFFFFF">BCP</text>
          <path d="M160 30 L185 45 L160 60 Z" fill="#FF7800"/>
          <path d="M185 30 L210 45 L185 60 Z" fill="#FFFFFF"/>
        </svg>\`;
      } else if (variant === "white") {
        title = "Logo BCP Blanco Puro";
        svgMarkup = \`<svg width="240" height="90" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" rx="14" fill="rgba(255,255,255,0.15)" stroke="#FFFFFF" stroke-width="2"/>
          <text x="32" y="58" font-family="'Archivo', sans-serif" font-weight="900" font-size="44" fill="#FFFFFF">BCP</text>
          <path d="M160 30 L185 45 L160 60 Z" fill="#FFFFFF"/>
          <path d="M185 30 L210 45 L185 60 Z" fill="rgba(255,255,255,0.6)"/>
        </svg>\`;
      } else {
        title = "Emblema Chevrones BCP";
        svgMarkup = \`<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="56" fill="#002A8F" stroke="#FF7800" stroke-width="4"/>
          <path d="M38 35 L65 60 L38 85 Z" fill="#FF7800"/>
          <path d="M62 35 L89 60 L62 85 Z" fill="#FFFFFF"/>
        </svg>\`;
      }

      const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        renderCompositorCanvas();
        updateLayerStackUI();
      };
      img.src = url;

      compositorLayers.push({
        id: layerId,
        assetId: "bcp_official_" + variant,
        title: title,
        img: img,
        width: variant === "chevron" ? 120 : 240,
        height: variant === "chevron" ? 120 : 90,
        x: 60 + compositorLayers.length * 20,
        y: 60 + compositorLayers.length * 20,
        scale: 1.0,
        opacity: 1.0,
        blendMode: "source-over"
      });

      selectedLayerIndex = compositorLayers.length - 1;
      renderCompositorCanvas();
      updateLayerStackUI();
      showToast(\`🏷️ \${title} insertado en el lienzo (arrástralo con el mouse)\`, "success");
    }

    // ─── BUSCADOR EN VIVO DE PIEZAS APROBADAS ──────────────────────────────────
    let compositorSearchQuery = "";
    function filterCompositorPicker(query) {
      compositorSearchQuery = (query || "").trim().toLowerCase();
      populateCompositorPicker();
    }

    function populateCompositorPicker() {
      const picker = document.getElementById("compositorAssetPicker");
      const countLabel = document.getElementById("compositorPiecesCount");
      if (!picker) return;

      let assets = (window.cachedCatalogAssets || []).filter(a => a.status === "APPROVED");
      if (compositorSearchQuery) {
        assets = assets.filter(a =>
          (a.title || "").toLowerCase().includes(compositorSearchQuery) ||
          (a.assetId || "").toLowerCase().includes(compositorSearchQuery) ||
          (a.category || "").toLowerCase().includes(compositorSearchQuery)
        );
      }

      if (countLabel) countLabel.innerText = \`\${assets.length} disponibles\`;

      if (assets.length === 0) {
        picker.innerHTML = \`
          <div style="font-size:0.8rem; color:var(--ink-2); padding:0.5rem; text-align:center;">
            \${compositorSearchQuery ? 'No se encontraron piezas con ese nombre.' : 'No hay piezas aprobadas en el catálogo aún.'}<br>
            <span style="font-size:0.75rem; color:var(--ink-3);">Aprueba un activo en Workfront o inserta un logo BCP arriba.</span>
          </div>\`;
        return;
      }

      picker.innerHTML = assets.map(a => \`
        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.4rem 0.6rem;">
          <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden;">
            <div style="width:30px; height:30px; border-radius:4px; background:#002A8F; display:flex; align-items:center; justify-content:center; font-size:0.8rem; flex-shrink:0;">
              🖼️
            </div>
            <div style="overflow:hidden;">
              <div style="font-size:0.82rem; font-weight:600; color:var(--ink-1); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">\${a.title}</div>
              <div style="font-size:0.72rem; color:var(--ink-3);">\${a.category || 'ASSET'} · \${a.assetId}</div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addAssetLayerToCompositor('\${a.assetId}', '\${encodeURIComponent(a.title)}', '\${a.deliveryUrl || ''}')" style="padding:0.25rem 0.5rem; font-size:0.75rem; flex-shrink:0;">
            + Capa
          </button>
        </div>
      \`).join("");
    }

    // ─── GOBERNANZA: GESTIÓN DE NUEVAS INICIATIVAS / CASOS DE USO ─────────────
    async function loadGovernanceInitiatives() {
      try {
        const res = await apiFetch("/api/governance/initiatives");
        if (res.initiatives && res.initiatives.length > 0) {
          const selects = [
            document.getElementById("govInitiativeId"),
            document.getElementById("batchInitiativeSelect"),
            document.getElementById("compositeInitiativeSelect")
          ];

          selects.forEach(sel => {
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = res.initiatives.map(i => \`
              <option value="\${i.initiativeId}">\${i.initiativeId} | \${i.name}</option>
            \`).join("");
            if (currentVal) sel.value = currentVal;
          });
        }
      } catch (err) {
        console.warn("Error cargando iniciativas:", err.message);
      }
    }

    function openNewInitiativeModal() {
      const m = document.getElementById("newInitiativeModal");
      if (m) m.style.display = "flex";
    }

    function closeNewInitiativeModal() {
      const m = document.getElementById("newInitiativeModal");
      if (m) m.style.display = "none";
    }

    async function saveNewInitiative() {
      const id = document.getElementById("newInitId")?.value.trim().toUpperCase();
      const name = document.getElementById("newInitName")?.value.trim();
      const intention = document.getElementById("newInitIntention")?.value || "PROMOTION";
      const audience = document.getElementById("newInitAudience")?.value.trim() || "CLIENTES_BCP";

      if (!id || !name) {
        showToast("El código y nombre de la iniciativa son requeridos.", "warning");
        return;
      }

      try {
        await apiFetch("/api/governance/initiatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initiativeId: id,
            name: name,
            intention: intention,
            targetAudience: audience
          })
        });

        showToast(\`✅ Caso de uso '\${name}' registrado exitosamente en Atlas/Local\`, "success");
        closeNewInitiativeModal();
        await loadGovernanceInitiatives();
      } catch (err) {
        showToast("Error al registrar iniciativa: " + err.message, "danger");
      }
    }

    // ─── EXPORTACIÓN DE VIDEO EN FORMATO .MP4 ─────────────────────────────────
    async function exportCompositorAnimation() {
      if (!compositorCanvas) return;
      if (typeof MediaRecorder === "undefined") {
        showToast("MediaRecorder no está disponible en este navegador.", "danger");
        return;
      }

      const btn = document.getElementById("btnExportVideo");
      if (btn) { btn.disabled = true; btn.innerText = "🎬 Grabando video .mp4..."; }
      showToast("🎬 Grabando animación de 3 segundos desde Canvas en formato MP4...", "info");

      try {
        const stream = compositorCanvas.captureStream(30);
        let mime = "";
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
          mime = "video/mp4;codecs=avc1";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mime = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          mime = "video/webm;codecs=vp9";
        } else {
          mime = "video/webm";
        }

        const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mime || "video/mp4" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const title = (document.getElementById("compositeAssetTitle")?.value || "BCP_Animacion").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
          a.href = url;
          a.download = \`\${title}_\${Date.now()}.mp4\`;
          a.click();
          if (btn) { btn.disabled = false; btn.innerText = "🎬 Exportar Video (.mp4)"; }
          showToast("🎬 ¡Video animado .mp4 exportado y descargado exitosamente!", "success");
        };

        recorder.start();

        // Animar un pulso o sutil paneo por 3 segundos
        const start = performance.now();
        function animateFrame(now) {
          const elapsed = now - start;
          if (elapsed < 3000) {
            renderCompositorCanvas();
            requestAnimationFrame(animateFrame);
          } else {
            recorder.stop();
            renderCompositorCanvas();
          }
        }
        requestAnimationFrame(animateFrame);
      } catch (err) {
        if (btn) { btn.disabled = false; btn.innerText = "🎬 Exportar Video (.mp4)"; }
        showToast("Error al exportar video: " + err.message, "danger");
      }
    }`;

if (html.includes(targetInitCompositor)) {
  html = html.replace(targetInitCompositor, replacementInitCompositor);
  console.log("✅ 3. Interactividad completa del compositor (Drag&Drop, Logos BCP, Buscador, MP4 e Iniciativas) inyectada");
} else {
  console.warn("⚠️ 3. targetInitCompositor no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Modificar renderCompositorCanvas para dibujar contorno de selección en la capa activa
// ─────────────────────────────────────────────────────────────────────────────
const targetEndRenderLoop = `        compositorCtx.restore();
      });

      // Marca de agua oficial BCP en esquina`;

const replacementEndRenderLoop = `        // Si esta capa es la seleccionada, dibujar contorno interactivo de selección
        if (idx === selectedLayerIndex) {
          const selW = (layer.width || (layer.img && layer.img.naturalWidth) || 300) * (layer.scale || 1.0);
          const selH = (layer.height || (layer.img && layer.img.naturalHeight) || 120) * (layer.scale || 1.0);
          compositorCtx.strokeStyle = "#FF7800";
          compositorCtx.lineWidth = 2;
          compositorCtx.setLineDash([6, 4]);
          compositorCtx.strokeRect(layer.x - 4, layer.y - 4, selW + 8, selH + 8);
          compositorCtx.setLineDash([]);

          // Puntos de esquina
          compositorCtx.fillStyle = "#FF7800";
          compositorCtx.fillRect(layer.x - 7, layer.y - 7, 7, 7);
          compositorCtx.fillRect(layer.x + selW, layer.y - 7, 7, 7);
          compositorCtx.fillRect(layer.x - 7, layer.y + selH, 7, 7);
          compositorCtx.fillRect(layer.x + selW, layer.y + selH, 7, 7);

          // Etiqueta de posición
          compositorCtx.fillStyle = "rgba(0, 42, 143, 0.9)";
          compositorCtx.fillRect(layer.x - 4, layer.y - 26, 120, 20);
          compositorCtx.fillStyle = "#FFFFFF";
          compositorCtx.font = "bold 11px monospace";
          compositorCtx.fillText(\`X:\${layer.x} Y:\${layer.y}\`, layer.x, layer.y - 12);
        }

        compositorCtx.restore();
      });

      // Marca de agua oficial BCP en esquina`;

if (html.includes(targetEndRenderLoop)) {
  html = html.replace(targetEndRenderLoop, replacementEndRenderLoop);
  console.log("✅ 4. Contorno de selección visual e indicador interactivo X, Y añadido");
} else {
  console.warn("⚠️ 4. targetEndRenderLoop no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Asegurar que loadCatalog() se invoque al iniciar sesión y al cargar DOM
// ─────────────────────────────────────────────────────────────────────────────
const targetInitCall = `      // Iniciar sesión por defecto como administrador en demo
      loginAs('admin');
    });`;

const replacementInitCall = `      // Iniciar sesión y precargar catálogo para que DAM Craft y Compositor tengan assets listos
      loginAs('admin');
      loadCatalog();
      loadGovernanceInitiatives();
    });`;

if (html.includes(targetInitCall)) {
  html = html.replace(targetInitCall, replacementInitCall);
  console.log("✅ 5. Precarga automática de catálogo e iniciativas añadida al arranque");
} else {
  console.warn("⚠️ 5. targetInitCall no encontrado");
}

fs.writeFileSync(htmlPath, isCrlf ? html.replace(/\n/g, "\r\n") : html, "utf-8");
console.log("Parte 2 completada exitosamente.");
