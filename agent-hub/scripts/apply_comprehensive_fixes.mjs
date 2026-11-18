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
// 1. Agregar botón para Crear Nuevo Caso de Uso / Iniciativa en Gobernanza
// ─────────────────────────────────────────────────────────────────────────────
const govHeadSearch = `<div class="card-header">
            <h2 class="card-title">🛡️ Validación de Mandamientos BCP</h2>
            <span class="badge badge-info" id="govDecisionBadge">LISTO</span>
          </div>`;

const govHeadReplace = `<div class="card-header">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <div>
                <h2 class="card-title">🛡️ Validación de Mandamientos BCP</h2>
                <span class="badge badge-info" id="govDecisionBadge">LISTO</span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" onclick="openNewInitiativeModal()" title="Permite dar de alta una nueva iniciativa o caso de uso en MongoDB Atlas y en todo el sistema.">
                ➕ Nuevo Caso de Uso / Iniciativa
              </button>
            </div>
          </div>`;

if (html.includes(govHeadSearch)) {
  html = html.replace(govHeadSearch, govHeadReplace);
  console.log("✅ 1. Botón 'Nuevo Caso de Uso' añadido en Gobernanza");
} else {
  console.warn("⚠️ 1. govHeadSearch no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Insertar Modal para Registrar Nueva Iniciativa / Caso de Uso en Gobernanza
// ─────────────────────────────────────────────────────────────────────────────
const modalHtml = `
  <!-- MODAL: CREAR NUEVA INICIATIVA / CASO DE USO BCP -->
  <div id="newInitiativeModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center; padding:1rem;">
    <div style="background:var(--surface); border:1px solid var(--bcp-orange); border-radius:var(--radius); max-width:540px; width:100%; padding:1.5rem; box-shadow:0 12px 48px rgba(0,0,0,0.8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">
        <h3 style="font-size:1.1rem; font-weight:700; color:var(--ink-1); margin:0;">➕ Registrar Nuevo Caso de Uso / Iniciativa BCP</h3>
        <button type="button" class="icon-btn" onclick="closeNewInitiativeModal()">✕</button>
      </div>
      <div class="form-row">
        <label>Código de Iniciativa (ej: INIT-BCP-HIPO-2026-04):</label>
        <input type="text" id="newInitId" placeholder="INIT-BCP-CAMP-..." style="text-transform:uppercase;">
      </div>
      <div class="form-row">
        <label>Nombre del Caso de Uso / Campaña:</label>
        <input type="text" id="newInitName" placeholder="Campaña Hipotecario Tasa Baja 2026">
      </div>
      <div class="form-row">
        <label>Intención Principal:</label>
        <select id="newInitIntention">
          <option value="PROMOTION">PROMOTION (Promoción comercial)</option>
          <option value="ONBOARDING">ONBOARDING (Bienvenida cliente)</option>
          <option value="RETENTION">RETENTION (Fidelización)</option>
          <option value="EDUCATIONAL">EDUCATIONAL (Educación financiera)</option>
        </select>
      </div>
      <div class="form-row">
        <label>Público Objetivo (CDP Audience):</label>
        <input type="text" id="newInitAudience" value="CLIENTES_BCP_PREAPROBADOS">
      </div>
      <div style="display:flex; gap:0.5rem; margin-top:1.25rem;">
        <button type="button" class="btn btn-secondary" onclick="closeNewInitiativeModal()" style="flex:1;">Cancelar</button>
        <button type="button" class="btn btn-orange" onclick="saveNewInitiative()" style="flex:1;">💾 Guardar en Atlas / Local</button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="newInitiativeModal"')) {
  html = html.replace('</body>', `${modalHtml}\n</body>`);
  console.log("✅ 2. Modal de creación de casos de uso añadido al DOM");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mesa de Montaje: Añadir buscador en vivo, selector de logos oficiales y DeepLinks
// ─────────────────────────────────────────────────────────────────────────────
const compositorPickerSearch = `            <!-- Piezas Aprobadas del Catálogo DAM -->
            <div>
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--ink-2); display:block; margin-bottom:0.5rem;">
                💎 Piezas Aprobadas del Catálogo DAM
              </span>
              <div id="compositorAssetPicker"`;

const compositorPickerReplace = `            <!-- Selector de Logos Oficiales BCP -->
            <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.85rem;">
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--ink-2); display:block; margin-bottom:0.5rem;">
                🏷️ Logos Oficiales BCP (Todos los Formatos)
              </span>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="addOfficialBcpLogo('orange')" style="font-size:0.75rem; padding:0.35rem; background:rgba(255,120,0,0.15); border-color:#FF7800; color:#FF7800;" title="Inserta el logo BCP en color naranja oficial">
                  🟧 Logo Naranja
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addOfficialBcpLogo('blue')" style="font-size:0.75rem; padding:0.35rem; background:rgba(0,42,143,0.3); border-color:#0084FF; color:#0084FF;" title="Inserta el logo BCP en color azul corporativo">
                  🟦 Logo Azul
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addOfficialBcpLogo('white')" style="font-size:0.75rem; padding:0.35rem; background:rgba(255,255,255,0.1); border-color:#fff; color:#fff;" title="Inserta el logo BCP en blanco puro para fondos oscuros">
                  ⬜ Logo Blanco
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addOfficialBcpLogo('chevron')" style="font-size:0.75rem; padding:0.35rem;" title="Inserta los dos chevrones oficiales entrelazados de BCP">
                  🔷 Emblema BCP
                </button>
              </div>
            </div>

            <!-- Piezas Aprobadas del Catálogo DAM -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--ink-2);">
                  💎 Piezas Aprobadas
                </span>
                <span style="font-size:0.72rem; color:var(--ink-3);" id="compositorPiecesCount">0</span>
              </div>
              <!-- Buscador en vivo de piezas por nombre o ID -->
              <div style="margin-bottom:0.5rem;">
                <input type="text" id="compositorAssetSearch" placeholder="🔍 Buscar por nombre o ID..." oninput="filterCompositorPicker(this.value)"
                       style="padding:0.35rem 0.6rem; font-size:0.78rem; width:100%; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--ink-1);">
              </div>
              <div id="compositorAssetPicker"`;

if (html.includes(compositorPickerSearch)) {
  html = html.replace(compositorPickerSearch, compositorPickerReplace);
  console.log("✅ 3. Logos Oficiales BCP y Buscador en vivo añadidos a Mesa de Montaje");
} else {
  console.warn("⚠️ 3. compositorPickerSearch no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Barra de Herramientas de Lienzo (Centrar H, Centrar V, Centrar Todo, Eliminar Capa)
// ─────────────────────────────────────────────────────────────────────────────
const canvasStatsSearch = `            <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:0.5rem; font-size:0.75rem; color:var(--ink-2);">
              <span id="canvasStatsLabel">0 capas activas</span>
              <span>Lienzo HTML5 Canvas 2D</span>
            </div>`;

const canvasStatsReplace = `            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:0.5rem; font-size:0.75rem; color:var(--ink-2); flex-wrap:wrap; gap:0.4rem;">
              <span id="canvasStatsLabel">0 capas activas (Arrastra las capas con el mouse)</span>
              <!-- Barra de Alineación de la Capa Seleccionada -->
              <div style="display:flex; gap:0.3rem;" id="canvasAlignBar">
                <button type="button" class="btn btn-secondary btn-sm" onclick="alignSelectedLayer('centerH')" style="font-size:0.72rem; padding:0.2rem 0.4rem;" title="Centrar horizontalmente la capa seleccionada">↔ Centrar H</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="alignSelectedLayer('centerV')" style="font-size:0.72rem; padding:0.2rem 0.4rem;" title="Centrar verticalmente la capa seleccionada">↕ Centrar V</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="alignSelectedLayer('centerBoth')" style="font-size:0.72rem; padding:0.2rem 0.4rem;" title="Centrar al centro exacto del lienzo">🎯 Centrar Todo</button>
              </div>
            </div>`;

if (html.includes(canvasStatsSearch)) {
  html = html.replace(canvasStatsSearch, canvasStatsReplace);
  console.log("✅ 4. Barra de alineación para interactuar y centrar con mouse añadida");
} else {
  console.warn("⚠️ 4. canvasStatsSearch no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Selector de Familia de Iniciativa y DeepLink en Generación del Activo
// ─────────────────────────────────────────────────────────────────────────────
const titleSearch = `              <div>
                <label style="font-size:0.72rem; font-weight:700; color:var(--ink-2); display:block; margin-bottom:0.25rem;">Título del Nuevo Activo Compuesto:</label>
                <input type="text" id="compositeAssetTitle" value="BCP_Composicion_Multicapa_2026" style="padding:0.4rem 0.6rem; font-size:0.8rem; width:100%;">
              </div>`;

const titleReplace = `              <div>
                <label style="font-size:0.72rem; font-weight:700; color:var(--ink-2); display:block; margin-bottom:0.25rem;">Familia de Iniciativa / Caso de Uso:</label>
                <select id="compositeInitiativeSelect" style="padding:0.4rem 0.6rem; font-size:0.8rem; width:100%; margin-bottom:0.4rem;">
                  <option value="INIT-BCP-CAMP-2026-01">INIT-BCP-CAMP-2026-01 | Campaña Verano BCP</option>
                  <option value="INIT-BCP-CARD-2026-02">INIT-BCP-CARD-2026-02 | Visa Signature Gastronomía</option>
                  <option value="INIT-BCP-MORT-2026-03">INIT-BCP-MORT-2026-03 | Hipotecario MiVivienda Verde</option>
                </select>
                <label style="font-size:0.72rem; font-weight:700; color:var(--ink-2); display:block; margin-bottom:0.25rem;">Título del Nuevo Activo Compuesto:</label>
                <input type="text" id="compositeAssetTitle" value="BCP_Composicion_Multicapa_2026" style="padding:0.4rem 0.6rem; font-size:0.8rem; width:100%; margin-bottom:0.4rem;">
                <label style="font-size:0.72rem; font-weight:700; color:var(--ink-2); display:block; margin-bottom:0.25rem;">🔗 DeepLink / URL de Destino (CDP / AJO CTA):</label>
                <input type="text" id="compositeDeepLink" value="bcp://bancamovil/tarjeta?lead={{profile.lead_id}}&camp=verano2026" style="padding:0.4rem 0.6rem; font-size:0.8rem; width:100%;" placeholder="https://viabcp.com/... o bcp://app/...">
              </div>`;

if (html.includes(titleSearch)) {
  html = html.replace(titleSearch, titleReplace);
  console.log("✅ 5. Familia de Iniciativa y DeepLink CDP añadidos al Compositor");
} else {
  console.warn("⚠️ 5. titleSearch no encontrado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Botón de Video en formato .mp4 explícito
// ─────────────────────────────────────────────────────────────────────────────
const videoSearchBtn = `title="Graba y exporta un clip animado de 3 segundos en video WebM usando MediaRecorder de HTML5 Canvas.">
                  🎬 Exportar Video (WebM)
                </button>`;

const videoReplaceBtn = `title="Graba y exporta un clip animado en formato MP4 nativo usando MediaRecorder de HTML5 Canvas.">
                  🎬 Exportar Video (.mp4)
                </button>`;

if (html.includes(videoSearchBtn)) {
  html = html.replace(videoSearchBtn, videoReplaceBtn);
  console.log("✅ 6. Botón de video actualizado a formato .mp4");
} else {
  console.warn("⚠️ 6. videoSearchBtn no encontrado");
}

fs.writeFileSync(htmlPath, isCrlf ? html.replace(/\n/g, "\r\n") : html, "utf-8");
console.log("Parte 1 completada exitosamente.");
