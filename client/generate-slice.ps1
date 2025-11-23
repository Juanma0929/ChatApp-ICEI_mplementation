# Script para generar código JavaScript desde archivos .ice
# Ejecutar: .\generate-slice.ps1

$sliceDir = "slice"
$outputDir = "src/generated"

# Crear directorio de salida si no existe
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
    Write-Host "Directorio creado: $outputDir"
}

# Generar código JavaScript
Write-Host "Generando código JavaScript desde archivos .ice..."
slice2js --output-dir $outputDir "$sliceDir/chat.ice"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Código JavaScript generado exitosamente en $outputDir" -ForegroundColor Green
} else {
    Write-Host "Error al generar código JavaScript" -ForegroundColor Red
    exit 1
}
