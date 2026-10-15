# EscandalloPro

Generador y gestor técnico de escandallos gastronómicos con exportación directa
y compatibilidad para Obsidian (YAML Frontmatter + Dataview + Callouts +
Wikilinks).

## Estructura del Proyecto

```text
.
├── src/
│   ├── index.html       # Plantilla HTML base
│   ├── styles.css       # Configuración Tailwind CSS v4 y estilos específicos
│   └── app.js           # Lógica JavaScript cliente (cálculos, estado, exportación)
├── build.py             # Script de construcción y ensamblado
├── server.py            # Servidor local con API para selector nativo de carpetas (Zenity)
├── justfile             # Tareas y comandos de construcción (just)
├── package.json         # Dependencias de desarrollo (Tailwind CSS CLI)
├── index.html           # Punto de entrada local para servidores web
└── generador_de_escandallos_pro_para_obsidian.html  # Archivo final autónomo (SPA)
```

## Guardado y Selector de Carpetas del Sistema

En los navegadores web modernos existen dos limitaciones al intentar forzar el
selector de carpetas desde el frontend:

1. En **`file:///`**, los navegadores bloquean el acceso al sistema de archivos
   por seguridad.
2. En navegadores como **Firefox** o en peticiones **HTTP** no seguras, la API
   experimental `showSaveFilePicker()` no está implementada o está
   deshabilitada.

Para garantizar que el selector de carpetas funcione siempre de forma nativa en
Linux:

- **Con `just serve`:** El servidor Python incluye el endpoint `/api/save` que
  invoca **Zenity** (el selector nativo GTK de GNOME/Linux). Al pulsar «Guardar
  en Carpeta...», se abre la ventana nativa del sistema para elegir la carpeta y
  guardar directamente en tu bóveda de Obsidian.
- **Sin servidor (`file:///`):** El archivo se descarga automáticamente en la
  carpeta de Descargas mediante el estándar del navegador, sin generar errores
  de permisos.

### Uso recomendado

```bash
just serve
```

Abre **[http://localhost:8080](http://localhost:8080)** en tu navegador. Al
pulsar **«Guardar en Carpeta...»**, se abrirá la ventana del explorador de
archivos del sistema.

## Comandos disponibles (Just)

```bash
just              # Muestra las recetas disponibles
just build        # Compila el CSS y genera el archivo final autónomo
just check        # Valida la sintaxis de JavaScript (src/app.js)
just serve        # Inicia servidor local en http://localhost:8080 con selector nativo
just install      # Instala dependencias npm (Tailwind CSS v4)
just watch        # Modo desarrollo: reconstruye al modificar archivos en src/
just clean        # Limpia archivos temporales de compilación (dist/)
```
