const obsidian = require('obsidian');
const {
    Plugin,
    ItemView,
    Notice,
    FuzzySuggestModal,
    PluginSettingTab,
    Setting,
    TFile
} = obsidian;

const VIEW_TYPE_ESCANDALLO = 'escandallo-pro-view';

const DEFAULT_SETTINGS = {
    defaultFolder: 'Escandallos',
    pantryPath: 'despensa.json',
    defaultPortions: 4,
    defaultFoodCost: 30,
    defaultTaxRate: 10,
    currencySymbol: '€'
};

/* __APP_JS_CORE__ */

const PLUGIN_UI_HTML = /* __PLUGIN_HTML__ */ '';

/**
 * Vista principal en pestaña de Obsidian (ItemView)
 */
class EscandalloView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.controller = null;
    }

    getViewType() {
        return VIEW_TYPE_ESCANDALLO;
    }

    getDisplayText() {
        return 'EscandalloPro';
    }

    getIcon() {
        return 'utensils';
    }

    async onOpen() {
        const container = this.contentEl;
        container.empty();
        container.addClass('escandallo-pro-view-container');

        // Inyecta el layout HTML de EscandalloPro
        container.innerHTML = PLUGIN_UI_HTML;

        // Inicializa el controlador en modo Obsidian
        this.controller = initEscandalloApp(container, {
            mode: 'obsidian',
            onSaveToVault: async (state, totals) => {
                await this.plugin.saveToVault(state, totals);
            },
            onLoadFromVault: () => {
                this.plugin.openVaultFilePicker((content, filename) => {
                    if (this.controller) {
                        this.controller.loadFromMarkdown(content, filename);
                    }
                });
            },
            onLoadPantry: async () => {
                return await this.plugin.loadPantry();
            },
            onShowNotice: (msg, type) => {
                new Notice(msg);
            }
        });

        // Si hay una nota pendiente que cargar, cárgala
        if (this.plugin.pendingNoteContent) {
            const { content, filename } = this.plugin.pendingNoteContent;
            this.plugin.pendingNoteContent = null;
            if (this.controller) {
                this.controller.loadFromMarkdown(content, filename);
            }
        }
    }

    async onClose() {
        this.controller = null;
    }
}

/**
 * Modal de búsqueda difusa para seleccionar recetas y escandallos del Vault
 */
class EscandalloSearchModal extends FuzzySuggestModal {
    constructor(app, onChoose) {
        super(app);
        this.onChoose = onChoose;
        this.setPlaceholder('Buscar escandallo o receta en tu Vault...');
    }

    getItems() {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(file) {
        return file.path;
    }

    async onChooseItem(file, evt) {
        try {
            const content = await this.app.vault.read(file);
            this.onChoose(content, file.basename);
            new Notice(`Escandallo cargado desde "${file.path}"`);
        } catch (err) {
            console.error('Error al leer el archivo del Vault:', err);
            new Notice(`Error al leer el archivo: ${err.message}`);
        }
    }
}

/**
 * Pestaña de ajustes en Preferencias de Obsidian
 */
class EscandalloSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Configuración de EscandalloPro' });

