/**
 * fix_geo_and_login.mjs
 * 1. Elimina el botón "Contexto geográfico" del sidebar
 * 2. Elimina la sección standalone <section id="tab-places">
 * 3. Inserta el panel 🌍 Propuesta Geográfica DENTRO de tab-editor
 * 4. Actualiza switchTab para inicializar el panel al abrir editor
 * 5. Elimina "places" de authService.mjs roles
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const PROJECT = path.join(
  path.dirname(fileURLToPath(import.meta.url))
);

const HTML_PATH = path.join(PROJECT, 'agent-hub', 'public', 'index.html');
const AUTH_PATH = path.join(PROJECT, 'agent-hub', 'services', 'authService.mjs');

// ─── 1. PATCH index.html ───────────────────────────────────────────────────
let html = readFileSync(HTML_PATH, 'utf8');
let changes = 0;

// 1a. Remove places nav button
const PLACES_BTN_RE = /[ \t]*<button class="tab-btn" data-tab="places"[^>]*>[\s\S]*?<\/button>\s*/;
if (PLACES_BTN_RE.test(html)) {
  html = html.replace(PLACES_BTN_RE, '');
  changes++;
  console.log('✅ Removed places nav button');
} else {
  console.log('⚠️  Places nav button not found (may already be removed)');
}

// 1b. Remove standalone tab-places section
const PLACES_SECTION_RE = /[ \t]*<!-- ─+ TAB: GEO CONTEXT ─+ -->[\s\S]*?<section id="tab-places">[\s\S]*?<\/section>\s*/;
if (PLACES_SECTION_RE.test(html)) {
  html = html.replace(PLACES_SECTION_RE, '');
  changes++;
  console.log('✅ Removed tab-places standalone section');
} else {
  console.log('⚠️  Standalone tab-places section not found with comment — trying without comment');
  const PLACES_SECTION_RE2 = /[ \t]*<section id="tab-places">[\s\S]*?<\/section>\s*/;
  if (PLACES_SECTION_RE2.test(html)) {
    html = html.replace(PLACES_SECTION_RE2, '');
    changes++;
    console.log('✅ Removed tab-places standalone section (without comment)');
  } else {
    console.log('⚠️  tab-places section not found either way');
  }
}

