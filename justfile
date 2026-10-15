set shell := ["bash", "-uc"]

# Muestra la lista de recetas disponibles
default:
    @just --list

# Instala las dependencias de desarrollo necesarias (Tailwind CSS v4)
install:
    npm install

# Compila el CSS y ensambla generador_de_escandallos_pro_para_obsidian.html
build:
    @python3 build.py

# Valida la sintaxis de JavaScript de src/app.js
check:
    @echo "Verificando sintaxis de src/app.js..."
    @node --check src/app.js
    @echo "✓ Sintaxis de JavaScript válida."

# Inicia un servidor web local con soporte para el selector nativo de carpetas del sistema
serve port="8080":
    @./server.py {{port}}

# Modo desarrollo: reconstruye automáticamente al modificar archivos en src/
watch:
    @echo "Observando cambios en src/ (pulsa Ctrl+C para detener)..."
    @npx --yes chokidar-cli "src/**/*" -c "just build"

# Limpia el directorio de distribución temporal
clean:
    rm -rf dist
    @echo "✓ Directorio dist/ limpiado."
