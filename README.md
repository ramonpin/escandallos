# EscandalloPro

Generador y gestor técnico de escandallos gastronómicos con exportación directa
y compatibilidad para Obsidian (YAML Frontmatter + Dataview + Callouts +
Wikilinks).

## Estructura del Proyecto

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml   # Despliegue automático a GitHub Pages desde dist/
├── src/
│   ├── index.html       # Plantilla HTML base
│   ├── styles.css       # Configuración Tailwind CSS v4 y estilos específicos
│   ├── app.js           # Lógica JavaScript cliente (cálculos, estado, exportación)
│   └── despensa.json    # Despensa externa editable (insumos frecuentes, mermas, precios)
├── dist/                # Directorio único de distribución (generado con `just build`)
│   ├── index.html       # Aplicación autónoma principal para GitHub Pages
│   ├── generador_de_escandallos_pro_para_obsidian.html # Archivo descargable
│   ├── despensa.json    # Despensa servida desde el origen para la app
│   ├── .nojekyll        # Desactiva procesamiento Jekyll en GitHub Pages
│   └── escandallo-pro/  # Plugin nativo para Obsidian listo para usar
│       ├── manifest.json # Metadatos del plugin de Obsidian
│       ├── main.js       # Lógica encapsulada y registro de vista ItemView
│       ├── styles.css    # Estilos Tailwind encapsulados
│       ├── despensa.json # Plantilla de despensa
│       └── README.md     # Instrucciones de instalación en el Vault
├── build.py             # Script de compilación y ensamblado (web + plugin)
├── justfile             # Tareas y comandos de automatización (just)
├── package.json         # Dependencias de desarrollo (Tailwind CSS CLI)
└── README.md            # Documentación del proyecto
```

## Plugin Nativo de Obsidian (`dist/escandallo-pro`)

Además de la versión web, `just build` compila automáticamente un plugin nativo
para Obsidian con integración directa en el Vault.

### Instalación en tu Vault

1. Copia la carpeta compilada `dist/escandallo-pro` a la carpeta de plugins de
   tu bóveda:
   ```bash
   cp -r dist/escandallo-pro /ruta/a/tu/vault/.obsidian/plugins/
   ```
2. En Obsidian, abre **Ajustes** > **Community plugins**.
3. Haz clic en **Recargar plugins** y activa **EscandalloPro**.

### Características en Obsidian

- **Pestaña integrada:** Icono de cubiertos en la barra izquierda (Ribbon) y
  vista en pestaña.
- **Acceso directo al Vault:** Botón «Guardar en Vault» que crea o actualiza las
  notas directamente en la carpeta configurada (por defecto `Escandallos/`) sin
  diálogos de descarga del navegador.
- **Comandos de la paleta (`Ctrl/Cmd + P`):**
  - `EscandalloPro: Abrir gestor de escandallos`: abre o enfoca la pestaña
    técnica.
  - `EscandalloPro: Cargar escandallo de la nota activa`: lee y parsea la nota
    Markdown abierta en el editor.
  - `EscandalloPro: Buscar y cargar escandallo del Vault`: buscador difuso
    (fuzzy) entre tus recetas.
- **Despensa en el Vault:** Si colocas un archivo `despensa.json` en tu Vault,
  la aplicación cargará tus ingredientes personalizados automáticamente.

## Despensa Externa (`despensa.json`)

La aplicación carga los insumos frecuentes dinámicamente desde `despensa.json`
en el mismo origen. No se almacena en `localStorage`, lo que te permite mantener
y versionar en Git tu catálogo de ingredientes, precios de compra y porcentajes
de merma habituales con categorías opcionales:

```json
[
  {
    "categoria": "Grasas y Aceites",
    "name": "Aceite de Oliva Virgen Extra",
    "unit": "L",
    "grossQty": 0.08,
    "wastePct": 0,
    "unitPrice": 9.20
  }
]
```

## Despliegue en GitHub Pages

El proyecto incluye un flujo de trabajo de GitHub Actions
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) que compila la
aplicación en cada _push_ a la rama `main` y sirve los archivos exclusivamente
desde la carpeta `dist/`.

### Configuración en GitHub:

1. Ve a tu repositorio en GitHub: **Settings** > **Pages**.
2. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
3. Al hacer push a `main`, el workflow compilará y publicará la aplicación
   automáticamente bajo HTTPS.

## Guardado y Selector de Carpetas del Sistema

Por políticas de seguridad de los navegadores (W3C File System Access API), la
función `showSaveFilePicker()` que permite elegir la carpeta de destino en el
diálogo del sistema solo está permitida en orígenes seguros (`http://localhost`
o `https://`), y está bloqueada en URLs con protocolo `file:///`.

- **En GitHub Pages (HTTPS) o localhost:** Al pulsar "Guardar .md en
  Carpeta...", el navegador abre el diálogo nativo del sistema para elegir la
  carpeta de destino (ej. tu bóveda de Obsidian).
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
just build        # Compila el CSS y genera los archivos en dist/
just check        # Valida la sintaxis de JavaScript (src/app.js)
just test         # Ejecuta la batería de tests unitarios y de integración
just serve        # Inicia servidor local en http://localhost:8080 desde dist/
just install      # Instala dependencias npm (Tailwind CSS v4)
just watch        # Modo desarrollo: reconstruye al modificar archivos en src/
just clean        # Limpia archivos temporales de compilación (dist/)
```
