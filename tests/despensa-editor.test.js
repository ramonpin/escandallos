const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const editor = require('../src/despensa.js');

describe('Editor de despensa: normalización y validación', () => {
    it('normaliza comas decimales, alias de unidades y valores ausentes', () => {
        const item = editor.normalizeItem({
            categoria: '  Verduras y Hortalizas ',
            name: '  Cebolla  ',
            unit: 'KILOS',
            grossQty: '0,40',
            wastePct: '15,5',
            unitPrice: '1,60'
        });

        assert.deepEqual(item, {
            categoria: 'Verduras y Hortalizas',
            name: 'Cebolla',
            unit: 'kg',
            grossQty: 0.4,
            wastePct: 15.5,
            unitPrice: 1.6
        });
    });

    it('detecta todos los campos inválidos de un insumo', () => {
        const errors = editor.getItemErrors({
            categoria: '',
            name: '',
            unit: 'xx',
            grossQty: 0,
            wastePct: 100,
            unitPrice: -1
        });

        assert.deepEqual(Object.keys(errors).sort(), [
            'categoria', 'grossQty', 'name', 'unit', 'unitPrice', 'wastePct'
        ]);
    });

    it('acepta un insumo válido con merma y precio cero', () => {
        const errors = editor.getItemErrors({
            categoria: 'Fondos y Caldos',
            name: 'Agua',
            unit: 'L',
            grossQty: 1,
            wastePct: 0,
            unitPrice: 0
        });

        assert.deepEqual(errors, {});
    });

    it('serializa con el orden y formato de claves esperado por EscandalloPro', () => {
        const json = editor.serializeItems([{
            categoria: 'Grasas y Aceites',
            name: 'Aceite de Oliva Virgen Extra',
            unit: 'L',
            grossQty: 0.08,
            wastePct: 0,
            unitPrice: 9.2
        }]);

        const parsed = JSON.parse(json);
        assert.deepEqual(Object.keys(parsed[0]), ['categoria', 'name', 'unit', 'grossQty', 'wastePct', 'unitPrice']);
        assert.equal(parsed[0].unitPrice, 9.2);
        assert.match(json, /^\s*\[/);
    });

    it('bloquea la exportación si existe algún error y localiza el primero', () => {
        const result = editor.buildValidatedJson([
            { categoria: 'Carnes', name: 'Pollo', unit: 'kg', grossQty: 1, wastePct: 0, unitPrice: 5 },
            { categoria: '', name: '', unit: 'kg', grossQty: 0, wastePct: 0, unitPrice: 0 }
        ]);

        assert.equal(result.valid, false);
        assert.equal(result.content, null);
        assert.deepEqual(result.first, {
            index: 1,
            field: 'categoria',
            message: 'La categoría es obligatoria.'
        });
    });

    it('calcula estadísticas de la despensa', () => {
        const stats = editor.computeStats([
            { categoria: 'A', name: 'Uno', unit: 'kg', grossQty: 1, wastePct: 10, unitPrice: 2 },
            { categoria: 'A', name: 'Dos', unit: 'L', grossQty: 2, wastePct: 0, unitPrice: 4 },
            { categoria: 'B', name: 'Tres', unit: 'ud', grossQty: 0, wastePct: 20, unitPrice: 1 }
        ]);

        assert.equal(stats.total, 3);
        assert.equal(stats.categories, 2);
        assert.equal(stats.withWaste, 2);
        assert.equal(stats.avgWaste, 10);
        assert.equal(stats.avgPrice, 7 / 3);
        assert.equal(stats.totalCost, 10);
    });

    it('la despensa real del proyecto supera la validación del editor', () => {
        const fs = require('fs');
        const path = require('path');
        const raw = fs.readFileSync(path.resolve(__dirname, '../src/despensa.json'), 'utf8');
        const list = JSON.parse(raw).map(editor.normalizeItem);
        const result = editor.buildValidatedJson(list);

        assert.equal(result.valid, true, result.first ? result.first.message : '');
        assert.ok(JSON.parse(result.content).length >= 10);
    });
});
