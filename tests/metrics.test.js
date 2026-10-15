const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeIngredientMetrics, computeRecipeTotals, getDemoState } = require('../src/app.js');

describe('Cálculos de métricas de ingredientes y escandallo', () => {

    describe('computeIngredientMetrics', () => {
        it('calcula correctamente cantidad neta, coste de línea y precio real con merma', () => {
            const ing = {
                grossQty: 2.500,
                unit: 'kg',
                wastePct: 12,
                unitPrice: 16.80
            };

            const metrics = computeIngredientMetrics(ing);

            // Cantidad neta = 2.5 * (1 - 0.12) = 2.2 kg
            assert.strictEqual(Math.round(metrics.netQty * 1000) / 1000, 2.2);

            // Coste total = 2.5 * 16.80 = 42.00 €
            assert.strictEqual(metrics.totalCost, 42.00);

            // Precio unitario efectivo = 16.80 / (1 - 0.12) = 19.0909...
            assert.strictEqual(Math.round(metrics.effectiveUnitPrice * 100) / 100, 19.09);

            // Peso en gramos = 2.2 kg * 1000 = 2200 g
            assert.strictEqual(metrics.netGrams, 2200);
            assert.strictEqual(metrics.hasPonderableWeight, true);
        });

        it('gestiona insumos sin merma (0%)', () => {
            const ing = {
                grossQty: 1.0,
                unit: 'L',
                wastePct: 0,
                unitPrice: 9.40
            };

            const metrics = computeIngredientMetrics(ing);
            assert.strictEqual(metrics.netQty, 1.0);
            assert.strictEqual(metrics.totalCost, 9.40);
            assert.strictEqual(metrics.effectiveUnitPrice, 9.40);
            assert.strictEqual(metrics.netGrams, 1000);
            assert.strictEqual(metrics.hasPonderableWeight, true);
        });

        it('maneja correctamente unidades ponderables (kg, g, L, ml)', () => {
            const kg = computeIngredientMetrics({ grossQty: 0.5, unit: 'kg', wastePct: 0, unitPrice: 10 });
            assert.strictEqual(kg.netGrams, 500);
            assert.strictEqual(kg.hasPonderableWeight, true);

            const g = computeIngredientMetrics({ grossQty: 250, unit: 'g', wastePct: 0, unitPrice: 0.05 });
            assert.strictEqual(g.netGrams, 250);
            assert.strictEqual(g.hasPonderableWeight, true);

            const l = computeIngredientMetrics({ grossQty: 1.5, unit: 'L', wastePct: 0, unitPrice: 4 });
            assert.strictEqual(l.netGrams, 1500);
            assert.strictEqual(l.hasPonderableWeight, true);

            const ml = computeIngredientMetrics({ grossQty: 100, unit: 'ml', wastePct: 0, unitPrice: 0.02 });
            assert.strictEqual(ml.netGrams, 100);
            assert.strictEqual(ml.hasPonderableWeight, true);
        });

        it('no suma peso ponderable a insumos discretos (ud, mjo)', () => {
            const ud = computeIngredientMetrics({ grossQty: 4, unit: 'ud', wastePct: 10, unitPrice: 1.20 });
            assert.strictEqual(ud.hasPonderableWeight, false);
            assert.strictEqual(ud.netGrams, 0);
            assert.strictEqual(ud.totalCost, 4.80);

            const mjo = computeIngredientMetrics({ grossQty: 1, unit: 'mjo', wastePct: 20, unitPrice: 0.90 });
            assert.strictEqual(mjo.hasPonderableWeight, false);
            assert.strictEqual(mjo.netGrams, 0);
        });

        it('acota valores extremos o negativos', () => {
            const negativeWaste = computeIngredientMetrics({ grossQty: 1, unit: 'kg', wastePct: -10, unitPrice: 5 });
            assert.strictEqual(negativeWaste.waste, 0);

            const highWaste = computeIngredientMetrics({ grossQty: 1, unit: 'kg', wastePct: 150, unitPrice: 5 });
            assert.strictEqual(highWaste.waste, 99.9);

            const negativePrice = computeIngredientMetrics({ grossQty: -2, unit: 'kg', wastePct: 0, unitPrice: -10 });
            assert.strictEqual(negativePrice.gross, 0);
            assert.strictEqual(negativePrice.price, 0);
            assert.strictEqual(negativePrice.totalCost, 0);
        });
    });

    describe('computeRecipeTotals', () => {
        it('calcula correctamente los totales y KPIs financieros de una receta', () => {
            const testState = {
                recipePortions: 4,
                targetFoodCost: 30, // 30%
                taxRate: 10, // 10% IVA
                realMenuPrice: 22.00, // PVP Real Carta (con IVA)
                ingredients: [
                    { grossQty: 1.0, unit: 'kg', wastePct: 0, unitPrice: 10.00 }, // 10.00 €
                    { grossQty: 0.5, unit: 'kg', wastePct: 20, unitPrice: 4.00 }   // 2.00 €
                ]
            };

            const totals = computeRecipeTotals(testState);

            // Coste total = 10 + 2 = 12 €
            assert.strictEqual(totals.totalCost, 12.00);

            // Coste por ración = 12 / 4 = 3 €
            assert.strictEqual(totals.costPerPortion, 3.00);

            // PVP Sugerido sin IVA (con FC 30%) = 3 / 0.30 = 10 €
            assert.strictEqual(totals.suggestedNetPrice, 10.00);

            // PVP Sugerido con IVA (+10%) = 10 * 1.10 = 11 €
            assert.strictEqual(totals.suggestedGrossPrice, 11.00);

            // PVP Carta Real neto (sin IVA) = 22 / 1.10 = 20 €
            assert.strictEqual(totals.realNetPrice, 20.00);

            // Food Cost Real = (coste por ración / precio neto real) * 100 = (3 / 20) * 100 = 15%
            assert.strictEqual(totals.realFoodCostPct, 15.00);

            // Margen bruto por ración = 20 - 3 = 17 €
            assert.strictEqual(totals.grossMarginPerPortion, 17.00);

            // Margen lote total = 17 * 4 = 68 €
            assert.strictEqual(totals.totalBatchMargin, 68.00);

            // Peso neto total = 1.0 kg + (0.5 * 0.8) kg = 1.0 + 0.4 = 1.4 kg = 1400 g
            assert.strictEqual(totals.totalNetGrams, 1400);
            assert.strictEqual(totals.ponderableCount, 2);
        });

        it('calcula correctamente la receta de demostración profesional', () => {
            const demo = getDemoState();
            const totals = computeRecipeTotals(demo);

            assert.ok(totals.totalCost > 0);
            assert.strictEqual(totals.portions, 10);
            assert.strictEqual(totals.targetFc, 26);
            assert.strictEqual(totals.taxPct, 10);
            assert.strictEqual(totals.realGrossPrice, 24.50);
            assert.ok(totals.costPerPortion > 0);
            assert.ok(totals.suggestedGrossPrice > 0);
            assert.ok(totals.realNetPrice > 0);
            assert.ok(totals.realFoodCostPct > 0);
            assert.ok(totals.grossMarginPerPortion > 0);
        });

        it('evita divisiones por cero con valores extremos o vacíos', () => {
            const emptyState = {
                recipePortions: 0,
                targetFoodCost: 0,
                taxRate: 0,
                realMenuPrice: 0,
                ingredients: []
            };

            const totals = computeRecipeTotals(emptyState);
            assert.strictEqual(totals.totalCost, 0);
            assert.strictEqual(totals.costPerPortion, 0);
            assert.strictEqual(totals.realFoodCostPct, 0);
            assert.strictEqual(totals.totalNetGrams, 0);
            assert.strictEqual(totals.portions, 1); // Acotado a mínimo 1
        });
    });
});
