const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    formatNumber,
    formatCurrency,
    formatUnitPrice,
    formatTitleCase,
    normalizePantryItem,
    filterPantryItems,
    INGREDIENT_FIELD_DECIMALS,
    parseLocaleFloat,
    escapeYaml,
    escapeMdCell,
    escapeHtml,
    slugifyFilename,
    generateId
} = require('../src/app.js');

describe('Formateo, sanitización y funciones de utilidad', () => {

    describe('formatNumber', () => {
        it('formatea números asegurando exactamente dos decimales en configuración estándar', () => {
            assert.strictEqual(formatNumber(16.8, 2), '16,80');
            assert.strictEqual(formatNumber(0, 2), '0,00');
            assert.strictEqual(formatNumber(24.5, 2), '24,50');
            assert.strictEqual(formatNumber(100, 2), '100,00');
            assert.strictEqual(formatNumber(1.999, 2), '2,00');
        });

        it('respeta la cantidad de decimales indicada', () => {
            assert.strictEqual(formatNumber(2.5, 3), '2,500');
            assert.strictEqual(formatNumber(24.3123, 1), '24,3');
            assert.strictEqual(formatNumber(12, 0), '12');
        });

        it('gestiona entradas en formato string numérico', () => {
            assert.strictEqual(formatNumber('16.8', 2), '16,80');
            assert.strictEqual(formatNumber('16,8', 2), '16,80');
            assert.strictEqual(formatNumber('1.500,50', 2), '1500,50');
            assert.strictEqual(formatNumber('0', 2), '0,00');
        });

        it('devuelve formato seguro en caso de NaN o valores no numéricos', () => {
            assert.strictEqual(formatNumber(NaN, 2), '0,00');
            assert.strictEqual(formatNumber(Infinity, 2), '0,00');
            assert.strictEqual(formatNumber(null, 2), '0,00');
            assert.strictEqual(formatNumber(undefined, 2), '0,00');
            assert.strictEqual(formatNumber('invalido', 2), '0,00');
        });
    });

    describe('formatCurrency', () => {
        it('añade el símbolo de divisa con el formato de dos decimales', () => {
            assert.strictEqual(formatCurrency(16.8, '€'), '16,80 €');
            assert.strictEqual(formatCurrency(24.5, '$'), '24,50 $');
            assert.strictEqual(formatCurrency(0, '£'), '0,00 £');
        });
    });

    describe('formatUnitPrice', () => {
        it('presenta los precios unitarios con cuatro decimales', () => {
            assert.strictEqual(INGREDIENT_FIELD_DECIMALS.unitPrice, 4);
            assert.strictEqual(formatUnitPrice(16.8, '€'), '16,8000 €');
            assert.strictEqual(formatUnitPrice(0.12345, '$'), '0,1235 $');
            assert.strictEqual(formatUnitPrice(0, '£'), '0,0000 £');
        });
    });

    describe('formatTitleCase', () => {
        it('aplica al escandallo la misma capitalización tipo título que la despensa', () => {
            assert.strictEqual(formatTitleCase('aceite de oliva virgen extra'), 'Aceite de Oliva Virgen Extra');
            assert.strictEqual(formatTitleCase('carrillera de cerdo ibérico limpia'), 'Carrillera de Cerdo Ibérico Limpia');
            assert.strictEqual(formatTitleCase('sal y pimienta'), 'Sal y Pimienta');
            assert.strictEqual(formatTitleCase('  carrillera   cerdo  '), 'Carrillera Cerdo');
            assert.strictEqual(formatTitleCase('nata culinaria 35% M.G.'), 'Nata Culinaria 35% M.G.');
            assert.strictEqual(formatTitleCase('sub-receta / base'), 'Sub-Receta / Base');
            assert.strictEqual(formatTitleCase(''), '');
        });
    });

    describe('Buscador de despensa', () => {
        const pantry = [
            { categoria: 'Verduras y Hortalizas', name: 'Cebolla Dulce', unit: 'kg', grossQty: 1, wastePct: 15, unitPrice: 0.9234 },
            { categoria: 'Grasas y Aceites', name: 'Aceite de Oliva Virgen Extra', unit: 'L', grossQty: 1, wastePct: 0, unitPrice: 9.2345 },
            { categoria: 'Carnes y Aves', name: 'Pechuga de Pollo', unit: 'kg', grossQty: 1, wastePct: 5, unitPrice: 6.7891 },
            { categoria: 'Verduras y Hortalizas', name: 'Ajo Morado', unit: 'kg', grossQty: 1, wastePct: 20, unitPrice: 3 }
        ];

        it('normaliza el insumo y mantiene cuatro decimales en el precio unitario', () => {
            const item = normalizePantryItem({
                categoria: 'grasas y aceites',
                name: 'aceite de oliva virgen extra',
                unit: 'L',
                grossQty: '1,5',
                wastePct: '0',
                unitPrice: '9,23456'
            });

            assert.equal(item.categoria, 'Grasas y Aceites');
            assert.equal(item.name, 'Aceite de Oliva Virgen Extra');
            assert.equal(item.unit, 'L');
            assert.equal(item.grossQty, 1.5);
            assert.equal(item.unitPrice, 9.2346);
        });

        it('busca por nombre y categoría sin distinguir tildes ni mayúsculas', () => {
            assert.deepEqual(filterPantryItems(pantry, 'cebolla').map(i => i.name), ['Cebolla Dulce']);
            assert.deepEqual(filterPantryItems(pantry, 'ACEITE').map(i => i.name), ['Aceite de Oliva Virgen Extra']);
            assert.deepEqual(filterPantryItems(pantry, 'verduras').map(i => i.name), ['Ajo Morado', 'Cebolla Dulce']);
            assert.deepEqual(filterPantryItems(pantry, 'pollo').map(i => i.name), ['Pechuga de Pollo']);
        });

        it('prioriza los nombres que empiezan por el término buscado', () => {
            const results = filterPantryItems(pantry, 'aceite');
            assert.equal(results[0].name, 'Aceite de Oliva Virgen Extra');
            assert.equal(filterPantryItems(pantry, '').length, pantry.length);
            assert.deepEqual(filterPantryItems(pantry, 'inexistente'), []);
        });
    });

    describe('parseLocaleFloat', () => {
        it('parsea correctamente números con coma decimal (formato español)', () => {
            assert.strictEqual(parseLocaleFloat('16,80'), 16.80);
            assert.strictEqual(parseLocaleFloat('0,05'), 0.05);
            assert.strictEqual(parseLocaleFloat('2,500'), 2.5);
        });

        it('parsea correctamente números con separador de miles y coma decimal', () => {
            assert.strictEqual(parseLocaleFloat('1.500,50'), 1500.50);
            assert.strictEqual(parseLocaleFloat('12.345,67'), 12345.67);
        });

        it('soporta formato estándar con punto decimal y separador de miles con coma', () => {
            assert.strictEqual(parseLocaleFloat('16.80'), 16.80);
            assert.strictEqual(parseLocaleFloat('1,500.50'), 1500.50);
        });

        it('elimina símbolos de moneda, porcentajes y espacios no numéricos', () => {
            assert.strictEqual(parseLocaleFloat('16,80 €'), 16.80);
            assert.strictEqual(parseLocaleFloat('24.50 $'), 24.50);
            assert.strictEqual(parseLocaleFloat('12,0%'), 12.0);
            assert.strictEqual(parseLocaleFloat('+10% IVA'), 10);
        });

        it('maneja valores ya numéricos', () => {
            assert.strictEqual(parseLocaleFloat(16.8), 16.8);
            assert.strictEqual(parseLocaleFloat(0), 0);
        });

        it('devuelve 0 ante entradas nulas, vacías o inválidas', () => {
            assert.strictEqual(parseLocaleFloat(''), 0);
            assert.strictEqual(parseLocaleFloat(null), 0);
            assert.strictEqual(parseLocaleFloat(undefined), 0);
            assert.strictEqual(parseLocaleFloat('sin_numeros'), 0);
        });
    });

    describe('Funciones de escape y sanitización', () => {
        it('escapeYaml escapa barras invertidas y comillas dobles', () => {
            assert.strictEqual(escapeYaml('Plato "Especial"'), 'Plato \\"Especial\\"');
            assert.strictEqual(escapeYaml('C:\\Ruta'), 'C:\\\\Ruta');
            assert.strictEqual(escapeYaml(null), '');
        });

        it('escapeMdCell escapa tuberías (|) para proteger celdas de tabla', () => {
            assert.strictEqual(escapeMdCell('Solomillo | Salsa'), 'Solomillo \\| Salsa');
            assert.strictEqual(escapeMdCell('Normal'), 'Normal');
        });

        it('escapeHtml escapa caracteres especiales HTML', () => {
            assert.strictEqual(escapeHtml('<script>alert("x")&foo</script>'), '&lt;script&gt;alert(&quot;x&quot;)&amp;foo&lt;/script&gt;');
            assert.strictEqual(escapeHtml(null), '');
        });
    });

    describe('slugifyFilename', () => {
        it('normaliza tildes, mayúsculas y caracteres especiales en nombres de archivo', () => {
            assert.strictEqual(slugifyFilename('Carrillera Ibérica al Oporto'), 'carrillera-iberica-al-oporto');
            assert.strictEqual(slugifyFilename('Receta #1: Merluza & Almejas!'), 'receta-1-merluza-almejas');
            assert.strictEqual(slugifyFilename('   Espacios   y   Guiones--- '), 'espacios-y-guiones');
        });

        it('ofrece un nombre de respaldo cuando la cadena queda vacía', () => {
            assert.strictEqual(slugifyFilename(''), 'escandallo-cocina');
            assert.strictEqual(slugifyFilename('!@#$%^&*()'), 'escandallo-cocina');
        });
    });

    describe('generateId', () => {
        it('genera identificadores únicos y no vacíos', () => {
            const id1 = generateId();
            const id2 = generateId();
            assert.ok(typeof id1 === 'string' && id1.length > 0);
            assert.ok(typeof id2 === 'string' && id2.length > 0);
            assert.notStrictEqual(id1, id2);
        });
    });
});
