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

# Valida la sintaxis de JavaScript de src/app.js y del plugin de Obsidian
check:
    @echo "Verificando sintaxis de JavaScript..."
    @node --check src/app.js
    @node --check src/plugin/main.js
    @if [ -f "dist/escandallo-pro/main.js" ]; then node --check dist/escandallo-pro/main.js; fi
    @echo "✓ Sintaxis de JavaScript válida."

# Ejecuta la batería de tests unitarios y de integración
test:
    @echo "Ejecutando batería de tests..."
    @node --test

# Inicia un servidor web local sirviendo la carpeta dist/
serve port="8080":
    @if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then \
        echo "Carpeta dist/ no encontrada. Compilando primero..."; \
        just build; \
    fi
    @echo "Iniciando servidor local en http://localhost:{{port}} desde dist/..."
    @echo "Abre http://localhost:{{port}} en el navegador para usar la aplicación."
    @python3 -m http.server {{port}} --directory dist

# Modo desarrollo: reconstruye automáticamente al modificar archivos en src/
watch:
    @echo "Observando cambios en src/ (pulsa Ctrl+C para detener)..."
    @npx --yes chokidar-cli "src/**/*" -c "just build"

# Limpia el directorio de distribución temporal
clean:
    rm -rf dist
    @echo "✓ Directorio dist/ limpiado."
