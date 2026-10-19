#!/usr/bin/env python3
"""
build.py - Compilador de EscandalloPro para producción
Ensambla src/index.html, src/styles.css (compilado con Tailwind v4) y src/app.js
en un único archivo autónomo: generador_de_escandallos_pro_para_obsidian.html
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
DIST_DIR = os.path.join(ROOT_DIR, "dist")
COMPILED_CSS = os.path.join(DIST_DIR, "styles.min.css")
OUTPUT_HTML = os.path.join(DIST_DIR, "generador_de_escandallos_pro_para_obsidian.html")
DIST_INDEX = os.path.join(DIST_DIR, "index.html")
NOJEKYLL_PATH = os.path.join(DIST_DIR, ".nojekyll")
SRC_PANTRY = os.path.join(SRC_DIR, "despensa.json")
DIST_PANTRY = os.path.join(DIST_DIR, "despensa.json")
DESPENSA_HTML_PATH = os.path.join(SRC_DIR, "despensa.html")
DESPENSA_JS_PATH = os.path.join(SRC_DIR, "despensa.js")
DIST_DESPENSA_HTML = os.path.join(DIST_DIR, "editor_despensa.html")


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


def read_pantry_raw():
    """Devuelve el JSON de la despensa validado como texto compacto para incrustarlo."""
    if not os.path.isfile(SRC_PANTRY):
        return "[]"
    with open(SRC_PANTRY, "r", encoding="utf-8") as f:
        raw = f.read()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as err:
        sys.exit(f"Error: src/despensa.json no es un JSON válido: {err}")
    if not isinstance(parsed, list):
        sys.exit("Error: src/despensa.json debe contener un array de insumos.")
    # Se escapa "<" para que ningún dato pueda cerrar la etiqueta <script> que lo incrusta.
    return json.dumps(parsed, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def assemble_html(css_content):
    """Inserta CSS y JS en la plantilla HTML y empaqueta en dist/ para GitHub Pages"""
    print("-> Ensamblando archivos para distribución en dist/...")
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

    # 2. Archivo autónomo con nombre descriptivo (dist/generador_de_escandallos_pro_para_obsidian.html)
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    # 3. Marcador .nojekyll para asegurar que GitHub Pages no altere ni ignore archivos
    with open(NOJEKYLL_PATH, "w", encoding="utf-8") as f:
        f.write("")

    # 4. Copia del archivo de despensa externa para ser servido desde el origen
    if os.path.isfile(SRC_PANTRY):
        shutil.copy2(SRC_PANTRY, DIST_PANTRY)

    size_kb = len(html.encode("utf-8")) / 1024
    print(f"✓ Construcción exitosa en dist/:")
    print(f"  - dist/index.html ({size_kb:.1f} KB)")
    print(f"  - dist/generador_de_escandallos_pro_para_obsidian.html ({size_kb:.1f} KB)")
    print(f"  - dist/despensa.json")
    print(f"  - dist/.nojekyll")


def assemble_pantry_editor(css_content):
    """Ensambla la SPA del editor de despensa.json en un único archivo HTML."""
    print("-> Ensamblando editor de despensa para dist/...")
    with open(DESPENSA_HTML_PATH, "r", encoding="utf-8") as f:
        html = f.read()
    with open(DESPENSA_JS_PATH, "r", encoding="utf-8") as f:
        js = f.read()

    if "/* __COMPILED_CSS__ */" not in html:
        sys.exit("Error: No se encontró el marcador /* __COMPILED_CSS__ */ en src/despensa.html")
    if "/* __PANTRY_SEED__ */" not in html:
        sys.exit("Error: No se encontró el marcador /* __PANTRY_SEED__ */ en src/despensa.html")
    if "/* __DESPENSA_JS__ */" not in html:
        sys.exit("Error: No se encontró el marcador /* __DESPENSA_JS__ */ en src/despensa.html")

    html = html.replace("/* __COMPILED_CSS__ */", css_content)
    html = html.replace("/* __PANTRY_SEED__ */ []", read_pantry_raw())
    html = html.replace("/* __DESPENSA_JS__ */", js)

    os.makedirs(DIST_DIR, exist_ok=True)
    with open(DIST_DESPENSA_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = len(html.encode("utf-8")) / 1024
    print(f"  - dist/editor_despensa.html ({size_kb:.1f} KB)")


def main():
    start = time.time()
    css_content = compile_css()
    assemble_html(css_content)
    assemble_pantry_editor(css_content)
    elapsed = time.time() - start
    print(f"✓ Proceso completado en {elapsed:.2f}s")


if __name__ == "__main__":
    main()
