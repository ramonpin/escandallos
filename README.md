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
└── generador_de_escandallos_pro_para_obsidian.html  # Archivo final autónomo (SPA)
```

## Comandos disponibles (Just)

Ejecuta `just` para ver la lista de comandos disponibles:

```bash
just              # Muestra las recetas disponibles
just build        # Compila el CSS y genera el archivo final autónomo
just check        # Valida la sintaxis de JavaScript (src/app.js)
just install      # Instala dependencias npm (Tailwind CSS v4)
just watch        # Modo desarrollo: reconstruye al modificar archivos en src/
just clean        # Limpia archivos temporales de compilación (dist/)
```

## Requisitos

- `node` & `npm`
- `python3`
- `just`
