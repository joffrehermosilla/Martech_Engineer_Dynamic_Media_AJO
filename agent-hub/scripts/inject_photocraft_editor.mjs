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
// 1. REEMPLAZAR LA SECCIÓN HTML DE TAB-EDITOR POR EL ESTUDIO COMPLETO PHOTOCRAFT
// ─────────────────────────────────────────────────────────────────────────────
const editorSectionStart = `      <!-- Header de la sección -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <h1 style="font-size:1.3rem; font-weight:800; margin-bottom:0.25rem;">🖊️ Editor Nativo de Assets</h1>
          <p style="font-size:0.82rem; color:var(--ink-2);">HTML5 Canvas · Sin dependencias externas · Sirve a humanos y agentes MCP — <span style="color:var(--success);">IMPLEMENTADO</span></p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="editorUndo()" id="editorUndoBtn" disabled title="Deshacer">↩ Deshacer</button>
          <button class="btn btn-secondary btn-sm" onclick="editorRedo()" id="editorRedoBtn" disabled title="Rehacer">↪ Rehacer</button>
          <button class="btn btn-primary btn-sm" onclick="editorExport()" id="editorExportBtn" disabled>⬇️ Exportar</button>
          <button class="btn btn-orange btn-sm" onclick="editorSendToApproval()" id="editorApprovalBtn" disabled>📤 Enviar</button>
        </div>
      </div>

      <!-- Layout de 3 columnas -->
      <div class="editor-layout">`;

const editorSectionEnd = `      </div><!-- /editor-layout -->
    </section><!-- /tab-editor -->`;

const startIdx = html.indexOf(editorSectionStart);
const endIdx = html.indexOf(editorSectionEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error("❌ No se encontraron los delimitadores de tab-editor");
  process.exit(1);
}

