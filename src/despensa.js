/**
 * DespensaPro - Editor SPA de despensa.json
 * Catálogo externo de insumos, mermas y precios de compra.
 */
const UNITS = ['kg', 'g', 'L', 'ml', 'ud', 'mjo'];

const UNIT_ALIASES = {
    kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
    g: 'g', gr: 'g', grs: 'g', gramo: 'g', gramos: 'g',
    l: 'L', litro: 'L', litros: 'L',
    ml: 'ml', mililitro: 'ml', mililitros: 'ml', cc: 'ml',
    ud: 'ud', uds: 'ud', unidad: 'ud', unidades: 'ud', pieza: 'ud', piezas: 'ud',
    mjo: 'mjo', manojo: 'mjo', manojos: 'mjo'
};

const SUGGESTED_CATEGORIES = [
    'Grasas y Aceites',
    'Verduras y Hortalizas',
    'Lácteos y Derivados',
    'Fondos y Caldos',
    'Huevos y Proteínas',
    'Condimentos y Especias',
    'Carnes y Aves',
    'Pescados y Mariscos',
    'Harinas y Cereales',
    'Salsas y Vinagres',
    'Bebidas',
    'Congelados'
];

const NUMERIC_FIELDS = { grossQty: 3, wastePct: 2, unitPrice: 2 };

let items = [];
let visibleEntries = [];
let dirty = false;
let currentFileHandle = null;
let source = 'embedded';
let sourceName = '';
let pendingConfirm = null;
let bannerDismissed = false;
let jsonPanelOpen = false;

/* ------------------------------------------------------------------ */
/* Utilidades generales                                                */
/* ------------------------------------------------------------------ */

