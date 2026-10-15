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
├── justfile             # Tareas y comandos de construcción (just)
├── package.json         # Dependencias de desarrollo (Tailwind CSS CLI)
├── index.html           # Punto de entrada local para servidores web
└── generador_de_escandallos_pro_para_obsidian.html  # Archivo final autónomo (SPA)
```

## Guardado y Selector de Carpetas del Sistema

Por políticas de seguridad de los navegadores (W3C File System Access API), la
función `showSaveFilePicker()` que permite elegir la carpeta de destino en el
diálogo del sistema solo está permitida en orígenes seguros (`http://localhost`
o `https://`), y está bloqueada en URLs con protocolo `file:///`.

- **En localhost:** Al pulsar "Guardar .md en Carpeta...", el navegador abre el
  diálogo nativo del sistema para elegir la carpeta de destino (ej. tu bóveda de
  Obsidian).
- **En `file:///`:** El archivo se descarga automáticamente en tu carpeta de
  Descargas habitual mediante el mecanismo estándar, sin mostrar errores de
  permisos.

Para utilizar el selector de carpetas en desarrollo local:

```bash
just serve
```

Y abre en tu navegador: [http://localhost:8080](http://localhost:8080).

## Comandos disponibles (Just)

```bash
just              # Muestra las recetas disponibles
just build        # Compila el CSS y genera el archivo final autónomo
just check        # Valida la sintaxis de JavaScript (src/app.js)
just serve        # Inicia servidor local en http://localhost:8080 (permite elegir carpeta)
just install      # Instala dependencias npm (Tailwind CSS v4)
just watch        # Modo desarrollo: reconstruye al modificar archivos en src/
just clean        # Limpia archivos temporales de compilación (dist/)
```
