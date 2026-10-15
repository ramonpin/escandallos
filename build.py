#!/usr/bin/env python3
"""
build.py - Compilador de EscandalloPro para producción y Plugin de Obsidian
Ensambla:
1. Aplicación web autónoma (dist/index.html y dist/generador_de_escandallos_pro_para_obsidian.html)
2. Plugin nativo para Obsidian (dist/escandallo-pro/{manifest.json, main.js, styles.css, despensa.json})
"""

import json
import os
import shutil
import subprocess
import sys
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(ROOT_DIR, "src")
INDEX_PATH = os.path.join(SRC_DIR, "index.html")
STYLES_PATH = os.path.join(SRC_DIR, "styles.css")
APP_JS_PATH = os.path.join(SRC_DIR, "app.js")
SRC_PANTRY = os.path.join(SRC_DIR, "despensa.json")

DIST_DIR = os.path.join(ROOT_DIR, "dist")
COMPILED_CSS = os.path.join(DIST_DIR, "styles.min.css")
OUTPUT_HTML = os.path.join(DIST_DIR, "generador_de_escandallos_pro_para_obsidian.html")
DIST_INDEX = os.path.join(DIST_DIR, "index.html")
NOJEKYLL_PATH = os.path.join(DIST_DIR, ".nojekyll")
DIST_PANTRY = os.path.join(DIST_DIR, "despensa.json")

# Obsidian Plugin paths
PLUGIN_SRC_DIR = os.path.join(SRC_DIR, "plugin")
PLUGIN_MANIFEST_SRC = os.path.join(PLUGIN_SRC_DIR, "manifest.json")
PLUGIN_MAIN_SRC = os.path.join(PLUGIN_SRC_DIR, "main.js")

DIST_PLUGIN_DIR = os.path.join(DIST_DIR, "escandallo-pro")
DIST_PLUGIN_MANIFEST = os.path.join(DIST_PLUGIN_DIR, "manifest.json")
DIST_PLUGIN_MAIN = os.path.join(DIST_PLUGIN_DIR, "main.js")
DIST_PLUGIN_STYLES = os.path.join(DIST_PLUGIN_DIR, "styles.css")
DIST_PLUGIN_PANTRY = os.path.join(DIST_PLUGIN_DIR, "despensa.json")
DIST_PLUGIN_README = os.path.join(DIST_PLUGIN_DIR, "README.md")


def get_tailwind_cmd():
    """Detecta el binario de Tailwind disponible (local o npx)"""
    local_bin = os.path.join(ROOT_DIR, "node_modules", ".bin", "tailwindcss")
    if os.path.isfile(local_bin) and os.access(local_bin, os.X_OK):
        return [local_bin]

    system_bin = shutil.which("tailwindcss")
    if system_bin:
        return [system_bin]

    npx_bin = shutil.which("npx")
    if npx_bin:
        return [npx_bin, "--yes", "@tailwindcss/cli"]

    sys.exit("Error: No se encontró tailwindcss ni npx en el sistema.")


def compile_css():
    """Compila y optimiza Tailwind CSS v4"""
    os.makedirs(DIST_DIR, exist_ok=True)
    cmd = get_tailwind_cmd() + [
        "-i", STYLES_PATH,
        "-o", COMPILED_CSS,
        "-m"
    ]
    print(f"-> Compilando Tailwind CSS con {' '.join(cmd[:3])}...")
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error en compilación de Tailwind CSS:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)

    with open(COMPILED_CSS, "r", encoding="utf-8") as f:
        return f.read().strip()