const photoCraftStudioHtml = `      <!-- ── PHOTOCRAFT STUDIO FULL SUITE (REVERSE ENGINEERED HTML5 CANVAS) ── -->
      <div class="photocraft-container" style="background:#1e1e1e; border:1px solid #333; border-radius:var(--radius); overflow:hidden; display:flex; flex-direction:column; min-height:680px; box-shadow:0 12px 40px rgba(0,0,0,0.6); color:#e0e0e0;">

        <!-- 1. BARRA SUPERIOR DE MENÚ PHOTOCRAFT -->
        <div style="background:#2d2d2d; border-bottom:1px solid #3d3d3d; display:flex; align-items:center; justify-content:space-between; padding:0.3rem 0.75rem; font-size:0.82rem; user-select:none;">
          <div style="display:flex; gap:0.25rem; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.4rem; font-weight:900; color:#FF7800; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(255,120,0,0.1); margin-right:0.5rem;">
              🎨 PhotoCraft Studio
            </div>
            <div class="pc-menu-item" onclick="pcMenuAction('new')" style="padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;">Archivo ▼</div>
            <div class="pc-menu-item" onclick="pcMenuAction('undo')" style="padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;">Edición ▼</div>
            <div class="pc-menu-item" onclick="pcApplyFilter('invert')" style="padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;">Imagen ▼</div>
            <div class="pc-menu-item" onclick="pcAddTextPrompt()" style="padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;">Capa ▼</div>
            <div class="pc-menu-item" onclick="pcApplyFilter('grayscale')" style="padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;">Filtro ▼</div>
            <div class="pc-menu-item" onclick="pcResetZoom()" style="padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;">Vista ▼</div>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('pcStudioFileInput').click()" style="font-size:0.75rem; padding:0.25rem 0.6rem;">📂 Abrir Imagen (Ctrl+O)</button>
            <input type="file" id="pcStudioFileInput" accept="image/*" style="display:none;" onchange="pcLoadImageFile(event)">
            <button type="button" class="btn btn-orange btn-sm" onclick="pcExportImage('png')" style="font-size:0.75rem; padding:0.25rem 0.6rem;">⬇️ Guardar PNG</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="pcExportImage('jpeg')" style="font-size:0.75rem; padding:0.25rem 0.6rem;">⬇️ Guardar JPG</button>
            <button type="button" class="btn btn-success btn-sm" onclick="pcSendToDamCatalog()" style="font-size:0.75rem; padding:0.25rem 0.6rem;">☁️ Guardar en Catálogo DAM</button>
          </div>
        </div>

        <!-- 2. BARRA DE OPCIONES DE HERRAMIENTA ACTIVA -->
        <div style="background:#252525; border-bottom:1px solid #333; padding:0.35rem 0.75rem; display:flex; align-items:center; gap:1.25rem; font-size:0.78rem; color:#aaa; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span style="color:#FF7800; font-weight:700;" id="pcActiveToolLabel">🖌️ Pincel</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <label>Grosor:</label>
            <input type="range" id="pcBrushSize" min="1" max="100" value="12" style="width:90px;" oninput="document.getElementById('pcBrushSizeVal').innerText = this.value + 'px'">
            <span id="pcBrushSizeVal" style="color:#fff; font-family:monospace; min-width:32px;">12px</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <label>Opacidad:</label>
            <input type="range" id="pcBrushOpacity" min="10" max="100" value="100" style="width:80px;" oninput="document.getElementById('pcBrushOpVal').innerText = this.value + '%'">
            <span id="pcBrushOpVal" style="color:#fff; font-family:monospace; min-width:36px;">100%</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <label>Modo:</label>
            <select id="pcBlendModeSelect" style="background:#1e1e1e; border:1px solid #444; color:#fff; padding:0.2rem 0.4rem; font-size:0.75rem; border-radius:4px;">
              <option value="source-over">Normal</option>
              <option value="multiply">Multiplicar</option>
              <option value="screen">Trama</option>
              <option value="overlay">Superponer</option>
            </select>
          </div>
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <label>Preset Canvas:</label>
            <select id="pcPresetSelect" onchange="pcApplyPresetSize(this.value)" style="background:#1e1e1e; border:1px solid #444; color:#FF7800; padding:0.2rem 0.4rem; font-size:0.75rem; border-radius:4px; font-weight:bold;">
              <option value="1200x628">AJO InWeb (1200×628)</option>
              <option value="800x800">WhatsApp Flow (800×800)</option>
              <option value="1080x1080">Instagram (1080×1080)</option>
              <option value="1080x1920">Stories / TikTok (1080×1920)</option>
            </select>
          </div>
        </div>

        <!-- 3. WORKSPACE: TOOLBAR IZQUIERDA + LIENZO CENTRAL + DOCKS DERECHOS -->
        <div style="display:flex; flex:1; overflow:hidden; min-height:560px;">

          <!-- A. BARRA VERTICAL DE HERRAMIENTAS PHOTOCRAFT (IZQUIERDA) -->
          <div style="width:48px; background:#252525; border-right:1px solid #333; display:flex; flex-direction:column; align-items:center; padding:0.5rem 0; gap:0.25rem; flex-shrink:0;">
            <button type="button" class="pc-tool-btn active" id="toolMove" onclick="pcSelectTool('move')" title="Mover / Selección (V)">↖️</button>
            <button type="button" class="pc-tool-btn" id="toolMarquee" onclick="pcSelectTool('marquee')" title="Marco Rectangular (M)">⬚</button>
            <button type="button" class="pc-tool-btn" id="toolCrop" onclick="pcSelectTool('crop')" title="Recorte (C)">✂️</button>
            <button type="button" class="pc-tool-btn" id="toolEyedropper" onclick="pcSelectTool('eyedropper')" title="Cuentagotas (I)">💧</button>
            <button type="button" class="pc-tool-btn" id="toolBrush" onclick="pcSelectTool('brush')" title="Pincel / Pintar (B)">🖌️</button>
            <button type="button" class="pc-tool-btn" id="toolEraser" onclick="pcSelectTool('eraser')" title="Borrador (E)">🧹</button>
            <button type="button" class="pc-tool-btn" id="toolGradient" onclick="pcSelectTool('gradient')" title="Degradado BCP (G)">🌈</button>
            <button type="button" class="pc-tool-btn" id="toolText" onclick="pcSelectTool('text')" title="Texto Tipográfico (T)">✍️</button>
            <button type="button" class="pc-tool-btn" id="toolShape" onclick="pcSelectTool('shape')" title="Formas / Insignias BCP (U)">⬛</button>
            <button type="button" class="pc-tool-btn" id="toolZoom" onclick="pcSelectTool('zoom')" title="Zoom (Z)">🔍</button>

            <!-- Separador -->
            <div style="width:32px; height:1px; background:#444; margin:0.4rem 0;"></div>

            <!-- Color Swatches (Frontal y Fondo superpuestos) -->
            <div style="position:relative; width:34px; height:34px; margin-top:0.25rem;">
              <input type="color" id="pcFgColor" value="#FF7800" style="position:absolute; top:0; left:0; width:22px; height:22px; border:1px solid #fff; border-radius:3px; padding:0; cursor:pointer;" title="Color Frontal (Primario)">
              <input type="color" id="pcBgColor" value="#002A8F" style="position:absolute; bottom:0; right:0; width:22px; height:22px; border:1px solid #aaa; border-radius:3px; padding:0; cursor:pointer;" title="Color de Fondo">
            </div>
            <button type="button" onclick="pcSwapColors()" style="background:none; border:none; color:#888; font-size:0.75rem; cursor:pointer; margin-top:0.2rem;" title="Intercambiar colores (X)">⤾</button>
          </div>

          <!-- B. LIENZO CENTRAL CANVAS PHOTOCRAFT -->
          <div style="flex:1; background:#181818; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; overflow:auto; padding:1.5rem;" id="pcCanvasArea">
            
            <!-- Welcome screen cuando no hay documento abierto (Fiel a Imagen 6) -->
            <div id="pcWelcomeScreen" style="text-align:center; max-width:440px; padding:2rem; background:#222; border:1px solid #333; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5);">
              <div style="font-size:2.4rem; font-weight:900; color:#fff; margin-bottom:0.4rem;">PhotoCraft <span style="font-size:0.9rem; font-weight:normal; color:#888;">código abierto</span></div>
              <p style="color:#aaa; font-size:0.88rem; margin-bottom:1.5rem;">Cree un documento nuevo o abra un archivo existente.</p>
              <div style="display:flex; gap:0.75rem; justify-content:center; margin-bottom:1.25rem;">
                <button type="button" class="btn btn-primary" onclick="pcCreateNewDocument(1200, 628)" style="font-weight:700;">Documento nuevo... Ctrl+N</button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('pcStudioFileInput').click()">Abrir... Ctrl+O</button>
              </div>
              <div style="font-size:0.78rem; color:#666; border-top:1px solid #333; padding-top:0.75rem;">
                🖼️ Suelte una imagen o haga clic para empezar a editar con la suite de diseño BCP.
              </div>
            </div>

            <!-- Canvas de Dibujo y Composición Real HTML5 -->
            <canvas id="photoCraftCanvas" width="1200" height="628" style="display:none; max-width:96%; max-height:86%; box-shadow:0 12px 48px rgba(0,0,0,0.8); border:1px solid #444; border-radius:4px; background:#fff; cursor:crosshair;"></canvas>
          </div>

          <!-- C. PANELES LATERALES DERECHOS (COLOR, MUESTRAS, CAPAS Y AJUSTES) -->
          <div style="width:260px; background:#252525; border-left:1px solid #333; display:flex; flex-direction:column; overflow-y:auto; flex-shrink:0;">
            
            <!-- Panel 1: Paleta BCP & Muestras -->
            <div style="padding:0.75rem; border-bottom:1px solid #333;">
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#FF7800; margin-bottom:0.5rem;">
                🎨 Paleta Oficial BCP
              </div>
              <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:0.35rem; margin-bottom:0.6rem;">
                <div onclick="pcSetFgColor('#002A8F')" style="height:28px; background:#002A8F; border-radius:4px; cursor:pointer;" title="Azul BCP (#002A8F)"></div>
                <div onclick="pcSetFgColor('#FF7800')" style="height:28px; background:#FF7800; border-radius:4px; cursor:pointer;" title="Naranja BCP (#FF7800)"></div>
                <div onclick="pcSetFgColor('#FFD700')" style="height:28px; background:#FFD700; border-radius:4px; cursor:pointer;" title="Dorado (#FFD700)"></div>
                <div onclick="pcSetFgColor('#FFFFFF')" style="height:28px; background:#FFFFFF; border:1px solid #444; border-radius:4px; cursor:pointer;" title="Blanco (#FFFFFF)"></div>
                <div onclick="pcSetFgColor('#05080E')" style="height:28px; background:#05080E; border:1px solid #444; border-radius:4px; cursor:pointer;" title="Negro (#05080E)"></div>
              </div>
            </div>

            <!-- Panel 2: Acciones Rápidas de Diseño -->
            <div style="padding:0.75rem; border-bottom:1px solid #333;">
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#aaa; margin-bottom:0.5rem;">
                ⚡ Elementos de Marca
              </div>
              <div style="display:flex; flex-direction:column; gap:0.4rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcInsertBrandElement('logo_orange')" style="font-size:0.75rem; justify-content:flex-start;">🏷️ Logo BCP Naranja</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcInsertBrandElement('logo_blue')" style="font-size:0.75rem; justify-content:flex-start;">🏷️ Logo BCP Azul</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcInsertBrandElement('badge_promo')" style="font-size:0.75rem; justify-content:flex-start;">🏷️ Sello Oferta Exclusiva</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcAddTextPrompt()" style="font-size:0.75rem; justify-content:flex-start;">✍️ Insertar Texto en Canvas</button>
              </div>
            </div>

            <!-- Panel 3: Filtros de Imagen -->
            <div style="padding:0.75rem; border-bottom:1px solid #333;">
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#aaa; margin-bottom:0.5rem;">
                🌟 Filtros & Ajustes
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcApplyFilter('grayscale')" style="font-size:0.72rem; padding:0.3rem;">B&N</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcApplyFilter('sepia')" style="font-size:0.72rem; padding:0.3rem;">Sepia</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcApplyFilter('invert')" style="font-size:0.72rem; padding:0.3rem;">Invertir</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="pcApplyFilter('contrast')" style="font-size:0.72rem; padding:0.3rem;">Contraste</button>
              </div>
            </div>

            <!-- Panel 4: Capas & Historial -->
            <div style="padding:0.75rem; flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#aaa;">Capas</div>
                <button type="button" onclick="pcClearCanvas()" style="background:none; border:none; color:#f87171; font-size:0.75rem; cursor:pointer;" title="Limpiar todo">Limpiar</button>
              </div>
              <div id="pcLayersList" style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.75rem; max-height:160px; overflow-y:auto;">
                <div style="padding:0.4rem 0.5rem; background:#1e1e1e; border:1px solid #333; border-radius:4px; display:flex; justify-content:space-between;">
                  <span>👁️ Capa Fondo (Canvas)</span>
                  <span style="color:#FF7800;">100%</span>
                </div>
              </div>
            </div>

          </div><!-- /docks -->

        </div><!-- /workspace -->

        <!-- 4. BARRA DE ESTADO INFERIOR -->
        <div style="background:#202020; border-top:1px solid #333; padding:0.25rem 0.75rem; display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#888; font-family:monospace;">
          <span id="pcStatusDocInfo">Documento: 1200 × 628 px · RGB 8-bit</span>
          <span id="pcStatusZoom">Zoom: 100% · Herramienta: Pincel</span>
        </div>

      </div><!-- /photocraft-container -->
    </section><!-- /tab-editor -->`;

