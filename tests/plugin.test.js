const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Integración como Plugin de Obsidian (EscandalloPro)', () => {
    const pluginDir = path.join(__dirname, '..', 'dist', 'escandallo-pro');
    const manifestPath = path.join(pluginDir, 'manifest.json');
    const mainJsPath = path.join(pluginDir, 'main.js');
    const stylesPath = path.join(pluginDir, 'styles.css');
    const pantryPath = path.join(pluginDir, 'despensa.json');
    const readmePath = path.join(pluginDir, 'README.md');

    it('genera todos los archivos obligatorios requeridos por Obsidian en dist/escandallo-pro/', () => {
        assert.ok(fs.existsSync(manifestPath), 'manifest.json debe existir');
        assert.ok(fs.existsSync(mainJsPath), 'main.js debe existir');
        assert.ok(fs.existsSync(stylesPath), 'styles.css debe existir');
        assert.ok(fs.existsSync(pantryPath), 'despensa.json de plantilla debe existir');
        assert.ok(fs.existsSync(readmePath), 'README.md debe existir');
    });

    it('el archivo manifest.json cumple con las especificaciones técnicas de Obsidian', () => {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        assert.equal(manifest.id, 'escandallo-pro');
        assert.equal(manifest.name, 'EscandalloPro');
        assert.ok(manifest.version, 'Debe incluir versión');
        assert.ok(manifest.minAppVersion, 'Debe especificar minAppVersion');
        assert.equal(typeof manifest.isDesktopOnly, 'boolean');
        assert.ok(manifest.description && manifest.description.length > 10);
    });

    it('styles.css contiene las clases de Tailwind y el contenedor encapsulado para Obsidian', () => {
        const css = fs.readFileSync(stylesPath, 'utf8');
        assert.ok(css.includes('.escandallo-pro-view-container'), 'Debe incluir clase de contenedor');
        assert.ok(css.includes('.escandallo-pro-app'), 'Debe incluir clase de app');
        assert.ok(css.length > 5000, 'Debe incluir el CSS compilado de Tailwind v4');
    });

    describe('Ciclo de vida y métodos del Plugin (Mocking Obsidian API)', () => {
        let EscandalloPlugin;
        let mockApp;
        let mockVaultFiles;
        let mockFileContents;
        let notices;
        let MockTFile;

        before(() => {
            // Mock de clases y APIs de Obsidian para pruebas unitarias sin Obsidian en ejecución
            class MockPlugin {
                constructor(app, manifest) {
                    this.app = app;
                    this.manifest = manifest;
                    this.commands = [];
                    this.views = {};
                    this.ribbonIcons = [];
                    this.settingTabs = [];
                }
                registerView(type, callback) {
                    this.views[type] = callback;
                }
                addRibbonIcon(icon, title, callback) {
                    this.ribbonIcons.push({ icon, title, callback });
                }
                addCommand(cmd) {
                    this.commands.push(cmd);
                }
                addSettingTab(tab) {
                    this.settingTabs.push(tab);
                }
                async loadData() {
                    return {};
                }
                async saveData(data) {
                    this.savedData = data;
                }
            }

            class MockItemView {
                constructor(leaf) {
                    this.leaf = leaf;
                    this.contentEl = {
                        empty() {},
                        addClass() {},
                        innerHTML: ''
                    };
                }
            }

            class MockFuzzySuggestModal {
                constructor(app) {
                    this.app = app;
                }
                setPlaceholder() {}
            }

            class MockPluginSettingTab {
                constructor(app, plugin) {
                    this.app = app;
                    this.plugin = plugin;
                }
            }

            class MockSetting {
                constructor(el) {
                    this.el = el;
                }
                setName() { return this; }
                setDesc() { return this; }
                addText(fn) {
                    fn({
                        setPlaceholder: () => this,
                        setValue: () => this,
                        onChange: () => this
                    });
                    return this;
                }
            }

            MockTFile = class {
                constructor(path) {
                    this.path = path;
                    this.basename = path.split('/').pop().replace(/\.md$/, '');
                    this.extension = 'md';
                }
            };

            notices = [];
            class MockNotice {
                constructor(message) {
                    notices.push(message);
                }
            }

            // Inyectar mock en el módulo require cache de node para 'obsidian'
            const Module = require('node:module');
            const originalRequire = Module.prototype.require;
            Module.prototype.require = function (id) {
                if (id === 'obsidian') {
                    return {
                        Plugin: MockPlugin,
                        ItemView: MockItemView,
                        FuzzySuggestModal: MockFuzzySuggestModal,
                        PluginSettingTab: MockPluginSettingTab,
                        Setting: MockSetting,
                        TFile: MockTFile,
                        Notice: MockNotice
                    };
                }
                return originalRequire.apply(this, arguments);
            };

            // Cargar el plugin compilado
            EscandalloPlugin = require(mainJsPath);
        });

        it('expone las funciones del núcleo a través de EscandalloPlugin.core', () => {
            assert.ok(EscandalloPlugin.core, 'Debe exponer core');
            assert.equal(typeof EscandalloPlugin.core.computeRecipeTotals, 'function');
            assert.equal(typeof EscandalloPlugin.core.generateObsidianMarkdown, 'function');
            assert.equal(typeof EscandalloPlugin.core.parseMarkdownEscandallo, 'function');
            assert.equal(typeof EscandalloPlugin.core.getDemoState, 'function');
            assert.equal(typeof EscandalloPlugin.core.slugifyFilename, 'function');
        });

        it('inicializa correctamente vistas, comandos y ribbon icon al ejecutar onload()', async () => {
            mockVaultFiles = {};
            mockFileContents = {};
            mockApp = {
                vault: {
                    getAbstractFileByPath: (p) => mockVaultFiles[p] || null,
                    create: async (p, content) => {
                        const file = new MockTFile(p);
                        mockVaultFiles[p] = file;
                        mockFileContents[p] = content;
                        return file;
                    },
                    modify: async (f, content) => {
                        mockFileContents[f.path] = content;
                    },
                    createFolder: async (p) => {
                        mockVaultFiles[p] = { isFolder: true };
                    },
                    read: async (f) => mockFileContents[f.path] || '',
                    getMarkdownFiles: () => Object.values(mockVaultFiles).filter(x => x instanceof MockTFile)
                },
                workspace: {
                    getLeavesOfType: () => [],
                    getLeaf: () => ({
                        setViewState: async () => {},
                        view: { controller: null }
                    }),
                    revealLeaf: () => {},
                    detachLeavesOfType: () => {},
                    getActiveFile: () => null
                }
            };

            const plugin = new EscandalloPlugin(mockApp, { id: 'escandallo-pro' });
            await plugin.onload();

            // Verificar registro de vista
            assert.ok(plugin.views['escandallo-pro-view'], 'La vista escandallo-pro-view debe registrarse');

            // Verificar ribbon icon
            assert.equal(plugin.ribbonIcons.length, 1);
            assert.equal(plugin.ribbonIcons[0].icon, 'utensils');

            // Verificar comandos de Obsidian
            const commandIds = plugin.commands.map(c => c.id);
            assert.ok(commandIds.includes('open-escandallo-view'), 'Debe registrar comando para abrir vista');
            assert.ok(commandIds.includes('import-active-note'), 'Debe registrar comando para importar nota activa');
            assert.ok(commandIds.includes('search-vault-escandallo'), 'Debe registrar comando para buscar en vault');

            // Verificar pestaña de configuración
            assert.equal(plugin.settingTabs.length, 1);
        });

        it('guarda correctamente una ficha técnica en el Vault con saveToVault()', async () => {
            const plugin = new EscandalloPlugin(mockApp, { id: 'escandallo-pro' });
            await plugin.onload();

            const demoState = EscandalloPlugin.core.getDemoState();
            const demoTotals = EscandalloPlugin.core.computeRecipeTotals(demoState);

            notices.length = 0;
            await plugin.saveToVault(demoState, demoTotals);

            const expectedPath = 'Escandallos/carrillera-iberica-glaseada-al-oporto-con-parmentier-trufado.md';
            assert.ok(mockVaultFiles[expectedPath], 'El archivo debe existir en el Vault mock');
            assert.match(mockFileContents[expectedPath], /title: "Carrillera Ibérica Glaseada al Oporto con Parmentier Trufado"/);
            assert.match(mockFileContents[expectedPath], /# 🍽️ Carrillera Ibérica/);
            assert.ok(notices.some(n => n.includes('guardado en')));
        });

        it('actualiza una ficha técnica existente sin duplicar archivos', async () => {
            const plugin = new EscandalloPlugin(mockApp, { id: 'escandallo-pro' });
            await plugin.onload();

            const demoState = EscandalloPlugin.core.getDemoState();
            const demoTotals = EscandalloPlugin.core.computeRecipeTotals(demoState);

            // Guardar segunda vez con una modificación
            const modifiedState = { ...demoState, realMenuPrice: 28.00 };
            const modifiedTotals = EscandalloPlugin.core.computeRecipeTotals(modifiedState);

            notices.length = 0;
            await plugin.saveToVault(modifiedState, modifiedTotals);

            const expectedPath = 'Escandallos/carrillera-iberica-glaseada-al-oporto-con-parmentier-trufado.md';
            assert.match(mockFileContents[expectedPath], /pvp_carta_real: 28\.00/);
            assert.ok(notices.some(n => n.includes('actualizado en')));
        });
    });
});
