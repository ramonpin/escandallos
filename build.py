#!/usr/bin/env python3
"""
build.py - Compilador de EscandalloPro para producción
Ensambla src/index.html, src/styles.css (compilado con Tailwind v4) y src/app.js
en un único archivo autónomo: generador_de_escandallos_pro_para_obsidian.html
"""

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
OUTPUT_HTML = os.path.join(ROOT_DIR, "generador_de_escandallos_pro_para_obsidian.html")
DIST_DIR = os.path.join(ROOT_DIR, "dist")
COMPILED_CSS = os.path.join(DIST_DIR, "styles.min.css")


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
    """Inserta CSS y JS en la plantilla HTML"""
    print("-> Ensamblando archivo HTML autónomo...")
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

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)
    
    size_kb = len(html.encode("utf-8")) / 1024
    print(f"✓ Construcción exitosa: {os.path.basename(OUTPUT_HTML)} ({size_kb:.1f} KB)")


def main():
    start = time.time()
    css_content = compile_css()
    assemble_html(css_content)
    elapsed = time.time() - start
    print(f"✓ Proceso completado en {elapsed:.2f}s")


if __name__ == "__main__":
    main()