function byId(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNumber(num, decimals = 2) {
    const val = typeof num === 'number' ? num : parseFloat(num);
    if (!Number.isFinite(val)) return (0).toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return val.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatCurrency(num, symbol = '€') {
    return `${formatNumber(num, 2)} ${symbol}`;
}

/**
 * Devuelve el valor visible de un campo numérico con el separador decimal español.
 * Los campos de texto (categoría, nombre) se devuelven sin transformar.
 */
function displayFieldValue(field, value) {
    const decimals = NUMERIC_FIELDS[field];
    return decimals !== undefined ? formatNumber(value, decimals) : String(value ?? '');
}

function roundTo(value, decimals) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

function parseLocaleFloat(val) {
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    if (val === null || val === undefined || val === '') return 0;
    let s = String(val).trim().replace(/[^0-9.,\-]/g, '');
    if (!s) return 0;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else if (hasComma) {
        s = s.replace(',', '.');
    }
    const num = parseFloat(s);
    return Number.isFinite(num) ? num : 0;
}

function foldText(str) {
    return String(str ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

const MINOR_TITLE_WORDS = new Set([
    // Artículos
    'el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas',
    // Conjunciones
    'y', 'e', 'o', 'u', 'ni', 'que', 'pero', 'sino', 'aunque', 'como',
    'cuando', 'donde', 'mientras', 'pues',
    // Preposiciones y contracciones habituales
    'a', 'al', 'de', 'del', 'en', 'con', 'sin', 'por', 'para',
    'sobre', 'entre', 'hacia', 'hasta', 'desde', 'bajo', 'contra',
    'durante', 'mediante', 'según'
]);

const TITLE_WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}'’.]*/gu;
const TITLE_ACRONYM_PATTERN = /^(?:\p{Lu}{1,}\.)+\p{Lu}{0,}\.?$/u;

function capitalizeTitleToken(token) {
    if (/\p{N}/u.test(token) || TITLE_ACRONYM_PATTERN.test(token)) return token;
    const lower = token.toLocaleLowerCase('es');
    return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
}

/**
 * Convierte un texto a formato título: cada palabra empieza en mayúscula
 * salvo artículos, conjunciones y preposiciones cortas, que quedan en minúscula
 * (siempre que no sean la primera palabra).
 */
function formatTitleCase(value) {
    const text = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (!text) return '';

    let position = 0;
    return text.replace(TITLE_WORD_PATTERN, token => {
        const isFirst = position === 0;
        position += 1;
        if (!isFirst && MINOR_TITLE_WORDS.has(foldText(token))) {
            return token.toLocaleLowerCase('es');
        }
        return capitalizeTitleToken(token);
    });
}

function normalizeUnit(unit) {
    const raw = String(unit ?? '').trim();
    if (!raw) return 'kg';
    const direct = UNIT_ALIASES[raw];
    if (direct) return direct;
    return UNIT_ALIASES[raw.toLowerCase()] || 'kg';
}

/* ------------------------------------------------------------------ */
/* Modelo y validación                                                 */
/* ------------------------------------------------------------------ */

function normalizeItem(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const hasGross = src.grossQty !== undefined && src.grossQty !== null && src.grossQty !== '';
    const hasWaste = src.wastePct !== undefined && src.wastePct !== null && src.wastePct !== '';
    const hasPrice = src.unitPrice !== undefined && src.unitPrice !== null && src.unitPrice !== '';

    return {
        categoria: formatTitleCase(src.categoria),
        name: formatTitleCase(src.name),
        unit: normalizeUnit(src.unit),
        grossQty: hasGross ? parseLocaleFloat(src.grossQty) : 0.1,
        wastePct: hasWaste ? parseLocaleFloat(src.wastePct) : 0,
        unitPrice: hasPrice ? parseLocaleFloat(src.unitPrice) : 0
    };
}

function toExportItem(item) {
    return {
        categoria: String(item.categoria ?? '').trim(),
        name: String(item.name ?? '').trim(),
        unit: normalizeUnit(item.unit),
        grossQty: roundTo(parseLocaleFloat(item.grossQty), 3),
        wastePct: roundTo(parseLocaleFloat(item.wastePct), 2),
        unitPrice: roundTo(parseLocaleFloat(item.unitPrice), 2)
    };
}

function serializeItems(list) {
    return JSON.stringify(list.map(toExportItem), null, 2);
}

function getItemErrors(item) {
    const errors = {};
    const categoria = String(item.categoria ?? '').trim();
    const name = String(item.name ?? '').trim();
    const gross = roundTo(parseLocaleFloat(item.grossQty), 3);
    const waste = roundTo(parseLocaleFloat(item.wastePct), 2);
    const price = parseLocaleFloat(item.unitPrice);

    if (!categoria) errors.categoria = 'La categoría es obligatoria.';
    if (!name) errors.name = 'El nombre del insumo es obligatorio.';
    if (!UNITS.includes(item.unit)) errors.unit = 'Unidad no válida.';
    if (!(Number.isFinite(gross) && gross > 0)) errors.grossQty = 'La cantidad bruta debe ser mayor que 0.';
    if (!(Number.isFinite(waste) && waste >= 0 && waste < 100)) errors.wastePct = 'La merma debe estar entre 0 y 99,99 %.';
    if (!(Number.isFinite(price) && price >= 0)) errors.unitPrice = 'El precio debe ser 0 o mayor.';

    return errors;
}

function countFieldErrors(list) {
    return list.reduce((total, item) => total + Object.keys(getItemErrors(item)).length, 0);
}

function countInvalidItems(list) {
    return list.reduce((total, item) => total + (Object.keys(getItemErrors(item)).length > 0 ? 1 : 0), 0);
}

function validateItems(list) {
    let count = 0;
    let first = null;

    list.forEach((item, index) => {
        const errors = getItemErrors(item);
        Object.keys(errors).forEach(field => {
            count += 1;
            if (!first) first = { index, field, message: errors[field] };
        });
    });

    return { valid: count === 0, count, first };
}

function buildValidatedJson(list) {
    const validation = validateItems(list);
    return {
        ...validation,
        content: validation.valid ? serializeItems(list) : null
    };
}

function computeStats(list) {
    const total = list.length;
    const categories = new Set(list.map(i => String(i.categoria ?? '').trim()).filter(Boolean));
    const wasteValues = list.map(i => Math.max(0, parseLocaleFloat(i.wastePct)));
    const priceValues = list.map(i => Math.max(0, parseLocaleFloat(i.unitPrice)));
    const avgWaste = total ? wasteValues.reduce((a, b) => a + b, 0) / total : 0;
    const avgPrice = total ? priceValues.reduce((a, b) => a + b, 0) / total : 0;
    const withWaste = wasteValues.filter(v => v > 0).length;
    const totalCost = list.reduce((sum, item) => {
        const gross = Math.max(0, parseLocaleFloat(item.grossQty));
        const price = Math.max(0, parseLocaleFloat(item.unitPrice));
        return sum + gross * price;
    }, 0);

    return { total, categories: categories.size, avgWaste, avgPrice, withWaste, totalCost };
}

/* ------------------------------------------------------------------ */
/* Estado de la vista                                                  */
/* ------------------------------------------------------------------ */

function getCategories() {
    const set = new Set(items.map(i => String(i.categoria ?? '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function getSuggestedCategories() {
    const set = new Set([...SUGGESTED_CATEGORIES, ...getCategories()]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function canReorderItems() {
    const search = byId('searchInput')?.value.trim() || '';
    const category = byId('categoryFilter')?.value || '';
    const sort = byId('sortSelect')?.value || 'custom';
    return !search && !category && sort === 'custom';
}

function getVisibleEntries() {
    const search = foldText(byId('searchInput')?.value || '');
    const category = byId('categoryFilter')?.value || '';
    const sort = byId('sortSelect')?.value || 'custom';

    let entries = items.map((item, index) => ({ item, index }));

    if (search) {
        entries = entries.filter(({ item }) => {
            return foldText(item.name).includes(search) || foldText(item.categoria).includes(search);
        });
    }

    if (category) {
        entries = entries.filter(({ item }) => String(item.categoria ?? '').trim() === category);
    }

    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    if (sort === 'category') {
        entries.sort((a, b) => collator.compare(a.item.categoria, b.item.categoria) || collator.compare(a.item.name, b.item.name));
    } else if (sort === 'name') {
        entries.sort((a, b) => collator.compare(a.item.name, b.item.name));
    } else if (sort === 'price-desc') {
        entries.sort((a, b) => parseLocaleFloat(b.item.unitPrice) - parseLocaleFloat(a.item.unitPrice));
    } else if (sort === 'waste-desc') {
        entries.sort((a, b) => parseLocaleFloat(b.item.wastePct) - parseLocaleFloat(a.item.wastePct));
    } else if (sort === 'gross-desc') {
        entries.sort((a, b) => parseLocaleFloat(b.item.grossQty) - parseLocaleFloat(a.item.grossQty));
    }

    return entries;
}

function refreshCategoryFilterOptions() {
    const select = byId('categoryFilter');
    if (!select) return;
    const current = select.value;
    const categories = getCategories();
    select.innerHTML = '<option value="">Todas las categorías</option>' + categories
        .map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
        .join('');
    select.value = categories.includes(current) ? current : '';
}

function refreshCategoryDatalist() {
    const datalist = byId('categoryOptions');
    if (!datalist) return;
    datalist.innerHTML = getSuggestedCategories()
        .map(cat => `<option value="${escapeHtml(cat)}"></option>`)
        .join('');
}

function unitOptions(selected) {
    return UNITS.map(unit => `<option value="${unit}"${unit === selected ? ' selected' : ''}>${unit}</option>`).join('');
}

function fieldBorderClass(invalid) {
    return invalid ? 'border-rose-500/70 ring-1 ring-rose-500/20' : 'border-[#3e3c46]';
}

function inputClasses(extra, invalid) {
    return `w-full bg-[#141218] border rounded-lg text-[#e6e1e5] placeholder:text-[#79747e] focus:outline-none focus:border-amber-400 transition ${fieldBorderClass(invalid)} ${extra}`;
}

function actionButtons(index, position, total, reorderEnabled) {
    const upDisabled = !reorderEnabled || position === 0;
    const downDisabled = !reorderEnabled || position === total - 1;
    const disabled = 'disabled:opacity-30 disabled:cursor-not-allowed';
    return `
        <button type="button" data-action="up" ${upDisabled ? 'disabled' : ''} class="p-1.5 rounded-lg text-[#938f99] hover:text-[#e6e1e5] hover:bg-[#36343b] transition ${disabled}" title="Mover arriba" aria-label="Mover arriba">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        </button>
        <button type="button" data-action="down" ${downDisabled ? 'disabled' : ''} class="p-1.5 rounded-lg text-[#938f99] hover:text-[#e6e1e5] hover:bg-[#36343b] transition ${disabled}" title="Mover abajo" aria-label="Mover abajo">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <button type="button" data-action="duplicate" class="p-1.5 rounded-lg text-[#938f99] hover:text-[#d0bcff] hover:bg-[#4f378b]/30 transition" title="Duplicar insumo" aria-label="Duplicar insumo">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2M6 9h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"/></svg>
        </button>
        <button type="button" data-action="delete" class="p-1.5 rounded-lg text-[#938f99] hover:text-rose-300 hover:bg-rose-950/50 transition" title="Eliminar insumo" aria-label="Eliminar insumo">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>`;
}

function itemCost(item) {
    return Math.max(0, parseLocaleFloat(item.grossQty)) * Math.max(0, parseLocaleFloat(item.unitPrice));
}

function renderTableRow(entry, position, total, reorderEnabled) {
    const { item, index } = entry;
    const errors = getItemErrors(item);
    const cost = itemCost(item);

    return `
        <tr data-index="${index}" class="hover:bg-[#24222a]/60 transition">
            <td class="py-2.5 pl-4 pr-2 text-center text-[#938f99] font-mono text-xs">${position + 1}</td>
            <td class="py-2.5 px-2">
                <input type="text" list="categoryOptions" data-field="categoria" value="${escapeHtml(item.categoria)}" placeholder="Categoría" class="${inputClasses('px-2.5 py-2 text-xs', Boolean(errors.categoria))}" aria-label="Categoría del insumo ${position + 1}">
            </td>
            <td class="py-2.5 px-2">
                <input type="text" data-field="name" value="${escapeHtml(item.name)}" placeholder="Nombre del insumo" class="${inputClasses('px-2.5 py-2 text-sm font-medium', Boolean(errors.name))}" aria-label="Nombre del insumo ${position + 1}">
            </td>
            <td class="py-2.5 px-2">
                <select data-field="unit" class="${inputClasses('px-2 py-2 text-xs text-center font-mono font-semibold', Boolean(errors.unit))}" aria-label="Unidad del insumo ${position + 1}">
                    ${unitOptions(item.unit)}
                </select>
            </td>
            <td class="py-2.5 px-2">
                <input type="text" inputmode="decimal" data-field="grossQty" value="${escapeHtml(displayFieldValue('grossQty', item.grossQty))}" class="${inputClasses('px-2.5 py-2 text-xs text-right font-mono', Boolean(errors.grossQty))}" aria-label="Cantidad bruta del insumo ${position + 1}">
            </td>
            <td class="py-2.5 px-2">
                <input type="text" inputmode="decimal" data-field="wastePct" value="${escapeHtml(displayFieldValue('wastePct', item.wastePct))}" class="${inputClasses('px-2.5 py-2 text-xs text-right font-mono', Boolean(errors.wastePct))}" aria-label="Merma del insumo ${position + 1}">
            </td>
            <td class="py-2.5 px-2">
                <input type="text" inputmode="decimal" data-field="unitPrice" value="${escapeHtml(displayFieldValue('unitPrice', item.unitPrice))}" class="${inputClasses('px-2.5 py-2 text-xs text-right font-mono', Boolean(errors.unitPrice))}" aria-label="Precio por unidad del insumo ${position + 1}">
            </td>
            <td class="py-2.5 px-3 text-right">
                <span data-cost class="font-mono text-xs font-semibold text-amber-300">${formatCurrency(cost)}</span>
            </td>
            <td class="py-2.5 pl-1 pr-3">
                <div class="flex items-center justify-center gap-0.5">${actionButtons(index, position, total, reorderEnabled)}</div>
            </td>
        </tr>`;
}

function renderMobileCard(entry, position, total, reorderEnabled) {
    const { item, index } = entry;
    const errors = getItemErrors(item);
    const cost = itemCost(item);

    return `
        <article data-index="${index}" class="p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-mono uppercase tracking-wider text-[#938f99]">Insumo ${position + 1}</span>
                <div class="flex items-center gap-0.5">${actionButtons(index, position, total, reorderEnabled)}</div>
            </div>
            <div class="grid grid-cols-1 gap-2.5">
                <div>
                    <label class="block text-[10px] font-bold text-[#938f99] uppercase tracking-wider mb-1">Categoría</label>
                    <input type="text" list="categoryOptions" data-field="categoria" value="${escapeHtml(item.categoria)}" placeholder="Categoría" class="${inputClasses('px-3 py-2.5 text-sm', Boolean(errors.categoria))}">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-[#938f99] uppercase tracking-wider mb-1">Insumo / Producto</label>
                    <input type="text" data-field="name" value="${escapeHtml(item.name)}" placeholder="Nombre del insumo" class="${inputClasses('px-3 py-2.5 text-sm font-semibold', Boolean(errors.name))}">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
                <div>
                    <label class="block text-[10px] font-bold text-[#938f99] uppercase tracking-wider mb-1">Unidad</label>
                    <select data-field="unit" class="${inputClasses('px-3 py-2.5 text-sm text-center font-mono font-semibold', Boolean(errors.unit))}">
                        ${unitOptions(item.unit)}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-[#938f99] uppercase tracking-wider mb-1">Cant. Bruta</label>
                    <input type="text" inputmode="decimal" data-field="grossQty" value="${escapeHtml(displayFieldValue('grossQty', item.grossQty))}" class="${inputClasses('px-3 py-2.5 text-sm text-right font-mono', Boolean(errors.grossQty))}">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-[#938f99] uppercase tracking-wider mb-1">Merma %</label>
                    <input type="text" inputmode="decimal" data-field="wastePct" value="${escapeHtml(displayFieldValue('wastePct', item.wastePct))}" class="${inputClasses('px-3 py-2.5 text-sm text-right font-mono', Boolean(errors.wastePct))}">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-[#938f99] uppercase tracking-wider mb-1">Precio / Ud</label>
                    <input type="text" inputmode="decimal" data-field="unitPrice" value="${escapeHtml(displayFieldValue('unitPrice', item.unitPrice))}" class="${inputClasses('px-3 py-2.5 text-sm text-right font-mono', Boolean(errors.unitPrice))}">
                </div>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-[#2d2b35]">
                <span class="text-[10px] font-bold text-[#938f99] uppercase tracking-wider">Coste de referencia</span>
                <span data-cost class="font-mono text-sm font-bold text-amber-300">${formatCurrency(cost)}</span>
            </div>
        </article>`;
}

function emptyTableRow() {
    return `
        <tr>
            <td colspan="9" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center gap-3 text-[#938f99]">
                    <svg class="w-10 h-10 text-[#49454f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                    <p class="text-sm font-medium text-[#cac4d0]">No hay insumos que coincidan</p>
                    <p class="text-xs">Ajusta la búsqueda o los filtros, o crea un insumo nuevo.</p>
                    <button type="button" data-action="add" class="mt-1 bg-amber-500 hover:bg-amber-400 text-[#2a1700] text-xs font-bold px-4 py-2.5 rounded-xl transition">Nuevo insumo</button>
                </div>
            </td>
        </tr>`;
}

function emptyMobileCard() {
    return `
        <div class="px-6 py-12 text-center">
            <div class="flex flex-col items-center gap-3 text-[#938f99]">
                <svg class="w-10 h-10 text-[#49454f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <p class="text-sm font-medium text-[#cac4d0]">No hay insumos que coincidan</p>
                <p class="text-xs">Ajusta la búsqueda o los filtros, o crea un insumo nuevo.</p>
                <button type="button" data-action="add" class="mt-1 bg-amber-500 hover:bg-amber-400 text-[#2a1700] text-xs font-bold px-4 py-2.5 rounded-xl transition">Nuevo insumo</button>
            </div>
        </div>`;
}

function renderGrid() {
    visibleEntries = getVisibleEntries();
    const reorderEnabled = canReorderItems();
    const tableBody = byId('pantryTableBody');
    const mobileList = byId('pantryMobileList');

    if (tableBody) {
        tableBody.innerHTML = visibleEntries.length
            ? visibleEntries.map((entry, position) => renderTableRow(entry, position, visibleEntries.length, reorderEnabled)).join('')
            : emptyTableRow();
    }

    if (mobileList) {
        mobileList.innerHTML = visibleEntries.length
            ? visibleEntries.map((entry, position) => renderMobileCard(entry, position, visibleEntries.length, reorderEnabled)).join('')
            : emptyMobileCard();
    }
}

function updateDerived() {
    const stats = computeStats(items);
    const validation = validateItems(items);
    const json = serializeItems(items);
    const search = byId('searchInput')?.value.trim() || '';
    const category = byId('categoryFilter')?.value || '';
    const sort = byId('sortSelect')?.value || 'custom';

    byId('kpiTotalItems').textContent = String(stats.total);
    byId('kpiCategories').textContent = String(stats.categories);
    byId('kpiAvgWaste').textContent = `${formatNumber(stats.avgWaste, 1)}%`;
    byId('kpiWasteHint').textContent = `${stats.withWaste} insumo${stats.withWaste === 1 ? '' : 's'} con merma`;
    byId('kpiAvgPrice').textContent = formatCurrency(stats.avgPrice);

    byId('footerVisibleCount').textContent = `${visibleEntries.length} / ${items.length}`;
    byId('footerTotalCost').textContent = formatCurrency(stats.totalCost);

    const errorEl = byId('footerErrorCount');
    errorEl.textContent = validation.count === 0
        ? '0 errores'
        : `${validation.count} error${validation.count === 1 ? '' : 'es'}`;
    errorEl.classList.toggle('text-emerald-400', validation.count === 0);
    errorEl.classList.toggle('bg-emerald-950/50', validation.count === 0);
    errorEl.classList.toggle('border-emerald-700/30', validation.count === 0);
    errorEl.classList.toggle('text-rose-300', validation.count > 0);
    errorEl.classList.toggle('bg-rose-950/50', validation.count > 0);
    errorEl.classList.toggle('border-rose-700/30', validation.count > 0);

    const dirtyBadge = byId('dirtyBadge');
    dirtyBadge.textContent = dirty ? 'Sin guardar' : 'Sin cambios';
    dirtyBadge.classList.toggle('bg-emerald-950/60', !dirty);
    dirtyBadge.classList.toggle('text-emerald-300', !dirty);
    dirtyBadge.classList.toggle('border-emerald-700/40', !dirty);
    dirtyBadge.classList.toggle('bg-amber-950/60', dirty);
    dirtyBadge.classList.toggle('text-amber-300', dirty);
    dirtyBadge.classList.toggle('border-amber-700/40', dirty);

    byId('btnDiscardChanges').classList.toggle('hidden', !dirty);
    byId('btnClearFilters').classList.toggle('hidden', !(search || category || sort !== 'custom'));

    byId('jsonPreview').textContent = json;
    const bytes = new Blob([json]).size;
    byId('jsonMeta').textContent = `${items.length} insumo${items.length === 1 ? '' : 's'} · ${(bytes / 1024).toFixed(1)} KB`;

    updateSourceBadge();
    updateSourceBanner();
}

function updateSourceBadge() {
    const badge = byId('sourceBadge');
    if (!badge) return;
    let label = 'Incluido';
    let title = 'Datos incluidos en el HTML al compilar.';
    if (source === 'server') {
        label = 'Servidor';
        title = 'Cargado desde ./despensa.json.';
    } else if (source === 'file') {
        label = 'Archivo';
        title = sourceName ? `Cargado desde ${sourceName}.` : 'Cargado desde un archivo local.';
    }
    badge.textContent = label;
    badge.title = title;
}

function updateSourceBanner() {
    const banner = byId('sourceBanner');
    if (!banner) return;
    if (bannerDismissed || source !== 'embedded') {
        banner.classList.add('hidden');
        return;
    }
    banner.classList.remove('hidden');
    const text = typeof window !== 'undefined' && window.location.protocol === 'file:'
        ? 'Estás abriendo la aplicación directamente desde un archivo. Se han cargado los datos incluidos en el HTML; usa «Abrir JSON» para editar tu despensa y «Guardar JSON» para descargarla.'
        : 'No se pudo leer ./despensa.json desde el servidor. Se han cargado los datos incluidos en el HTML; puedes editarlos y guardarlos con «Guardar JSON» o «Abrir JSON».';
    byId('sourceBannerText').textContent = text;
}

function setFieldValidity(el, invalid, message) {
    if (!el) return;
    el.classList.toggle('border-rose-500/70', invalid);
    el.classList.toggle('ring-1', invalid);
    el.classList.toggle('ring-rose-500/20', invalid);
    el.classList.toggle('border-[#3e3c46]', !invalid);
    el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    if (invalid && message) el.title = message;
    else el.removeAttribute('title');
}

function refreshRowValidity(index) {
    const item = items[index];
    if (!item) return;
    const errors = getItemErrors(item);
    document.querySelectorAll(`[data-index="${index}"]`).forEach(row => {
        row.querySelectorAll('[data-field]').forEach(el => {
            const field = el.dataset.field;
            setFieldValidity(el, Boolean(errors[field]), errors[field]);
        });
    });
}

function refreshRowCost(index) {
    const item = items[index];
    if (!item) return;
    const cost = formatCurrency(itemCost(item));
    document.querySelectorAll(`[data-index="${index}"] [data-cost]`).forEach(el => {
        el.textContent = cost;
    });
}

/* ------------------------------------------------------------------ */
/* Notificaciones y confirmaciones                                     */
/* ------------------------------------------------------------------ */

function showToast(message, type = 'success') {
    const container = byId('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success'
        ? 'bg-[#2b2930] text-[#f3eff4] border-[#d0bcff]'
        : 'bg-[#382210] text-amber-100 border-amber-400';

    toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border-l-4 text-xs sm:text-sm font-medium transition-all duration-300 ${bgClass}`;
    toast.innerHTML = `
        <span class="text-base">${type === 'success' ? '✨' : '⚠️'}</span>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 300);
    }, 3400);
}

function askConfirm({ title, message, confirmLabel = 'Continuar', danger = false }, callback) {
    const modal = byId('confirmModal');
    if (!modal) {
        callback();
        return;
    }
    pendingConfirm = callback;
    byId('confirmTitle').textContent = title;
    byId('confirmMessage').textContent = message;
    const icon = byId('confirmIcon');
    icon.className = danger
        ? 'w-10 h-10 rounded-xl bg-rose-950/70 text-rose-400 flex items-center justify-center shrink-0 border border-rose-800/40'
        : 'w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/40';
    const ok = byId('btnConfirmOk');
    ok.textContent = confirmLabel;
    ok.className = danger
        ? 'px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition'
        : 'px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-[#2a1700] shadow-sm transition';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => ok.focus(), 0);
}

function closeConfirm() {
    const modal = byId('confirmModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    pendingConfirm = null;
}

function confirmReload() {
    const doReload = () => reloadFromSource();
    if (!dirty) {
        doReload();
        return;
    }
    askConfirm({
        title: '¿Descartar los cambios?',
        message: 'Se recargará despensa.json desde el origen y se perderán los cambios que no hayas guardado.',
        confirmLabel: 'Sí, recargar',
        danger: true
    }, doReload);
}

/* ------------------------------------------------------------------ */
/* Carga de datos                                                      */
/* ------------------------------------------------------------------ */

async function loadInitialData(showReloadToast = false) {
    let data = null;
    let fromServer = false;

    try {
        const response = await fetch('./despensa.json', { cache: 'no-cache' });
        if (response.ok) {
            const parsed = await response.json();
            if (Array.isArray(parsed)) {
                data = parsed;
                fromServer = true;
            }
        }
    } catch (err) {
        // file:// u origen sin despensa.json: se usarán los datos incluidos al compilar.
    }

    if (!data) {
        data = Array.isArray(window.__PANTRY_SEED__) ? window.__PANTRY_SEED__ : [];
    }

    items = data.map(normalizeItem);
    source = fromServer ? 'server' : 'embedded';
    sourceName = '';
    currentFileHandle = null;
    dirty = false;
    bannerDismissed = false;

    if (byId('searchInput')) byId('searchInput').value = '';
    if (byId('categoryFilter')) byId('categoryFilter').value = '';
    if (byId('sortSelect')) byId('sortSelect').value = 'custom';

    renderAll();

    if (showReloadToast) {
        showToast(
            fromServer ? 'Despensa recargada desde despensa.json.' : 'No se pudo leer el servidor; se recargaron los datos incluidos en el HTML.',
            fromServer ? 'success' : 'warning'
        );
    }
}

async function reloadFromSource() {
    await loadInitialData(true);
}

function importJsonText(text, filename) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (err) {
        showToast('El archivo no contiene un JSON válido.', 'warning');
        return false;
    }

    if (!Array.isArray(parsed)) {
        showToast('El JSON debe ser un array de insumos.', 'warning');
        return false;
    }

    items = parsed.map(normalizeItem);
    dirty = true;
    source = 'file';
    sourceName = filename || '';
    bannerDismissed = true;

    if (byId('searchInput')) byId('searchInput').value = '';
    if (byId('categoryFilter')) byId('categoryFilter').value = '';
    if (byId('sortSelect')) byId('sortSelect').value = 'custom';

    renderAll();

    const invalidCount = countInvalidItems(items);
    if (invalidCount > 0) {
        showToast(`Se importaron ${items.length} insumo${items.length === 1 ? '' : 's'} (${invalidCount} con campos por revisar).`, 'warning');
    } else {
        showToast(`Se importaron ${items.length} insumo${items.length === 1 ? '' : 's'} desde "${filename || 'el archivo'}".`, 'success');
    }
    return true;
}

/* ------------------------------------------------------------------ */
/* Importación / exportación de archivos                               */
/* ------------------------------------------------------------------ */

async function openJsonFile() {
    const isFileOrigin = typeof window !== 'undefined' && window.location.protocol === 'file:';

    if (!isFileOrigin && typeof window.showOpenFilePicker === 'function' && window.isSecureContext) {
        try {
            const [handle] = await window.showOpenFilePicker({
                multiple: false,
                types: [{
                    description: 'Despensa EscandalloPro (*.json)',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            if (!handle) return;
            const file = await handle.getFile();
            const text = await file.text();
            if (importJsonText(text, file.name)) {
                currentFileHandle = handle;
                source = 'file';
                sourceName = file.name;
                updateDerived();
            }
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showOpenFilePicker no disponible o denegado, usando input de archivo:', err);
        }
    }

    byId('jsonFileInput').click();
}

async function onFileInputChange(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
        const text = await file.text();
        if (importJsonText(text, file.name)) {
            currentFileHandle = null;
        }
    } catch (err) {
        showToast('No se pudo leer el archivo seleccionado.', 'warning');
    }
}

function downloadTextFile(content, filename, mime = 'application/json') {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function saveJsonFile() {
    const { valid, content, count, first } = buildValidatedJson(items);

    if (!valid) {
        showToast(`Hay ${count} campo${count === 1 ? '' : 's'} por corregir antes de guardar.`, 'warning');
        focusFirstError(first);
        return;
    }

    const filename = 'despensa.json';
    const isFileOrigin = window.location.protocol === 'file:' || !window.isSecureContext;

    // 1. Si el archivo se abrió con File System Access API, sobrescribirlo directamente.
    if (currentFileHandle) {
        try {
            if (typeof currentFileHandle.queryPermission === 'function') {
                let permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
                if (permission !== 'granted' && typeof currentFileHandle.requestPermission === 'function') {
                    permission = await currentFileHandle.requestPermission({ mode: 'readwrite' });
                }
                if (permission !== 'granted') throw new Error('Permiso de escritura denegado');
            }
            const writable = await currentFileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            dirty = false;
            source = 'file';
            sourceName = currentFileHandle.name;
            updateDerived();
            showToast(`"${currentFileHandle.name}" guardado correctamente.`, 'success');
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('No se pudo sobrescribir el archivo abierto, se solicitará destino:', err);
        }
    }

    // 2. Selector nativo de destino (HTTPS / localhost).
    if (!isFileOrigin && typeof window.showSaveFilePicker === 'function') {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Despensa EscandalloPro (*.json)',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            currentFileHandle = handle;
            dirty = false;
            source = 'file';
            sourceName = handle.name;
            updateDerived();
            showToast(`"${handle.name}" guardado correctamente.`, 'success');
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showSaveFilePicker no disponible o denegado, usando descarga estándar:', err);
        }
    }

    // 3. Fallback universal: descarga del archivo.
    downloadTextFile(content, filename);
    dirty = false;
    updateDerived();
    showToast(
        isFileOrigin
            ? 'despensa.json descargado. Sustitúyelo en src/ y vuelve a compilar.'
            : 'despensa.json descargado. Sustitúyelo en src/ y vuelve a compilar.',
        'success'
    );
}

async function copyJson() {
    const { valid, content, count, first } = buildValidatedJson(items);

    if (!valid) {
        showToast(`Hay ${count} campo${count === 1 ? '' : 's'} por corregir antes de copiar.`, 'warning');
        focusFirstError(first);
        return;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(content);
            showToast('JSON copiado al portapapeles.', 'success');
            return;
        } catch (err) {
            console.warn('Clipboard API no disponible, usando fallback:', err);
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('JSON copiado al portapapeles.', 'success');
    } catch (err) {
        showToast('No se pudo copiar automáticamente. Usa la vista previa para copiarlo manualmente.', 'warning');
    }
    document.body.removeChild(textarea);
}

/* ------------------------------------------------------------------ */
/* Acciones sobre los insumos                                          */
/* ------------------------------------------------------------------ */

function focusItem(index, field = 'name') {
    requestAnimationFrame(() => {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
        const root = isDesktop ? '#pantryTableBody' : '#pantryMobileList';
        const el = document.querySelector(`${root} [data-index="${index}"] [data-field="${field}"]`);
        if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function focusFirstError(first) {
    if (!first) return;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    const root = isDesktop ? '#pantryTableBody' : '#pantryMobileList';
    let el = document.querySelector(`${root} [data-index="${first.index}"] [data-field="${first.field}"]`);
    if (!el) {
        clearFilters();
        el = document.querySelector(`${root} [data-index="${first.index}"] [data-field="${first.field}"]`);
    }
    if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function addItem() {
    items.push({
        categoria: '',
        name: '',
        unit: 'kg',
        grossQty: 0.1,
        wastePct: 0,
        unitPrice: 0
    });
    dirty = true;

    // Se limpian búsqueda, filtro y orden para que la nueva fila vacía sea visible y reciba el foco.
    if (byId('searchInput')) byId('searchInput').value = '';
    if (byId('categoryFilter')) byId('categoryFilter').value = '';
    if (byId('sortSelect')) byId('sortSelect').value = 'custom';

    renderAll();
    focusItem(items.length - 1, 'name');
    showToast('Nuevo insumo añadido. Indica su categoría, nombre y datos.', 'success');
}

function duplicateItem(index) {
    const original = items[index];
    if (!original) return;
    items.splice(index + 1, 0, {
        categoria: original.categoria,
        name: original.name ? `${original.name} (copia)` : '',
        unit: original.unit,
        grossQty: original.grossQty,
        wastePct: original.wastePct,
        unitPrice: original.unitPrice
    });
    dirty = true;
    renderAll();
    focusItem(index + 1, 'name');
    showToast('Insumo duplicado.', 'success');
}

function deleteItem(index) {
    const item = items[index];
    if (!item) return;
    items.splice(index, 1);
    dirty = true;
    renderAll();
    showToast(`Insumo "${item.name || 'sin nombre'}" eliminado.`, 'success');
}

function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const tmp = items[index];
    items[index] = items[target];
    items[target] = tmp;
    dirty = true;
    renderAll();
}

function clearFilters() {
    if (byId('searchInput')) byId('searchInput').value = '';
    if (byId('categoryFilter')) byId('categoryFilter').value = '';
    if (byId('sortSelect')) byId('sortSelect').value = 'custom';
    renderGrid();
    updateDerived();
}

/* ------------------------------------------------------------------ */
/* Eventos de la cuadrícula                                            */
/* ------------------------------------------------------------------ */

function updateItemFromElement(el) {
    const row = el.closest('[data-index]');
    if (!row) return;
    const index = Number(row.dataset.index);
    const item = items[index];
    if (!item) return;

    const field = el.dataset.field;
    if (!field) return;

    item[field] = NUMERIC_FIELDS[field] !== undefined
        ? parseLocaleFloat(el.value)
        : el.value;

    dirty = true;

    refreshRowValidity(index);
    refreshRowCost(index);
    updateDerived();
}

function onGridInput(event) {
    const el = event.target.closest('[data-field]');
    if (!el) return;
    updateItemFromElement(el);
}

function onGridChange(event) {
    const el = event.target.closest('[data-field]');
    if (!el) return;
    const field = el.dataset.field;
    if (field === 'name' || field === 'categoria') {
        el.value = formatTitleCase(el.value);
    }
    updateItemFromElement(el);
    if (field === 'categoria') {
        refreshCategoryDatalist();
    } else if (NUMERIC_FIELDS[field] !== undefined) {
        // Al confirmar el valor (blur o Enter) se muestra con coma decimal española.
        const row = el.closest('[data-index]');
        const item = row ? items[Number(row.dataset.index)] : null;
        if (item) el.value = displayFieldValue(field, item[field]);
    }
}

function onGridFocusOut(event) {
    const el = event.target.closest('[data-field]');
    if (!el) return;
    const row = el.closest('[data-index]');
    if (!row) return;
    const index = Number(row.dataset.index);
    const item = items[index];
    if (!item) return;
    const field = el.dataset.field;

    if (NUMERIC_FIELDS[field] !== undefined) {
        const value = parseLocaleFloat(el.value);
        item[field] = value;
        el.value = displayFieldValue(field, value);
    } else if (field === 'name' || field === 'categoria') {
        const value = formatTitleCase(el.value);
        item[field] = value;
        el.value = value;
        if (field === 'categoria') refreshCategoryDatalist();
    }

    refreshRowValidity(index);
    refreshRowCost(index);
    updateDerived();
}

function onGridClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const row = button.closest('[data-index]');
    const index = row ? Number(row.dataset.index) : -1;

    if (action === 'add') {
        addItem();
        return;
    }
    if (action === 'clear-filters') {
        clearFilters();
        return;
    }
    if (index < 0 || !items[index]) return;

    if (action === 'up') moveItem(index, -1);
    else if (action === 'down') moveItem(index, 1);
    else if (action === 'duplicate') duplicateItem(index);
    else if (action === 'delete') deleteItem(index);
}

/* ------------------------------------------------------------------ */
/* Inicialización                                                      */
/* ------------------------------------------------------------------ */

function renderAll() {
    refreshCategoryFilterOptions();
    refreshCategoryDatalist();
    renderGrid();
    updateDerived();
}

function toggleJsonPanel() {
    jsonPanelOpen = !jsonPanelOpen;
    const panel = byId('jsonPanel');
    const chevron = byId('jsonChevron');
    const button = byId('btnToggleJson');
    const label = byId('jsonToggleLabel');
    if (jsonPanelOpen) {
        panel.classList.remove('hidden');
        chevron.classList.add('rotate-180');
        label.textContent = 'Ocultar';
        button.setAttribute('aria-expanded', 'true');
    } else {
        panel.classList.add('hidden');
        chevron.classList.remove('rotate-180');
        label.textContent = 'Mostrar';
        button.setAttribute('aria-expanded', 'false');
    }
}

function bindGridEvents(container) {
    if (!container) return;
    container.addEventListener('input', onGridInput);
    container.addEventListener('change', onGridChange);
    container.addEventListener('focusout', onGridFocusOut);
    container.addEventListener('click', onGridClick);
}

function bindEvents() {
    ['btnAddItem', 'btnMobileAdd'].forEach(id => byId(id)?.addEventListener('click', addItem));
    ['btnOpenJsonHeader', 'btnMobileOpen'].forEach(id => byId(id)?.addEventListener('click', openJsonFile));
    ['btnSaveJsonHeader', 'btnMobileSave'].forEach(id => byId(id)?.addEventListener('click', saveJsonFile));
    ['btnCopyJsonHeader', 'btnCopyJsonPanel', 'btnMobileCopy'].forEach(id => byId(id)?.addEventListener('click', copyJson));
    ['btnReloadSourceHeader', 'btnDiscardChanges'].forEach(id => byId(id)?.addEventListener('click', confirmReload));

    byId('searchInput')?.addEventListener('input', () => {
        renderGrid();
        updateDerived();
    });
    byId('categoryFilter')?.addEventListener('change', () => {
        renderGrid();
        updateDerived();
    });
    byId('sortSelect')?.addEventListener('change', () => {
        renderGrid();
        updateDerived();
    });
    byId('btnClearFilters')?.addEventListener('click', clearFilters);
    byId('btnToggleJson')?.addEventListener('click', toggleJsonPanel);
    byId('btnDismissBanner')?.addEventListener('click', () => {
        bannerDismissed = true;
        updateSourceBanner();
    });
    byId('jsonFileInput')?.addEventListener('change', onFileInputChange);

    byId('btnConfirmCancel')?.addEventListener('click', closeConfirm);
    byId('btnConfirmOk')?.addEventListener('click', () => {
        const action = pendingConfirm;
        closeConfirm();
        if (typeof action === 'function') action();
    });
    byId('confirmModal')?.addEventListener('click', event => {
        if (event.target === byId('confirmModal')) closeConfirm();
    });

    document.addEventListener('keydown', event => {
        const isMod = event.metaKey || event.ctrlKey;
        if (isMod && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveJsonFile();
        } else if (isMod && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            byId('searchInput')?.focus();
        } else if (event.key === 'Escape') {
            const modal = byId('confirmModal');
            if (modal && !modal.classList.contains('hidden')) closeConfirm();
        }
    });

    window.addEventListener('beforeunload', event => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = '';
    });
}

function initApp() {
    bindGridEvents(byId('pantryTableBody'));
    bindGridEvents(byId('pantryMobileList'));
    bindEvents();
    loadInitialData();
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UNITS,
        SUGGESTED_CATEGORIES,
        parseLocaleFloat,
        foldText,
        normalizeUnit,
        normalizeItem,
        toExportItem,
        serializeItems,
        getItemErrors,
        countFieldErrors,
        countInvalidItems,
        validateItems,
        buildValidatedJson,
        computeStats,
        roundTo,
        formatNumber,
        displayFieldValue,
        formatTitleCase
    };
}
