#!/usr/bin/env python3
"""
server.py - Servidor de desarrollo local para EscandalloPro.
Sirve la aplicación estática y proporciona la API /api/save para
abrir el diálogo nativo del sistema operativo (Zenity / GTK / Tkinter)
y guardar la nota Markdown directamente en cualquier carpeta o bóveda de Obsidian.
"""

import http.server
import json
import os
import shutil
import socketserver
import subprocess
import sys

DEFAULT_PORT = 8080
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))


class EscandalloHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def do_POST(self):
        if self.path == "/api/save":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
                filename = data.get("filename", "escandallo.md")
                content = data.get("content", "")

                chosen_path = None
                display_env = os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")

                # 1. Intentar selector nativo GTK de Linux con Zenity
                if shutil.which("zenity") and display_env:
                    cmd = [
                        "zenity",
                        "--file-selection",
                        "--save",
                        "--confirm-overwrite",
                        f"--filename={filename}",
                        "--title=Selecciona la carpeta de destino para la nota de Obsidian",
                        "--file-filter=Archivos Markdown (*.md) | *.md",
                        "--file-filter=Todos los archivos | *"
                    ]
                    res = subprocess.run(cmd, capture_output=True, text=True)
                    if res.returncode == 0:
                        chosen_path = res.stdout.strip()
                        if not chosen_path.endswith(".md"):
                            chosen_path += ".md"
                    else:
                        # Diálogo cancelado por el usuario
                        self.send_json_response({"cancelled": True})
                        return

                # 2. Respaldo mediante Tkinter filedialog si Zenity no estuviera disponible
                if not chosen_path and display_env:
                    try:
                        import tkinter as tk
                        from tkinter import filedialog
                        root = tk.Tk()
                        root.withdraw()
                        root.attributes("-topmost", True)
                        chosen_path = filedialog.asksaveasfilename(
                            initialfile=filename,
                            defaultextension=".md",
                            filetypes=[("Documento Markdown", "*.md"), ("Todos los archivos", "*.*")],
                            title="Selecciona la carpeta de destino para la nota de Obsidian"
                        )
                        root.destroy()
                        if not chosen_path:
                            self.send_json_response({"cancelled": True})
                            return
                    except Exception as e:
                        print(f"Aviso: Tkinter no disponible: {e}", file=sys.stderr)

                if chosen_path:
                    with open(chosen_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"✓ Nota guardada correctamente en: {chosen_path}")
                    self.send_json_response({"ok": True, "path": chosen_path})
                else:
                    self.send_json_response({
                        "error": "No hay servidor gráfico activo para mostrar el selector nativo.",
                        "fallback": True
                    }, status=400)
            except Exception as err:
                self.send_json_response({"error": str(err)}, status=500)
        else:
            self.send_error(404, "Ruta no encontrada")

    def send_json_response(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # Desactivar caché durante desarrollo
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def run():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), EscandalloHandler) as httpd:
        print(f"✓ Servidor EscandalloPro iniciado en http://localhost:{port}")
        print(f"  -> Abre http://localhost:{port} en tu navegador.")
        print("  -> Al pulsar 'Guardar', se abrirá el selector nativo de ficheros del sistema.")
        print("  (Presiona Ctrl+C para detener)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✓ Servidor detenido.")


if __name__ == "__main__":
    run()