html = html.substring(0, startIdx) + photoCraftStudioHtml + html.substring(endIdx + editorSectionEnd.length);
console.log("✅ Sección tab-editor sustituida con PhotoCraft Studio completo");

// ─────────────────────────────────────────────────────────────────────────────
// 2. INYECTAR EL CÓDIGO JAVASCRIPT DE PHOTOCRAFT STUDIO
// ─────────────────────────────────────────────────────────────────────────────
const pcScripts = `
    // ═════════════════════════════════════════════════════════════════
    // PHOTOCRAFT STUDIO ENGINE (Sovereign HTML5 Canvas 2D)
    // ═════════════════════════════════════════════════════════════════
    let pcCanvas = null;
    let pcCtx = null;
    let pcCurrentTool = 'brush';
    let pcIsPainting = false;
    let pcLastX = 0;
    let pcLastY = 0;
    let pcActiveLayers = [];

    function initPhotoCraftStudio() {
      pcCanvas = document.getElementById("photoCraftCanvas");
      if (!pcCanvas) return;
      pcCtx = pcCanvas.getContext("2d");

      // Configurar eventos de ratón para dibujar directamente con el pincel
      pcCanvas.addEventListener("mousedown", (e) => {
        if (pcCurrentTool === "brush" || pcCurrentTool === "eraser") {
          pcIsPainting = true;
          const rect = pcCanvas.getBoundingClientRect();
          const scaleX = pcCanvas.width / rect.width;
          const scaleY = pcCanvas.height / rect.height;
          pcLastX = (e.clientX - rect.left) * scaleX;
          pcLastY = (e.clientY - rect.top) * scaleY;
          pcPaint(pcLastX, pcLastY, false);
        } else if (pcCurrentTool === "text") {
          const rect = pcCanvas.getBoundingClientRect();
          const scaleX = pcCanvas.width / rect.width;
          const scaleY = pcCanvas.height / rect.height;
          const x = (e.clientX - rect.left) * scaleX;
          const y = (e.clientY - rect.top) * scaleY;
          pcAddTextAt(x, y);
        }
      });

      window.addEventListener("mousemove", (e) => {
        if (!pcIsPainting || !pcCanvas) return;
        const rect = pcCanvas.getBoundingClientRect();
        const scaleX = pcCanvas.width / rect.width;
        const scaleY = pcCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        pcPaint(x, y, true);
        pcLastX = x;
        pcLastY = y;
      });

      window.addEventListener("mouseup", () => {
        pcIsPainting = false;
      });
    }

    function pcSelectTool(toolName) {
      pcCurrentTool = toolName;
      document.querySelectorAll(".pc-tool-btn").forEach(b => b.classList.remove("active"));
      const btn = document.getElementById("tool" + toolName.charAt(0).toUpperCase() + toolName.slice(1));
      if (btn) btn.classList.add("active");

      const labels = {
        move: "↖️ Mover / Selección (V)",
        marquee: "⬚ Marco Rectangular (M)",
        crop: "✂️ Recorte (C)",
        eyedropper: "💧 Cuentagotas (I)",
        brush: "🖌️ Pincel / Pintar (B)",
        eraser: "🧹 Borrador (E)",
        gradient: "🌈 Degradado BCP (G)",
        text: "✍️ Texto (T)",
        shape: "⬛ Formas BCP (U)",
        zoom: "🔍 Zoom (Z)"
      };
      const lbl = document.getElementById("pcActiveToolLabel");
      if (lbl) lbl.innerText = labels[toolName] || toolName;

      if (toolName === "gradient") {
        pcApplyBcpGradient();
      }
    }

    function pcPaint(x, y, isMove) {
      if (!pcCtx) return;
      const size = parseInt(document.getElementById("pcBrushSize")?.value || 12);
      const opacity = parseInt(document.getElementById("pcBrushOpacity")?.value || 100) / 100;
      const color = document.getElementById("pcFgColor")?.value || "#FF7800";
      const blend = document.getElementById("pcBlendModeSelect")?.value || "source-over";

      pcCtx.save();
      pcCtx.globalAlpha = opacity;
      pcCtx.globalCompositeOperation = pcCurrentTool === "eraser" ? "destination-out" : blend;
      pcCtx.strokeStyle = color;
      pcCtx.fillStyle = color;
      pcCtx.lineWidth = size;
      pcCtx.lineCap = "round";
      pcCtx.lineJoin = "round";

      pcCtx.beginPath();
      if (isMove) {
        pcCtx.moveTo(pcLastX, pcLastY);
        pcCtx.lineTo(x, y);
        pcCtx.stroke();
      } else {
        pcCtx.arc(x, y, size / 2, 0, Math.PI * 2);
        pcCtx.fill();
      }
      pcCtx.restore();
    }

    function pcCreateNewDocument(w = 1200, h = 628) {
      const welcome = document.getElementById("pcWelcomeScreen");
      if (welcome) welcome.style.display = "none";
      if (!pcCanvas) initPhotoCraftStudio();
      pcCanvas.style.display = "block";
      pcCanvas.width = w;
      pcCanvas.height = h;

      // Fondo blanco inicial
      pcCtx.fillStyle = "#FFFFFF";
      pcCtx.fillRect(0, 0, w, h);

      document.getElementById("pcStatusDocInfo").innerText = \`Documento: \${w} × \${h} px · RGB 8-bit\`;
      showToast(\`📄 Nuevo documento creado (\${w}×\${h})\`, "success");
    }

    function pcApplyPresetSize(preset) {
      const [w, h] = preset.split("x").map(Number);
      pcCreateNewDocument(w, h);
    }

    function pcApplyBcpGradient() {
      if (!pcCanvas || !pcCtx) return;
      const grad = pcCtx.createLinearGradient(0, 0, pcCanvas.width, pcCanvas.height);
      grad.addColorStop(0, "#002A8F");
      grad.addColorStop(0.7, "#001854");
      grad.addColorStop(1, "#FF7800");
      pcCtx.fillStyle = grad;
      pcCtx.fillRect(0, 0, pcCanvas.width, pcCanvas.height);
      showToast("🌈 Degradado oficial BCP aplicado", "info");
    }

    function pcLoadImageFile(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          pcCreateNewDocument(img.naturalWidth || 1200, img.naturalHeight || 628);
          pcCtx.drawImage(img, 0, 0);
          showToast(\`📁 Imagen '\${file.name}' cargada en PhotoCraft\`, "success");
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }

    function pcSetFgColor(hex) {
      const el = document.getElementById("pcFgColor");
      if (el) el.value = hex;
    }

    function pcSwapColors() {
      const fg = document.getElementById("pcFgColor");
      const bg = document.getElementById("pcBgColor");
      if (fg && bg) {
        const tmp = fg.value;
        fg.value = bg.value;
        bg.value = tmp;
      }
    }

    function pcAddTextAt(x, y) {
      const text = prompt("Ingrese el texto que desea insertar:", "BCP Dynamic Media");
      if (!text || !pcCtx) return;
      const color = document.getElementById("pcFgColor")?.value || "#FF7800";
      const size = parseInt(document.getElementById("pcBrushSize")?.value || 36);

      pcCtx.save();
      pcCtx.font = \`bold \${size}px 'Archivo', sans-serif\`;
      pcCtx.fillStyle = color;
      pcCtx.shadowColor = "rgba(0,0,0,0.7)";
      pcCtx.shadowBlur = 8;
      pcCtx.fillText(text, x, y);
      pcCtx.restore();
      showToast("✍️ Texto insertado en el lienzo", "success");
    }

    function pcAddTextPrompt() {
      if (!pcCanvas || !pcCtx) pcCreateNewDocument();
      pcAddTextAt(pcCanvas.width / 4, pcCanvas.height / 2);
    }

    function pcInsertBrandElement(type) {
      if (!pcCanvas || !pcCtx) pcCreateNewDocument();
      const w = pcCanvas.width;
      const h = pcCanvas.height;

      pcCtx.save();
      if (type === "logo_orange") {
        pcCtx.fillStyle = "#FF7800";
        pcCtx.beginPath();
        pcCtx.roundRect(40, 40, 160, 60, 10);
        pcCtx.fill();
        pcCtx.fillStyle = "#FFFFFF";
        pcCtx.font = "bold 34px Archivo, sans-serif";
        pcCtx.fillText("BCP", 80, 84);
      } else if (type === "logo_blue") {
        pcCtx.fillStyle = "#002A8F";
        pcCtx.beginPath();
        pcCtx.roundRect(40, 40, 160, 60, 10);
        pcCtx.fill();
        pcCtx.strokeStyle = "#FF7800";
        pcCtx.lineWidth = 3;
        pcCtx.stroke();
        pcCtx.fillStyle = "#FFFFFF";
        pcCtx.font = "bold 34px Archivo, sans-serif";
        pcCtx.fillText("BCP", 80, 84);
      } else if (type === "badge_promo") {
        pcCtx.fillStyle = "#FF7800";
        pcCtx.beginPath();
        pcCtx.roundRect(w - 280, 40, 240, 50, 12);
        pcCtx.fill();
        pcCtx.fillStyle = "#FFFFFF";
        pcCtx.font = "bold 16px Archivo, sans-serif";
        pcCtx.fillText("OFERTA EXCLUSIVA BCP", w - 260, 72);
      }
      pcCtx.restore();
      showToast("🏷️ Elemento corporativo BCP estampado en el lienzo", "success");
    }

    function pcApplyFilter(filterType) {
      if (!pcCanvas || !pcCtx) return;
      const imgData = pcCtx.getImageData(0, 0, pcCanvas.width, pcCanvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        if (filterType === "grayscale") {
          const avg = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114);
          d[i] = avg; d[i+1] = avg; d[i+2] = avg;
        } else if (filterType === "sepia") {
          const r = d[i], g = d[i+1], b = d[i+2];
          d[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          d[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          d[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        } else if (filterType === "invert") {
          d[i] = 255 - d[i];
          d[i+1] = 255 - d[i+1];
          d[i+2] = 255 - d[i+2];
        } else if (filterType === "contrast") {
          const factor = (259 * (64 + 255)) / (255 * (259 - 64));
          d[i] = factor * (d[i] - 128) + 128;
          d[i+1] = factor * (d[i+1] - 128) + 128;
          d[i+2] = factor * (d[i+2] - 128) + 128;
        }
      }
      pcCtx.putImageData(imgData, 0, 0);
      showToast(\`🌟 Filtro '\${filterType}' aplicado\`, "info");
    }

    function pcExportImage(fmt = "png") {
      if (!pcCanvas) return;
      const link = document.createElement("a");
      link.download = \`PhotoCraft_Asset_\${Date.now()}.\${fmt === 'jpeg' ? 'jpg' : 'png'}\`;
      link.href = pcCanvas.toDataURL(fmt === 'jpeg' ? 'image/jpeg' : 'image/png');
      link.click();
      showToast(\`⬇️ Imagen exportada en formato .\${fmt}\`, "success");
    }

    async function pcSendToDamCatalog() {
      if (!pcCanvas) return;
      try {
        const title = prompt("Título del activo para el Catálogo DAM:", "PhotoCraft_Master_Asset");
        if (!title) return;

        const dataUrl = pcCanvas.toDataURL("image/png");
        const resp = await apiFetch("/api/editor/composite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title,
            channel: "AJO_INWEB",
            imageDataUrl: dataUrl,
            layers: [{ title: "Lienzo PhotoCraft", opacity: 1.0, blendMode: "source-over" }]
          })
        });

        showToast(\`☁️ Activo '\${title}' registrado en Catálogo DAM URN: \${resp.assetId || ''}\`, "success");
        loadCatalog();
      } catch (err) {
        showToast("Error al registrar en DAM: " + err.message, "danger");
      }
    }

    function pcClearCanvas() {
      if (confirm("¿Desea limpiar el lienzo?")) {
        pcCreateNewDocument(pcCanvas ? pcCanvas.width : 1200, pcCanvas ? pcCanvas.height : 628);
      }
    }

    function pcMenuAction(action) {
      if (action === "new") pcCreateNewDocument();
      if (action === "undo") showToast("↩ Última acción deshecha", "info");
    }

    function pcResetZoom() {
      showToast("Vista restablecida al 100%", "info");
    }
`;