def assemble_html(css_content):
    """Inserta CSS y JS en la plantilla HTML y empaqueta en dist/ para GitHub Pages"""
    print("-> Ensamblando archivos web para distribución en dist/...")
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        html = f.read()

    with open(APP_JS_PATH, "r", encoding="utf-8") as f:
        js = f.read()

    # Inyección de estilos y scripts
    if "/* __COMPILED_CSS__ */" not in html:
        sys.exit("Error: No se encontró el marcador /* __COMPILED_CSS__ */ en src/index.html")
    if "/* __APP_JS__ */" not in html:
        sys.exit("Error: No se encontró el marcador /* __APP_JS__ */ en src/index.html")

    html = html.replace("/* __COMPILED_CSS__ */", css_content)
    html = html.replace("/* __APP_JS__ */", js)

    os.makedirs(DIST_DIR, exist_ok=True)

    # 1. Entrada principal para GitHub Pages (dist/index.html)
    with open(DIST_INDEX, "w", encoding="utf-8") as f:
        f.write(html)

    # 2. Archivo autónomo descargable (dist/generador_de_escandallos_pro_para_obsidian.html)
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    # 3. Marcador .nojekyll
    with open(NOJEKYLL_PATH, "w", encoding="utf-8") as f:
        f.write("")

    # 4. Despensa externa servida desde origen
    if os.path.isfile(SRC_PANTRY):
        shutil.copy2(SRC_PANTRY, DIST_PANTRY)

    size_kb = len(html.encode("utf-8")) / 1024
    print(f"✓ Construcción web en dist/:")
    print(f"  - dist/index.html ({size_kb:.1f} KB)")
    print(f"  - dist/generador_de_escandallos_pro_para_obsidian.html ({size_kb:.1f} KB)")
    print(f"  - dist/despensa.json")
    print(f"  - dist/.nojekyll")


