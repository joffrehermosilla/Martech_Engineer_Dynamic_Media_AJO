# Ejecutar desde la raíz Maven: martech-engineer-dynamic-media-ajo (donde está pom.xml)
#
#   .\fix-ui-content-dam-sample.ps1          -> VISTA PREVIA (no cambia nada)
#   .\fix-ui-content-dam-sample.ps1 -Apply   -> respalda y retira del source los assets de ejemplo del DAM
#
# Motivo: ui.content/filter.xml solo cubre jcr:content de /content/dam/<appId> y el asset 'asset.jpg'.
# Todo lo demás que haya en esa carpeta (p. ej. wknd_logo.png con sus renditions cq5dam.*) queda "fuera de
# todo filtro" y hace fallar la validación de filevault. Las renditions las genera AEM; no deben versionarse.

param([switch]$Apply, [switch]$Force)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = (Get-Location).Path
if (!(Test-Path (Join-Path $Root 'pom.xml'))) {
    throw 'No veo pom.xml en la carpeta actual. Ejecuta el script desde la raíz Maven martech-engineer-dynamic-media-ajo.'
}

$Dam = Join-Path $Root 'ui.content\src\main\content\jcr_root\content\dam\martechdynamicmediaajo'
if (!(Test-Path $Dam -PathType Container)) {
    throw "No existe la carpeta esperada: $Dam"
}

# Lo que el filter.xml actual SÍ cubre y por tanto se conserva.
$Keep = @('.content.xml', 'asset.jpg', 'asset.jpg.dir')

# Prefijo \\?\ para soportar rutas de más de 260 caracteres (OneDrive + renditions)
function Get-LongPath([string]$p) { if ($p.StartsWith('\\?\')) { $p } else { '\\?\' + $p } }

$Candidates = @(Get-ChildItem -LiteralPath (Get-LongPath $Dam) -Force | Where-Object { $Keep -notcontains $_.Name })

Write-Host "`n--- Contenido de la carpeta DAM de ui.content ---"
Get-ChildItem -LiteralPath (Get-LongPath $Dam) -Force | ForEach-Object {
    $mark = if ($Keep -contains $_.Name) { 'se conserva (cubierto por filter.xml)' } else { 'SE RETIRARÍA (sin filtro)' }
    '{0,-28} {1}' -f $_.Name, $mark
}

if ($Candidates.Count -eq 0) {
    Write-Host "`nNo hay nada fuera de los filtros en esa carpeta. El error viene de otro sitio; pega el primer [ERROR] completo." -ForegroundColor Yellow
    return
}

# Referencias a estos assets desde otros archivos fuente (para no romper páginas de ejemplo sin avisar)
Write-Host "`n--- Referencias a esos assets en el código fuente (fuera de la carpeta DAM) ---"
$SearchRoots = @('ui.apps\src', 'ui.content\src', 'ui.config\src', 'ui.frontend\src', 'core\src', 'dispatcher') |
    ForEach-Object { Join-Path $Root $_ } | Where-Object { Test-Path $_ }
$Hits = @()
foreach ($c in $Candidates) {
    $name = $c.Name -replace '\.dir$', ''
    $found = @(Get-ChildItem -Path $SearchRoots -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "$Dam*" -and $_.FullName -notmatch '\\(node_modules|target)\\' } |
        Select-String -SimpleMatch $name -ErrorAction SilentlyContinue |
        Select-Object @{n='Asset';e={$name}}, Path, LineNumber)
    $Hits += $found
}
if ($Hits.Count -eq 0) {
    Write-Host 'Ninguna referencia encontrada.'
} else {
    $Hits | Format-Table -AutoSize
    Write-Host 'Hay referencias. Si retiras el asset, esas páginas/componentes mostrarán el recurso roto (no rompe el build).' -ForegroundColor Yellow
}

if (-not $Apply) {
    Write-Host "`nVISTA PREVIA: no se cambió nada. Para aplicar: .\fix-ui-content-dam-sample.ps1 -Apply" -ForegroundColor Cyan
    return
}

if ($Hits.Count -gt 0 -and -not $Force) {
    throw 'Hay referencias a los assets. Revísalas y, si aun así quieres retirarlos, repite con -Apply -Force.'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = Join-Path $env:TEMP "Martech_ui_content_dam_backup_$stamp"
New-Item -ItemType Directory -Path $Backup -Force | Out-Null

# robocopy soporta rutas largas; códigos 0-7 = correcto
robocopy $Dam $Backup /E /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "El respaldo falló (robocopy $LASTEXITCODE). No se borró nada." }

foreach ($c in $Candidates) {
    Remove-Item -LiteralPath (Get-LongPath $c.FullName) -Recurse -Force
}

Write-Host "`nListo. Respaldo completo en: $Backup" -ForegroundColor Green
Write-Host "`n--- Queda en la carpeta DAM ---"
Get-ChildItem -LiteralPath (Get-LongPath $Dam) -Force | Select-Object -ExpandProperty Name
Write-Host "`nSiguiente paso: mvn clean install"