// 1c. Insert Geo Panel inside tab-editor, right before the 3-column layout
const GEO_PANEL_HTML = `
      <!-- ── PANEL: PROPUESTA GEOGRÁFICA / ESTACIONALIDAD HEMISFÉRICA ── -->
      <details id="geoContextPanel" style="margin-bottom:1.25rem;" open>
        <summary style="
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:0.6rem;
          font-size:0.82rem;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:0.07em;
          color:var(--ink-2);
          padding:0.6rem 0.8rem;
          background:var(--surface-card);
          border:1px solid var(--border);
          border-radius:var(--radius);
          list-style:none;
          user-select:none;
        "
          title="Haz clic para expandir/colapsar el panel de contexto geográfico y propuesta de assets por región y estacionalidad hemisférica.">
          🌍 <span>Propuesta de Assets por Región y Estacionalidad Hemisférica</span>
          <span id="geoToggleIcon" style="margin-left:auto;font-size:0.95rem;">▲</span>
        </summary>
        <div style="
          background:var(--surface-card);
          border:1px solid var(--border);
          border-top:none;
          border-radius:0 0 var(--radius) var(--radius);
          padding:1.25rem;
        ">
          <!-- Info banner -->
          <div style="
            background:rgba(255,120,0,0.08);
            border:1px solid rgba(255,120,0,0.25);
            border-radius:8px;
            padding:0.75rem 1rem;
            font-size:0.8rem;
            color:var(--ink-2);
            margin-bottom:1rem;
            display:flex;
            gap:0.6rem;
            align-items:flex-start;
          ">
            <span style="font-size:1.1rem;">ℹ️</span>
            <span>
              <strong>Anti-Alucinación Hemisférica:</strong> En LATAM, el 25 de diciembre es
              <strong>VERANO ☀️</strong> (playa, calor 26-31°C). En Norteamérica/Europa es
              <strong>INVIERNO ❄️</strong> (nieve, frío). El motor ajusta automáticamente las
              propuestas de assets e imágenes según la región y la época del año seleccionada.
            </span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:0.75rem;align-items:end;flex-wrap:wrap;" id="geoFormRow">
            <!-- Region -->
            <div>
              <label style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-2);display:block;margin-bottom:0.4rem;"
                title="Selecciona la región geográfica del caso de uso para ajustar las propuestas visuales según el hemisferio y el clima local.">
                🗺️ Región / Mercado
              </label>
              <select id="geoRegion" style="width:100%;padding:0.5rem 0.6rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--ink-1);font-size:0.82rem;"
                title="LATAM_COSTA: Perú costa (Lima, Trujillo) · LATAM_ANDINA: Sierra andina (Cusco, Arequipa) · LATAM_SUR: Cono Sur (Chile, Argentina) · NORTEAMERICA: USA/Canadá/México · EUROPA: España/Europa">
                <option value="LATAM_COSTA">🇵🇪 LATAM Costa (Lima, Trujillo…)</option>
                <option value="LATAM_ANDINA">🏔️ LATAM Andina (Cusco, Sierra…)</option>
                <option value="LATAM_SUR">🌊 LATAM Sur (Chile, Argentina)</option>
                <option value="LATAM_CARIBE">🌴 LATAM Caribe (Colombia, Panamá)</option>
                <option value="NORTEAMERICA">🇺🇸 Norteamérica (USA/MX/CA)</option>
                <option value="EUROPA">🇪🇺 Europa (España, UK…)</option>
                <option value="ASIA_PAC">🌏 Asia-Pacífico</option>
              </select>
            </div>

            <!-- Occasion/Season -->
            <div>
              <label style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-2);display:block;margin-bottom:0.4rem;"
                title="Selecciona la época o festividad para proponer assets visuales culturalmente correctos. En el hemisferio sur, diciembre = verano.">
                📅 Época / Festividad
              </label>
              <select id="geoSeason" style="width:100%;padding:0.5rem 0.6rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--ink-1);font-size:0.82rem;"
                title="Navidad Dic-25: hemisferio sur=verano, norte=invierno · Fiestas Patrias: 28 Jul para Perú · Black Friday: noviembre · etc.">
                <option value="NAVIDAD_DIC_25">🎄 Navidad (Dic 25)</option>
                <option value="VERANO_ENE_MAR">☀️ Verano Ene-Mar (HemSur)</option>
                <option value="INVIERNO_JUN_AGO">❄️ Invierno Jun-Ago (HemSur)</option>
                <option value="FIESTAS_PATRIAS_JUL_28">🎆 Fiestas Patrias (28 Jul)</option>
                <option value="BLACK_FRIDAY_NOV">🛍️ Black Friday (Nov)</option>
                <option value="VERANO_JUL_AGO_NORTE">🏖️ Verano Jul-Ago (HemNor)</option>
                <option value="SAN_VALENTIN_FEB">💕 San Valentín (Feb)</option>
                <option value="DIA_MADRE_MAY">🌷 Día de la Madre (May)</option>
                <option value="GENERICO">📆 Campaña Genérica</option>
              </select>
            </div>

            <!-- Use Case -->
            <div>
              <label style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-2);display:block;margin-bottom:0.4rem;"
                title="Describe brevemente el caso de uso o campaña para personalizar las propuestas de assets e imágenes. Ej: 'préstamos personales', 'tarjeta Visa Gold', 'descuentos restaurantes'.">
                🎯 Caso de Uso / Campaña
              </label>
              <input type="text" id="geoUseCase" placeholder="Ej: préstamos personales, Visa Gold…"
                style="width:100%;padding:0.5rem 0.6rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--ink-1);font-size:0.82rem;"
                title="Escribe el nombre del producto o campaña para que el motor IA proponga assets visualmente relevantes para esa región y época."
              />
            </div>

            <!-- CTA Button -->
            <div>
              <button class="btn btn-primary" onclick="proposeGeoAssets()"
                style="white-space:nowrap;width:100%;"
                title="Genera una propuesta de paleta de colores, imágenes y assets visuales adaptados a la región geográfica y la estacionalidad hemisférica seleccionada. Incluye advertencias anti-alucinación para evitar errores culturales (ej: nieve en Lima en diciembre).">
                🌎 Proponer Assets por Región
              </button>
            </div>
          </div>

          <!-- Output area -->
          <div id="geoOutput" style="
            margin-top:1rem;
            min-height:80px;
            background:rgba(0,0,0,0.25);
            border:1px solid var(--border);
            border-radius:var(--radius);
            padding:1rem;
            font-size:0.82rem;
            color:var(--ink-2);
            font-family:var(--font-mono);
            white-space:pre-wrap;
          ">Selecciona una región, época y caso de uso para proponer assets culturalmente correctos…</div>

          <!-- Asset Proposal Grid -->
          <div id="geoAssetGrid" style="display:none;margin-top:1rem;">
            <p style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-2);margin-bottom:0.6rem;">
              🖼️ Assets Propuestos para esta Región/Estación
            </p>
            <div id="geoAssetGridItems" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.75rem;"></div>
          </div>

          <!-- Location enrichment sub-panel -->
          <details style="margin-top:1rem;" id="geoLocationPanel">
            <summary style="font-size:0.78rem;font-weight:600;color:var(--ink-2);cursor:pointer;padding:0.4rem 0;"
              title="Busca una sede o dirección específica para enriquecer el contexto geográfico del activo visual (barrio, clima local, referencias culturales).">
              📍 Enriquecer con ubicación específica (sede / evento)
            </summary>
            <div style="display:flex;gap:0.6rem;margin-top:0.6rem;">
              <input type="text" id="placesQuery" value="San Isidro"
                placeholder="Ej: San Isidro, La Molina, Cusco…"
                style="flex:1;padding:0.45rem 0.6rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--ink-1);font-size:0.82rem;"
                title="Escribe la sede, barrio o ciudad del evento para enriquecer el contexto visual con datos locales (infraestructura, clima, referencias culturales del lugar)."
              />
              <button class="btn btn-secondary btn-sm" onclick="lookupLocation()"
                title="Consulta el contexto de la ubicación ingresada para enriquecer la propuesta visual con datos geográficos y culturales locales.">
                📍 Consultar
              </button>
            </div>
            <div id="placesOutput" class="result-box" style="margin-top:0.6rem;font-size:0.78rem;">
              Consulte una sede para enriquecer el contexto del activo visual…
            </div>
          </details>
        </div>
      </details>

`;

