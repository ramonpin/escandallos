const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    computeRecipeTotals,
    generateObsidianMarkdown,
    parseMarkdownEscandallo,
    getDemoState
} = require('../src/app.js');

describe('Generación y parseo de Markdown para Obsidian', () => {

    describe('generateObsidianMarkdown', () => {
        it('genera Markdown completo con Frontmatter YAML, Callouts y Wikilinks', () => {
            const demo = getDemoState();
            const totals = computeRecipeTotals(demo);
            const md = generateObsidianMarkdown(totals, demo);

            // Frontmatter YAML
            assert.match(md, /^---\r?\n/);
            assert.match(md, /title: "Carrillera Ibérica Glaseada al Oporto con Parmentier Trufado"/);
            assert.match(md, /codigo: "ESC-CAR-014"/);
            assert.match(md, /tipo: escandallo/);
            assert.match(md, /raciones: 10/);
            assert.match(md, /food_cost_objetivo: 26/);
            assert.match(md, /pvp_carta_real: 24\.50/);
            assert.match(md, /alergenos:\r?\n\s+- "Lácteos"/);
            assert.match(md, /tags:\r?\n\s+- escandallo/);

            // Título de encabezado
            assert.match(md, /# 🍽️ Carrillera Ibérica Glaseada al Oporto con Parmentier Trufado/);

            // Callouts
            assert.match(md, /> \[!(?:success|warning)\] Resumen Económico y Rentabilidad/);
            assert.match(md, /> \[!danger\] Alérgenos Presentes/);
            assert.match(md, /> \[!info\] Conservación, Vacío y Control APPCC/);

            // Wikilinks en la tabla de ingredientes
            assert.match(md, /\| \[\[Carrillera de Cerdo Ibérico Limpia\]\] \|/);
            assert.match(md, /\| \[\[Vino Oporto Ruby\]\] \|/);

            // Tabla de totales
            assert.match(md, /\| \| \*\*TOTALES\*\* \|/);
            assert.match(md, /\*\*100%\*\*/);
        });

        it('genera Markdown limpio sin YAML ni Callouts cuando las opciones están desactivadas', () => {
            const customState = {
                ...getDemoState(),
                recipeName: 'Merluza en Salsa Verde',
                recipeCode: 'ESC-PES-002',
                optIncludeYaml: false,
                optIncludeCallouts: false,
                optWikiLinks: false,
                allergens: ['pescado'],
                ingredients: [
                    { id: '1', name: 'Merluza de pincho', grossQty: 0.8, unit: 'kg', wastePct: 15, unitPrice: 18.00 }
                ]
            };

            const totals = computeRecipeTotals(customState);
            const md = generateObsidianMarkdown(totals, customState);

            // No debe incluir bloques YAML
            assert.ok(!md.startsWith('---'));
            assert.ok(!md.includes('tipo: escandallo'));

            // No debe incluir sintaxis de Callouts
            assert.ok(!md.includes('> [!success]'));
            assert.ok(!md.includes('> [!danger]'));

            // Debe incluir secciones estándar
            assert.match(md, /## 📊 Resumen Económico/);
            assert.match(md, /## ⚠️ Alérgenos/);
            assert.match(md, /🐟 Pescado/);

            // Sin wikilinks
            assert.ok(!md.includes('[[Merluza de pincho]]'));
            assert.match(md, /\| Merluza de pincho \|/);
        });

        it('exporta e importa los precios unitarios con cuatro decimales sin alterar el resto de importes', () => {
            const customState = {
                ...getDemoState(),
                recipeName: 'Prueba de precisión',
                ingredients: [
                    { id: '1', name: 'Insumo de precisión', grossQty: 1, unit: 'kg', wastePct: 10, unitPrice: 12.3456 }
                ]
            };

            const md = generateObsidianMarkdown(computeRecipeTotals(customState), customState);

            // El precio unitario de compra conserva cuatro decimales.
            assert.match(md, /\| 12,3456 € \|/);
            // El coste real por unidad neta y el coste total se mantienen con dos decimales.
            assert.match(md, /\| 13,72 € \|/);
            assert.match(md, /\*\*12,35 €\*\*/);

            const parsed = parseMarkdownEscandallo(md);
            assert.strictEqual(parsed.ingredients[0].unitPrice, 12.3456);
        });

        it('refleja adecuadamente recetas sin alérgenos', () => {
            const stateSinAlergenos = {
                ...getDemoState(),
                allergens: []
            };
            const totals = computeRecipeTotals(stateSinAlergenos);
            const md = generateObsidianMarkdown(totals, stateSinAlergenos);

            assert.match(md, /Sin alérgenos declarados/);
            assert.match(md, /✅ Sin alérgenos de declaración obligatoria/);
        });
    });

    describe('parseMarkdownEscandallo', () => {
        it('reconstruye el estado completo desde Markdown estructurado con YAML y Callouts', () => {
            const demo = getDemoState();
            const totals = computeRecipeTotals(demo);
            const md = generateObsidianMarkdown(totals, demo);

            const parsed = parseMarkdownEscandallo(md);

            assert.strictEqual(parsed.recipeName, demo.recipeName);
            assert.strictEqual(parsed.recipeCode, demo.recipeCode);
            assert.strictEqual(parsed.recipeCategory, demo.recipeCategory);
            assert.strictEqual(parsed.recipeChef, demo.recipeChef);
            assert.strictEqual(parsed.recipeTime, demo.recipeTime);
            assert.strictEqual(parsed.recipePortions, demo.recipePortions);
            assert.strictEqual(parsed.targetFoodCost, demo.targetFoodCost);
            assert.strictEqual(parsed.taxRate, demo.taxRate);
            assert.strictEqual(parsed.realMenuPrice, demo.realMenuPrice);
            assert.strictEqual(parsed.currencySymbol, '€');
            assert.strictEqual(parsed.optIncludeYaml, true);
            assert.strictEqual(parsed.optIncludeCallouts, true);
            assert.strictEqual(parsed.optWikiLinks, true);

            // Alérgenos reconocidos
            assert.deepStrictEqual(parsed.allergens.sort(), demo.allergens.sort());

            // Ingredientes
            assert.strictEqual(parsed.ingredients.length, demo.ingredients.length);
            assert.strictEqual(parsed.ingredients[0].name, demo.ingredients[0].name);
            assert.strictEqual(parsed.ingredients[0].grossQty, demo.ingredients[0].grossQty);
            assert.strictEqual(parsed.ingredients[0].unit, demo.ingredients[0].unit);
            assert.strictEqual(parsed.ingredients[0].wastePct, demo.ingredients[0].wastePct);
            assert.strictEqual(parsed.ingredients[0].unitPrice, demo.ingredients[0].unitPrice);

            // El emplatado no debe arrastrar el callout de conservación
            assert.strictEqual(parsed.recipePlating, demo.recipePlating);
            assert.ok(!parsed.recipePlating.includes('Conservación'));
            assert.strictEqual(parsed.recipeConservation, demo.recipeConservation);
        });

        it('reconstruye el estado desde Markdown plano sin YAML ni Callouts', () => {
            const rawMarkdown = `# 🍽️ Bacalao al Pil Pil

**Código:** \`ESC-BAC-001\` | **Partida:** Pescados | **Responsable:** Jefe de Partida | **Tiempo:** 40 min

## 📊 Resumen Económico (4 raciones)

- **Coste Total Receta:** 18,50 €
- **Coste por Ración:** **4,63 €**
- **PVP Sugerido (+10% IVA):** 17,20 €
- **PVP Carta Real:** 19,00 € (Food Cost Real: **26,8%**)
- **Margen Bruto por Ración:** 12,64 €

## 🧾 Escandallo de Ingredientes y Mermas

| # | Ingrediente | Cant. Bruta | Ud | Merma % | Cant. Neta | Precio/Ud | Coste Real/Ud | Coste Total | % Coste |
|---:|:---|---:|:---:|---:|---:|---:|---:|---:|---:|
| 1 | Lomo de bacalao desalado | 0,800 | kg | 5% | 0,760 | 18,00 € | 18,95 € | **14,40 €** | 77,8% |
| 2 | Aceite de oliva virgen extra | 0,300 | L | 0% | 0,300 | 9,00 € | 9,00 € | **2,70 €** | 14,6% |
| 3 | Dientes de ajo y guindilla | 0,050 | kg | 10% | 0,045 | 4,00 € | 4,44 € | **0,20 €** | 1,1% |
| | **TOTALES** | | | | **1,105 kg** | | | **17,30 €** | **100%** |

## ⚠️ Alérgenos
🐟 Pescado

## 👨‍🍳 Procedimiento de Elaboración (Mise en Place)
Confitar los lomos a 65°C con ajos y guindilla. Emulsionar el pil pil con colador y movimientos circulares.

## 🎨 Acabado y Pase (Emplatado)
Napar el bacalao con la emulsión templada y decorar con los ajos laminados.

## ❄️ Conservación y APPCC
Servir inmediatamente o mantener en pase a 60°C.
`;

            const parsed = parseMarkdownEscandallo(rawMarkdown);

            assert.strictEqual(parsed.recipeName, 'Bacalao al Pil Pil');
            assert.strictEqual(parsed.recipeCode, 'ESC-BAC-001');
            assert.strictEqual(parsed.recipeCategory, 'Pescados');
            assert.strictEqual(parsed.recipeChef, 'Jefe de Partida');
            assert.strictEqual(parsed.recipeTime, 40);
            assert.strictEqual(parsed.recipePortions, 4);
            assert.strictEqual(parsed.taxRate, 10);
            assert.strictEqual(parsed.realMenuPrice, 19.00);
            assert.strictEqual(parsed.currencySymbol, '€');
            assert.strictEqual(parsed.optIncludeYaml, false);
            assert.strictEqual(parsed.optIncludeCallouts, false);
            assert.strictEqual(parsed.optWikiLinks, false);

            assert.deepStrictEqual(parsed.allergens, ['pescado']);
            assert.strictEqual(parsed.ingredients.length, 3);
            assert.strictEqual(parsed.ingredients[0].name, 'Lomo de Bacalao Desalado');
            assert.strictEqual(parsed.ingredients[1].name, 'Aceite de Oliva Virgen Extra');
            assert.strictEqual(parsed.ingredients[2].name, 'Dientes de Ajo y Guindilla');
            assert.strictEqual(parsed.ingredients[0].grossQty, 0.8);
            assert.strictEqual(parsed.ingredients[0].wastePct, 5);
            assert.strictEqual(parsed.ingredients[0].unitPrice, 18.00);

            assert.ok(parsed.recipeSteps.includes('Confitar los lomos'));
            assert.ok(parsed.recipePlating.includes('Napar el bacalao'));
            assert.ok(parsed.recipeConservation.includes('Servir inmediatamente'));
        });

        it('devuelve null o valores vacíos seguros con entradas no válidas', () => {
            assert.strictEqual(parseMarkdownEscandallo(null), null);
            assert.strictEqual(parseMarkdownEscandallo(''), null);
            assert.strictEqual(parseMarkdownEscandallo(123), null);

            const textoArbitrario = 'Hola mundo sin formato de escandallo';
            const parsed = parseMarkdownEscandallo(textoArbitrario);
            assert.strictEqual(parsed.recipeName, '');
            assert.strictEqual(parsed.ingredients.length, 0);
        });
    });

    describe('Test de ida y vuelta (Round-trip)', () => {
        it('garantiza consistencia idéntica en el ciclo: Estado -> Markdown -> Estado -> Totales', () => {
            const originalState = getDemoState();
            const originalTotals = computeRecipeTotals(originalState);
            const generatedMd = generateObsidianMarkdown(originalTotals, originalState);

            const reconstructedState = parseMarkdownEscandallo(generatedMd);
            const reconstructedTotals = computeRecipeTotals(reconstructedState);

            // Nombre y metadatos
            assert.strictEqual(reconstructedState.recipeName, originalState.recipeName);
            assert.strictEqual(reconstructedState.recipeCode, originalState.recipeCode);
            assert.strictEqual(reconstructedState.recipeCategory, originalState.recipeCategory);
            assert.strictEqual(reconstructedState.recipeChef, originalState.recipeChef);
            assert.strictEqual(reconstructedState.recipeTime, originalState.recipeTime);
            assert.strictEqual(reconstructedState.recipePortions, originalState.recipePortions);

            // Alérgenos e insumos
            assert.strictEqual(reconstructedState.ingredients.length, originalState.ingredients.length);
            assert.deepStrictEqual(reconstructedState.allergens.sort(), originalState.allergens.sort());

            // Los totales económicos calculados deben coincidir con precisión decimal
            assert.strictEqual(reconstructedTotals.totalCost.toFixed(2), originalTotals.totalCost.toFixed(2));
            assert.strictEqual(reconstructedTotals.costPerPortion.toFixed(2), originalTotals.costPerPortion.toFixed(2));
            assert.strictEqual(reconstructedTotals.suggestedGrossPrice.toFixed(2), originalTotals.suggestedGrossPrice.toFixed(2));
            assert.strictEqual(reconstructedTotals.realGrossPrice.toFixed(2), originalTotals.realGrossPrice.toFixed(2));
            assert.strictEqual(reconstructedTotals.realFoodCostPct.toFixed(2), originalTotals.realFoodCostPct.toFixed(2));
            assert.strictEqual(reconstructedTotals.grossMarginPerPortion.toFixed(2), originalTotals.grossMarginPerPortion.toFixed(2));
        });
    });
});