        new Setting(containerEl)
            .setName('Carpeta de destino')
            .setDesc('Carpeta del Vault donde se guardarán los escandallos (se creará automáticamente si no existe).')
            .addText(text => text
                .setPlaceholder('Escandallos')
                .setValue(this.plugin.settings.defaultFolder)
                .onChange(async (value) => {
                    this.plugin.settings.defaultFolder = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Ruta de despensa externa en el Vault')
            .setDesc('Ruta relativa dentro del Vault a un archivo despensa.json (ej: despensa.json o Recetas/despensa.json).')
            .addText(text => text
                .setPlaceholder('despensa.json')
                .setValue(this.plugin.settings.pantryPath)
                .onChange(async (value) => {
                    this.plugin.settings.pantryPath = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Food Cost Objetivo (%) por defecto')
            .setDesc('Porcentaje estándar de coste de materia prima sugerido para nuevas fichas.')
            .addText(text => text
                .setPlaceholder('30')
                .setValue(String(this.plugin.settings.defaultFoodCost))
                .onChange(async (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.defaultFoodCost = num;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('IVA (%) por defecto')
            .setDesc('Tipo impositivo por defecto (ej. 10 para hostelería en España).')
            .addText(text => text
                .setPlaceholder('10')
                .setValue(String(this.plugin.settings.defaultTaxRate))
                .onChange(async (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num >= 0) {
                        this.plugin.settings.defaultTaxRate = num;
                        await this.plugin.saveSettings();
                    }
                }));
    }
}

/**
 * Plugin principal de Obsidian
 */
class EscandalloPlugin extends Plugin {
    async onload() {
        await this.loadSettings();
        this.pendingNoteContent = null;

        // 1. Registro de la vista personalizada
        this.registerView(
            VIEW_TYPE_ESCANDALLO,
            (leaf) => new EscandalloView(leaf, this)
        );

        // 2. Icono en la barra lateral izquierda (Ribbon)
        this.addRibbonIcon('utensils', 'Abrir EscandalloPro', () => {
            this.activateView();
        });

        // 3. Comandos en la paleta de Obsidian (Ctrl/Cmd + P)
        this.addCommand({
            id: 'open-escandallo-view',
            name: 'Abrir gestor de escandallos',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'import-active-note',
            name: 'Cargar escandallo de la nota activa',
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile && activeFile.extension === 'md') {
                    if (!checking) {
                        this.loadFromActiveNote(activeFile);
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: 'search-vault-escandallo',
            name: 'Buscar y cargar escandallo del Vault',
            callback: () => {
                this.openVaultFilePicker(async (content, filename) => {
                    const view = await this.activateView();
                    if (view && view.controller) {
                        view.controller.loadFromMarkdown(content, filename);
                    } else {
                        this.pendingNoteContent = { content, filename };
                    }
                });
            }
        });

        // 4. Pestaña de configuración
        this.addSettingTab(new EscandalloSettingTab(this.app, this));
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_ESCANDALLO);
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_ESCANDALLO)[0];

        if (!leaf) {
            // Abrir en una nueva pestaña central
            const newLeaf = workspace.getLeaf('tab');
            await newLeaf.setViewState({
                type: VIEW_TYPE_ESCANDALLO,
                active: true
            });
            leaf = newLeaf;
        }

        workspace.revealLeaf(leaf);
        return leaf.view;
    }

    async loadFromActiveNote(file) {
        try {
            const content = await this.app.vault.read(file);
            const view = await this.activateView();
            if (view && view.controller) {
                view.controller.loadFromMarkdown(content, file.basename);
                new Notice(`Escandallo cargado desde "${file.path}"`);
            } else {
                this.pendingNoteContent = { content, filename: file.basename };
            }
        } catch (err) {
            console.error('Error al cargar la nota activa:', err);
            new Notice(`Error al cargar la nota: ${err.message}`);
        }
    }

    openVaultFilePicker(onSelect) {
        new EscandalloSearchModal(this.app, onSelect).open();
    }

    async saveToVault(state, totals) {
        const md = generateObsidianMarkdown(totals, state);
        const filename = `${slugifyFilename(state.recipeName || 'escandallo')}.md`;
        const folder = (this.settings.defaultFolder || '').trim().replace(/^\/+|\/+$/g, '');
        const filePath = folder ? `${folder}/${filename}` : filename;

        try {
            // Asegurar existencia de carpeta destino
            if (folder && !this.app.vault.getAbstractFileByPath(folder)) {
                await this.app.vault.createFolder(folder);
            }

            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, md);
                new Notice(`✓ Escandallo actualizado en "${filePath}"`);
            } else {
                await this.app.vault.create(filePath, md);
                new Notice(`✓ Escandallo guardado en "${filePath}"`);
            }
        } catch (err) {
            console.error('Error al guardar escandallo en el Vault:', err);
            new Notice(`Error al guardar en Vault: ${err.message}`);
        }
    }

    async loadPantry() {
        const path = (this.settings.pantryPath || '').trim();
        if (path) {
            try {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (file instanceof TFile) {
                    const content = await this.app.vault.read(file);
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            } catch (err) {
                console.warn(`No se pudo leer despensa desde "${path}":`, err);
            }
        }
        return (typeof DEFAULT_PANTRY !== 'undefined' ? DEFAULT_PANTRY : []);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

EscandalloPlugin.core = {
    computeRecipeTotals,
    generateObsidianMarkdown,
    parseMarkdownEscandallo,
    applyParsedMarkdown,
    getDemoState,
    slugifyFilename,
    initEscandalloApp
};

module.exports = EscandalloPlugin;