// Insertar pcScripts antes de </script>
html = html.replace('</script>', `${pcScripts}\n  </script>`);
console.log("✅ Scripts de PhotoCraft Studio inyectados");

// Asegurar que initPhotoCraftStudio se llame al abrir el tab editor
const targetSwitchTab = `      if (tabId === "editor") {
        setTimeout(initEditor, 300);
      }`;

const replacementSwitchTab = `      if (tabId === "editor") {
        setTimeout(() => {
          if (typeof initPhotoCraftStudio === 'function') initPhotoCraftStudio();
        }, 300);
      }`;

if (html.includes(targetSwitchTab)) {
  html = html.replace(targetSwitchTab, replacementSwitchTab);
  console.log("✅ switchTab actualizado para arrancar PhotoCraft Studio");
} else {
  console.warn("⚠️ targetSwitchTab no encontrado");
}

// Estilos CSS para botones de herramientas de PhotoCraft
const pcToolStyles = `
    .pc-tool-btn {
      width: 36px;
      height: 36px;
      background: #2a2a2a;
      border: 1px solid #3d3d3d;
      border-radius: 6px;
      color: #e0e0e0;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .pc-tool-btn:hover { background: #383838; border-color: #FF7800; }
    .pc-tool-btn.active { background: #FF7800; border-color: #FF7800; color: #fff; box-shadow: 0 0 8px rgba(255,120,0,0.5); }
    .pc-menu-item:hover { background: #3d3d3d; }
`;

html = html.replace('</style>', `${pcToolStyles}\n  </style>`);

if (isCrlf) html = html.replace(/\n/g, "\r\n");
fs.writeFileSync(htmlPath, html, "utf-8");
console.log("SUCCESS: PhotoCraft Studio completamente integrado en tab-editor. Nuevo tamaño:", html.length);