// Insert before the editor header div
const EDITOR_HEADER_MARKER = `      <!-- Header de la sección -->`;
if (html.includes(EDITOR_HEADER_MARKER)) {
  html = html.replace(EDITOR_HEADER_MARKER, GEO_PANEL_HTML + EDITOR_HEADER_MARKER);
  changes++;
  console.log('✅ Inserted Geo Panel inside tab-editor');
} else {
  // Fallback: insert before the editor-layout div
  const LAYOUT_MARKER = `      <!-- Layout de 3 columnas -->`;
  if (html.includes(LAYOUT_MARKER)) {
    html = html.replace(LAYOUT_MARKER, GEO_PANEL_HTML + LAYOUT_MARKER);
    changes++;
    console.log('✅ Inserted Geo Panel inside tab-editor (fallback marker)');
  } else {
    console.log('❌ Could not find insertion point for Geo Panel!');
  }
}

// 1d. Add proposeGeoAssets JS function and toggle behavior inside switchTab block
// Insert after lookupLocation function reference or before closing </script>
const GEO_JS = `
    // ═══════════════════════════════════════════════════════════════════
    // GEO ASSETS PROPOSAL — Panel dentro del Editor Nativo
    // ═══════════════════════════════════════════════════════════════════
    function initGeoPanel() {
      // Toggle icon for <details> element
      const details = document.getElementById('geoContextPanel');
      const icon = document.getElementById('geoToggleIcon');
      if (details && icon) {
        details.addEventListener('toggle', () => {
          icon.textContent = details.open ? '▲' : '▼';
        });
      }
    }

    async function proposeGeoAssets() {
      const region = document.getElementById('geoRegion').value;
      const season = document.getElementById('geoSeason').value;
      const useCase = document.getElementById('geoUseCase').value.trim() || 'campaña general';
      const output = document.getElementById('geoOutput');
      const grid = document.getElementById('geoAssetGrid');
      const gridItems = document.getElementById('geoAssetGridItems');

      output.textContent = '⏳ Consultando propuesta geográfica…';
      grid.style.display = 'none';

      try {
        const url = \`/api/places/seasonality?region=\${encodeURIComponent(region)}&season=\${encodeURIComponent(season)}&useCase=\${encodeURIComponent(useCase)}\`;
        const data = await apiFetch(url);

        let txt = '';
        if (data.antiHallucinationWarning) {
          txt += \`🚫 ADVERTENCIA ANTI-ALUCINACIÓN:\\n\${data.antiHallucinationWarning}\\n\\n\`;
        }
        if (data.hemisphere) {
          txt += \`🌐 Hemisferio: \${data.hemisphere}\\n\`;
        }
        if (data.season) {
          txt += \`🌡️ Estación real: \${data.season}\\n\`;
        }
        if (data.palette) {
          txt += \`\\n🎨 Paleta sugerida:\\n\`;
          (data.palette || []).forEach(c => { txt += \`  • \${c}\\n\`; });
        }
        if (data.imageSuggestions?.length) {
          txt += \`\\n🖼️ Imágenes sugeridas:\\n\`;
          data.imageSuggestions.forEach(img => { txt += \`  • \${img}\\n\`; });
          // Build grid
          gridItems.innerHTML = data.imageSuggestions.map(img => \`
            <div style="
              background:var(--surface-2);
              border:1px solid var(--border);
              border-radius:var(--radius-sm);
              padding:0.75rem 0.5rem;
              text-align:center;
              font-size:0.72rem;
              color:var(--ink-2);
              cursor:pointer;
              transition:border-color 0.15s;
            " 
            onclick="editorLoadImageUrl('')"
            onmouseover="this.style.borderColor='var(--bcp-orange)'"
            onmouseout="this.style.borderColor='var(--border)'"
            title="Asset propuesto para \${region} en \${season}: \${img}">
              <span style="font-size:1.5rem;display:block;margin-bottom:0.4rem;">🖼️</span>
              <span>\${img}</span>
            </div>
          \`).join('');
          grid.style.display = 'block';
        }
        if (data.copyTone) {
          txt += \`\\n✍️ Tono de copy: \${data.copyTone}\\n\`;
        }
        if (data.notes) {
          txt += \`\\n📝 Notas: \${data.notes}\\n\`;
        }
        output.textContent = txt || JSON.stringify(data, null, 2);
      } catch (err) {
        output.textContent = \`❌ Error al consultar propuesta geográfica: \${err.message}\\n\\nVerifica que el servidor esté activo en localhost:3000\`;
      }
    }

`;