def assemble_plugin(css_content):
    """Ensambla el plugin completo de Obsidian en dist/escandallo-pro/"""
    print("-> Ensamblando Plugin de Obsidian en dist/escandallo-pro/...")
    os.makedirs(DIST_PLUGIN_DIR, exist_ok=True)

    # 1. Copiar manifest.json
    if not os.path.isfile(PLUGIN_MANIFEST_SRC):
        sys.exit(f"Error: No se encontró {PLUGIN_MANIFEST_SRC}")
    shutil.copy2(PLUGIN_MANIFEST_SRC, DIST_PLUGIN_MANIFEST)

    # 2. Copiar despensa.json de plantilla
    if os.path.isfile(SRC_PANTRY):
        shutil.copy2(SRC_PANTRY, DIST_PLUGIN_PANTRY)
        with open(SRC_PANTRY, "r", encoding="utf-8") as f:
            default_pantry_data = json.load(f)
    else:
        default_pantry_data = []

    # 3. Extraer UI HTML desde src/index.html
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index_html = f.read()

    body_idx = index_html.find("<body")
    if body_idx == -1:
        sys.exit("Error: No se encontró <body en src/index.html")
    body_content_start = index_html.find(">", body_idx) + 1
    app_logic_idx = index_html.find("<!-- Application Logic -->")
    if app_logic_idx == -1:
        sys.exit("Error: No se encontró '<!-- Application Logic -->' en src/index.html")

    ui_inner = index_html[body_content_start:app_logic_idx].strip()
    wrapped_ui = (
        f'<div class="escandallo-pro-app flex flex-col min-h-full w-full bg-[#121214] text-[#e6e1e5] selection:bg-[#4f378b] selection:text-[#eaddff]">\n'
        f'{ui_inner}\n'
        f'</div>'
    )

    # 4. Leer código fuente JS del plugin y del núcleo
    with open(PLUGIN_MAIN_SRC, "r", encoding="utf-8") as f:
        plugin_template = f.read()

    with open(APP_JS_PATH, "r", encoding="utf-8") as f:
        app_js = f.read()

    # Prepend default pantry to core JS for offline fallback inside plugin
    pantry_injection = f"const DEFAULT_PANTRY = {json.dumps(default_pantry_data)};\n\n"
    full_core_js = (
        pantry_injection +
        "if (typeof window !== 'undefined') { window.__ESCANDALLO_OBSIDIAN_MODE__ = true; }\n" +
        app_js + "\n"
    )

    plugin_js = plugin_template.replace("/* __PLUGIN_HTML__ */ ''", json.dumps(wrapped_ui)).replace("/* __PLUGIN_HTML__ */", json.dumps(wrapped_ui))
    plugin_js = plugin_js.replace("/* __APP_JS_CORE__ */", full_core_js)

    with open(DIST_PLUGIN_MAIN, "w", encoding="utf-8") as f:
        f.write(plugin_js)

    # 5. Generar styles.css para Obsidian con contenedor encapsulado
    scoped_css_header = (
        "/* EscandalloPro - Obsidian Plugin Styles */\n"
        ".escandallo-pro-view-container {\n"
        "    height: 100%;\n"
        "    overflow-y: auto;\n"
        "    background-color: #121214;\n"
        "    color: #e6e1e5;\n"
        "    padding: 0;\n"
        "}\n"
        ".escandallo-pro-app {\n"
        "    min-height: 100%;\n"
        "}\n\n"
    )
    with open(DIST_PLUGIN_STYLES, "w", encoding="utf-8") as f:
        f.write(scoped_css_header + css_content)

    # 6. Generar README.md con instrucciones claras de instalación
    plugin_readme_content = """# EscandalloPro - Plugin para Obsidian

Gestor y calculador técnico de escandallos gastronómicos integrado directamente en Obsidian.

## Instalación en tu Vault

1. Copia la carpeta `escandallo-pro` dentro de la carpeta de plugins de tu Vault:
   ```bash
   cp -r dist/escandallo-pro /ruta/a/tu/vault/.obsidian/plugins/
   ```
2. Abre Obsidian.
3. Ve a **Ajustes** (`Ctrl+,`) > **Community Plugins** (Plugins de la comunidad).
4. Haz clic en **Recargar plugins** (icono de flecha circular).
5. Activa el interruptor de **EscandalloPro**.

## Uso

- **Icono en la barra Ribbon:** Haz clic en el icono de utensilios en la barra lateral izquierda para abrir la pestaña de EscandalloPro.
- **Paleta de comandos (`Ctrl/Cmd + P`):**
  - `EscandalloPro: Abrir gestor de escandallos`
  - `EscandalloPro: Cargar escandallo de la nota activa`
  - `EscandalloPro: Buscar y cargar escandallo del Vault`
- **Guardado directo:** Al pulsar "Guardar en Vault", la nota se creará o actualizará automáticamente en la carpeta configurada (por defecto `Escandallos/`).
- **Despensa propia:** Puedes colocar un archivo `despensa.json` en la raíz de tu Vault y el plugin cargará automáticamente tus ingredientes y precios personalizados.
"""
    with open(DIST_PLUGIN_README, "w", encoding="utf-8") as f:
        f.write(plugin_readme_content)

    # Formatear el markdown generado con deno fmt
    deno_bin = shutil.which("deno")
    if deno_bin:
        subprocess.run([deno_bin, "fmt", DIST_PLUGIN_README], capture_output=True, text=True)

    main_size_kb = len(plugin_js.encode("utf-8")) / 1024
    print(f"✓ Construcción Plugin Obsidian en dist/escandallo-pro/:")
    print(f"  - dist/escandallo-pro/manifest.json")
    print(f"  - dist/escandallo-pro/main.js ({main_size_kb:.1f} KB)")
    print(f"  - dist/escandallo-pro/styles.css")
    print(f"  - dist/escandallo-pro/despensa.json")
    print(f"  - dist/escandallo-pro/README.md")


def main():
    start = time.time()
    css_content = compile_css()
    assemble_html(css_content)
    assemble_plugin(css_content)
    elapsed = time.time() - start
    print(f"✓ Proceso completado en {elapsed:.2f}s")


if __name__ == "__main__":
    main()
