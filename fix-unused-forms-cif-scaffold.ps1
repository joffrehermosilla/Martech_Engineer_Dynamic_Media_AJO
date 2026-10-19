# Run from the root Maven project folder: martech-engineer-dynamic-media-ajo
# This makes backups first, removes Forms-specific HTL references from the two page hook files,
# and moves the optional CIF Commerce logo sample out of the source tree.
# The moved component is preserved in a timestamped backup under %TEMP%.

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = (Get-Location).Path
if (!(Test-Path (Join-Path $ProjectRoot 'pom.xml'))) {
    throw 'No veo pom.xml en la carpeta actual. Ejecuta este script desde la raíz Maven martech-engineer-dynamic-media-ajo.'
}

$UiAppsRoot = Join-Path $ProjectRoot 'ui.apps\src\main\content\jcr_root\apps\martechdynamicmediaajo'
$HeaderPath = Join-Path $UiAppsRoot 'components\adaptiveForm\page\customheaderlibs.html'
$FooterPath = Join-Path $UiAppsRoot 'components\adaptiveForm\page\customfooterlibs.html'
$CommerceLogoPath = Join-Path $UiAppsRoot 'components\commerce\logo'

foreach ($p in @($HeaderPath, $FooterPath)) {
    if (!(Test-Path $p -PathType Leaf)) { throw "No se encontró el archivo esperado: $p" }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupRoot = Join-Path $env:TEMP "Martech_Forms_CIF_backup_$stamp"
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

$BackupHeader = Join-Path $BackupRoot 'customheaderlibs.html'
$BackupFooter = Join-Path $BackupRoot 'customfooterlibs.html'
Copy-Item $HeaderPath $BackupHeader
Copy-Item $FooterPath $BackupFooter

if (Test-Path $CommerceLogoPath -PathType Container) {
    $BackupCommerceLogo = Join-Path $BackupRoot 'commerce-logo'
    Copy-Item $CommerceLogoPath $BackupCommerceLogo -Recurse
    Remove-Item $CommerceLogoPath -Recurse -Force
}

$headerContent = @'
<!--/*
    Copyright 2017 Adobe Systems Incorporated
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/-->
<sly data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html">
    <sly data-sly-call="${clientlib.css @ categories='martechdynamicmediaajo.base'}"/>
</sly>
'@

$footerContent = @'
<!--/*
    Copyright 2017 Adobe Systems Incorporated
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/-->
<sly data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html">
    <sly data-sly-call="${clientlib.js @ categories='martechdynamicmediaajo.base', async=true}"/>
</sly>
<sly data-sly-use.page="com.adobe.cq.wcm.core.components.models.Page">
    <sly data-sly-test="${page.data && page.dataLayerClientlibIncluded}">
        <sly data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html">
            <sly data-sly-call="${clientlib.js @ categories='core.wcm.components.commons.v1.datalayer', async=true}"/>
        </sly>
    </sly>
</sly>
'@

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($HeaderPath, $headerContent, $Utf8NoBom)
[System.IO.File]::WriteAllText($FooterPath, $footerContent, $Utf8NoBom)

Write-Host "`nCambios aplicados. Copias originales en: $BackupRoot" -ForegroundColor Green
Write-Host 'Se retiraron las referencias de Adaptive Forms de customheaderlibs/customfooterlibs.'
if (Test-Path $CommerceLogoPath) {
    Write-Host 'Aviso: la carpeta del logo CIF sigue en source; revisa el error antes de continuar.' -ForegroundColor Yellow
} else {
    Write-Host 'Se movió del source el componente opcional commerce/logo; su copia está en el backup.'
}
Write-Host "`nSiguiente paso: mvn clean install"