// Find the lookupLocation function and insert the geo functions before it
const LOOKUP_MARKER = `    async function lookupLocation()`;
if (html.includes(LOOKUP_MARKER)) {
  html = html.replace(LOOKUP_MARKER, GEO_JS + LOOKUP_MARKER);
  changes++;
  console.log('✅ Inserted proposeGeoAssets() JS function');
} else {
  console.log('⚠️  lookupLocation not found, trying alternate insertion point');
}

// 1e. Update switchTab: add initGeoPanel call when opening editor tab
const EDITOR_TAB_HOOK = `      if (tabId === "editor") editorOnTabOpen();`;
const EDITOR_TAB_HOOK_NEW = `      if (tabId === "editor") { editorOnTabOpen(); initGeoPanel(); }`;
if (html.includes(EDITOR_TAB_HOOK)) {
  html = html.replace(EDITOR_TAB_HOOK, EDITOR_TAB_HOOK_NEW);
  changes++;
  console.log('✅ Updated switchTab to call initGeoPanel on editor open');
}

// Write patched HTML
writeFileSync(HTML_PATH, html, 'utf8');
console.log(`\n📝 index.html written with ${changes} changes.`);

// ─── 2. PATCH authService.mjs ─────────────────────────────────────────────
let auth = readFileSync(AUTH_PATH, 'utf8');
let authChanges = 0;

// Remove "places" from all tabs arrays
const before = auth;
auth = auth.replace(/"places",?\s*/g, '');
// Clean up any double commas that might appear
auth = auth.replace(/,\s*,/g, ',');
// Clean up trailing commas before ]
auth = auth.replace(/,\s*\]/g, ']');

if (auth !== before) {
  authChanges++;
  console.log('✅ Removed "places" from authService.mjs tabs arrays');
} else {
  console.log('ℹ️  "places" not found in authService.mjs (may already be removed)');
}

writeFileSync(AUTH_PATH, auth, 'utf8');
console.log(`📝 authService.mjs written with ${authChanges} changes.`);
console.log('\n🎉 All patches applied!');
