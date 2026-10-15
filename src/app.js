/**
         * 14 Mandatory EU Allergens (Regulation EU 1169/2011)
         */
        const EU_ALLERGENS = [
            { id: 'gluten', name: 'Gluten', icon: '🌾' },
            { id: 'crustaceos', name: 'Crustáceos', icon: '🦀' },
            { id: 'huevos', name: 'Huevos', icon: '🥚' },
            { id: 'pescado', name: 'Pescado', icon: '🐟' },
            { id: 'cacahuetes', name: 'Cacahuetes', icon: '🥜' },
            { id: 'soja', name: 'Soja', icon: '🫘' },
            { id: 'lacteos', name: 'Lácteos', icon: '🥛' },
            { id: 'frutos_cascara', name: 'Frutos cáscara', icon: '🌰' },
            { id: 'apio', name: 'Apio', icon: '🥬' },
            { id: 'mostaza', name: 'Mostaza', icon: '🌭' },
            { id: 'sesamo', name: 'Sésamo', icon: '🥯' },
            { id: 'sulfitos', name: 'Sulfitos', icon: '🍷' },
            { id: 'altramuces', name: 'Altramuces', icon: '🌼' },
            { id: 'moluscos', name: 'Moluscos', icon: '🦪' }
        ];

        const STORAGE_KEY = 'escandallo_pro_obsidian_v1';

        /**
         * Universal ID generator with fallback for non-secure contexts (file:// protocol)
         */
        function generateId() {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                try {
                    return crypto.randomUUID();
                } catch (e) {
                    // Fallback to random string
                }
            }
            return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        }

        /**
         * Safe escape functions for YAML and Markdown tables
         */
        function escapeYaml(str) {
            return String(str ?? '')
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"');
        }

        function escapeMdCell(str) {
            return String(str ?? '')
                .replace(/\|/g, '\\|')
                .trim();
        }

        function escapeHtml(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        /**
         * Default Demo Recipe (Carrillera Ibérica al Oporto)
         */
        function getDemoState() {
            return {
                recipeName: 'Carrillera Ibérica Glaseada al Oporto con Parmentier Trufado',
                recipeCode: 'ESC-CAR-014',
                recipeCategory: 'Plato Principal - Carnes',
                recipeChef: 'Partida de Carnes',
                recipeTime: 150,
                recipeTags: 'escandallo, carnes, iberico, carta-principal, produccion',
                recipePortions: 10,
                targetFoodCost: 26,
                taxRate: 10,
                realMenuPrice: 24.50,
                currencySymbol: '€',
                optIncludeYaml: true,
                optIncludeCallouts: true,
                optWikiLinks: true,
                allergens: ['lacteos', 'apio', 'sulfitos'],
                ingredients: [
                    { id: generateId(), name: 'Carrillera de Cerdo Ibérico limpia', grossQty: 2.500, unit: 'kg', wastePct: 12, unitPrice: 16.80 },
                    { id: generateId(), name: 'Cebolla Morada', grossQty: 0.800, unit: 'kg', wastePct: 15, unitPrice: 1.50 },
                    { id: generateId(), name: 'Zanahoria y Apio (Mirepoix)', grossQty: 0.600, unit: 'kg', wastePct: 18, unitPrice: 1.75 },
                    { id: generateId(), name: 'Vino Oporto Ruby', grossQty: 0.750, unit: 'L', wastePct: 0, unitPrice: 9.40 },
                    { id: generateId(), name: 'Fondo Oscuro de Ternera reducido', grossQty: 1.200, unit: 'L', wastePct: 0, unitPrice: 6.20 },
                    { id: generateId(), name: 'Patata Kennebec (para Parmentier)', grossQty: 1.800, unit: 'kg', wastePct: 20, unitPrice: 1.35 },
                    { id: generateId(), name: 'Mantequilla Extra 82% M.G.', grossQty: 0.350, unit: 'kg', wastePct: 0, unitPrice: 11.20 },
                    { id: generateId(), name: 'Pasta de Trufa Negra (Tuber melanosporum)', grossQty: 0.045, unit: 'kg', wastePct: 0, unitPrice: 85.00 },
                    { id: generateId(), name: 'Aceite de Oliva Virgen Extra y Sal en escamas', grossQty: 0.120, unit: 'L', wastePct: 0, unitPrice: 9.10 }
                ],
                recipeSteps: `1. Limpiar las carrilleras retirando el exceso de grasa exterior y la aponeurosis superficial (aprox. 12% de merma).\n2. Salpimentar y marcar a fuego vivo en rondeau con AOVE hasta lograr una reacción de Maillard uniforme. Retirar y reservar.\n3. En la misma grasa, pochar la bresa de verduras (cebolla, zanahoria y apio en mirepoix) durante 25 minutos.\n4. Desglasar con el vino de Oporto y reducir a seco hasta un tercio de su volumen.\n5. Reincorporar las carrilleras, mojar con el fondo oscuro y estofar a fuego suave (o en horno mixto a 145°C tapado) durante 2 horas hasta que estén tiernas.\n6. Colar la salsa por chino fino, desgrasar y reducir hasta textura napante.\n7. Cocer la patata con piel en agua salada, pelar en caliente, pasar por pasapurés y emulsionar con la mantequilla fría en dados y la pasta de trufa.`,
                recipePlating: `En plato hondo de gres oscuro caliente, trazar una lágrima generosa de parmentier trufado (140 g/ración). Disponer 2 piezas y media de carrillera glaseada encima (aprox. 180 g netos en crudo) y salsear con el jugo de Oporto brillante. Decorar con brotes de mostaza frisée.`,
                recipeConservation: `Enfriamiento rápido en abatidor de temperatura a +3°C en menos de 90 min. Envasar las carrilleras con su salsa en bolsas de vacío de 5 raciones. Conservación en cámara a 2°C durante 14 días.`
            };
        }

        let state = getDemoState();

        /**
         * Formats a number with Spanish locale formatting
         */
        function formatNumber(num, decimals = 2) {
            if (!Number.isFinite(num)) return '0,00';
            return num.toLocaleString('es-ES', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        function formatCurrency(num, symbol = state.currencySymbol) {
            return `${formatNumber(num, 2)} ${symbol}`;
        }

        /**
         * Calculates individual ingredient row metrics:
         * - Net Quantity = Gross Quantity * (1 - Waste% / 100)
         * - Line Cost = Gross Quantity * Unit Purchase Price
         * - Effective Price per Net Unit = Unit Purchase Price / (1 - Waste% / 100)
         */
        function computeIngredientMetrics(ing) {
            const gross = Math.max(0, parseFloat(ing.grossQty) || 0);
            const waste = Math.min(99.9, Math.max(0, parseFloat(ing.wastePct) || 0));
            const price = Math.max(0, parseFloat(ing.unitPrice) || 0);
            const yieldFactor = (100 - waste) / 100;

            const netQty = gross * yieldFactor;
            const totalCost = gross * price;
            const effectiveUnitPrice = yieldFactor > 0 ? (price / yieldFactor) : price;

            // Approximate weight in grams for ponderable mass
            let netGrams = 0;
            let hasPonderableWeight = false;
            if (ing.unit === 'kg' || ing.unit === 'L') {
                netGrams = netQty * 1000;
                hasPonderableWeight = true;
            } else if (ing.unit === 'g' || ing.unit === 'ml') {
                netGrams = netQty;
                hasPonderableWeight = true;
            }

            return {
                gross,
                waste,
                price,
                netQty,
                totalCost,
                effectiveUnitPrice,
                netGrams,
                hasPonderableWeight
            };
        }

        /**
         * Calculates overall recipe financial KPIs
         */
        function computeRecipeTotals() {
            let totalCost = 0;
            let totalNetGrams = 0;
            let ponderableCount = 0;

            const enrichedIngredients = state.ingredients.map(ing => {
                const metrics = computeIngredientMetrics(ing);
                totalCost += metrics.totalCost;
                totalNetGrams += metrics.netGrams;
                if (metrics.hasPonderableWeight) ponderableCount++;
                return { ...ing, ...metrics };
            });

            const portions = Math.max(1, parseFloat(state.recipePortions) || 1);
            const targetFc = Math.min(99, Math.max(1, parseFloat(state.targetFoodCost) || 30));
            const taxPct = Math.max(0, parseFloat(state.taxRate) || 0);
            const realGrossPrice = Math.max(0, parseFloat(state.realMenuPrice) || 0);

            const costPerPortion = totalCost / portions;
            const suggestedNetPrice = costPerPortion / (targetFc / 100);
            const suggestedGrossPrice = suggestedNetPrice * (1 + taxPct / 100);

            const realNetPrice = realGrossPrice / (1 + taxPct / 100);
            const realFoodCostPct = realNetPrice > 0 ? (costPerPortion / realNetPrice) * 100 : 0;
            const grossMarginPerPortion = realNetPrice - costPerPortion;
            const totalBatchMargin = grossMarginPerPortion * portions;

            return {
                enrichedIngredients,
                totalCost,
                totalNetGrams,
                ponderableCount,
                portions,
                targetFc,
                taxPct,
                realGrossPrice,
                costPerPortion,
                suggestedNetPrice,
                suggestedGrossPrice,
                realNetPrice,
                realFoodCostPct,
                grossMarginPerPortion,
                totalBatchMargin
            };
        }

        /**
         * Generates valid, clean Markdown optimized for Obsidian (Dataview + Callouts + Markdown Tables)
         */
        function generateObsidianMarkdown(totals) {
            const sym = state.currencySymbol;
            const today = new Date().toISOString().split('T')[0];
            const title = (state.recipeName || 'Escandallo Sin Título').trim();
            const code = (state.recipeCode || 'S/C').trim();
            const category = state.recipeCategory || 'General';
            const chef = (state.recipeChef || 'Cocina').trim();
            const time = state.recipeTime || 0;

            // Parse and sanitize tags into valid YAML identifiers
            const tagsList = (state.recipeTags || 'escandallo, cocina')
                .split(',')
                .map(t => t.trim().replace(/^#/, '').replace(/\s+/g, '-').toLowerCase())
                .map(t => t.replace(/[^a-z0-9_\-\/]/gi, ''))
                .filter(Boolean);
            if (tagsList.length === 0) tagsList.push('escandallo');

            const selectedAllergens = EU_ALLERGENS
                .filter(a => state.allergens.includes(a.id))
                .map(a => `${a.icon} ${a.name}`);

            let md = '';

            // 1. YAML Frontmatter for Obsidian Properties & Dataview
            if (state.optIncludeYaml) {
                md += `---\n`;
                md += `title: "${escapeYaml(title)}"\n`;
                md += `codigo: "${escapeYaml(code)}"\n`;
                md += `tipo: escandallo\n`;
                md += `categoria: "${escapeYaml(category)}"\n`;
                md += `responsable: "${escapeYaml(chef)}"\n`;
                md += `fecha: ${today}\n`;
                md += `tiempo_min: ${time}\n`;
                md += `raciones: ${totals.portions}\n`;
                md += `coste_total: ${totals.totalCost.toFixed(2)}\n`;
                md += `coste_racion: ${totals.costPerPortion.toFixed(2)}\n`;
                md += `food_cost_objetivo: ${totals.targetFc}\n`;
                md += `food_cost_real: ${totals.realFoodCostPct.toFixed(2)}\n`;
                md += `pvp_sugerido_iva: ${totals.suggestedGrossPrice.toFixed(2)}\n`;
                md += `pvp_carta_real: ${totals.realGrossPrice.toFixed(2)}\n`;
                md += `margen_bruto_racion: ${totals.grossMarginPerPortion.toFixed(2)}\n`;
                md += `alergenos:\n`;
                if (selectedAllergens.length > 0) {
                    EU_ALLERGENS.filter(a => state.allergens.includes(a.id)).forEach(a => {
                        md += `  - "${escapeYaml(a.name)}"\n`;
                    });
                } else {
                    md += `  - "Sin alérgenos declarados"\n`;
                }
                md += `tags:\n`;
                tagsList.forEach(tag => {
                    md += `  - ${tag}\n`;
                });
                md += `---\n\n`;
            }

            // 2. Document Header
            md += `# 🍽️ ${title}\n\n`;
            md += `**Código:** \`${code}\` | **Partida:** ${category} | **Responsable:** ${chef} | **Tiempo:** ${time} min\n\n`;

            // Weight calculation formatting
            const hasPartialWeight = totals.ponderableCount < totals.enrichedIngredients.length && totals.ponderableCount > 0;
            const weightFormatted = totals.ponderableCount === 0
                ? 'N/D'
                : `${formatNumber(totals.totalNetGrams / 1000, 3)} kg${hasPartialWeight ? ' *(estimación ponderable)*' : ''}`;

            // 3. Financial Summary Block (Callout or Standard Blockquote)
            if (state.optIncludeCallouts) {
                const fcStatusCallout = totals.realFoodCostPct <= totals.targetFc ? '[!success]' : '[!warning]';
                md += `> ${fcStatusCallout} Resumen Económico y Rentabilidad (${totals.portions} raciones)\n`;
                md += `> - **Coste Total Lote:** ${formatCurrency(totals.totalCost, sym)} *(Peso neto est.: ${weightFormatted})*\n`;
                md += `> - **Coste por Ración:** **${formatCurrency(totals.costPerPortion, sym)}**\n`;
                md += `> - **PVP Sugerido (FC ${totals.targetFc}%):** ${formatCurrency(totals.suggestedNetPrice, sym)} *(sin IVA)* | **${formatCurrency(totals.suggestedGrossPrice, sym)}** *(+${totals.taxPct}% IVA)*\n`;
                md += `> - **PVP Real en Carta:** **${formatCurrency(totals.realGrossPrice, sym)}** *(Neto: ${formatCurrency(totals.realNetPrice, sym)})*\n`;
                md += `> - **Food Cost Real:** **${formatNumber(totals.realFoodCostPct, 1)}%** | **Margen Bruto / Ración:** **${formatCurrency(totals.grossMarginPerPortion, sym)}**\n\n`;
            } else {
                md += `## 📊 Resumen Económico (${totals.portions} raciones)\n\n`;
                md += `- **Coste Total Receta:** ${formatCurrency(totals.totalCost, sym)}\n`;
                md += `- **Coste por Ración:** **${formatCurrency(totals.costPerPortion, sym)}**\n`;
                md += `- **PVP Sugerido (+${totals.taxPct}% IVA):** ${formatCurrency(totals.suggestedGrossPrice, sym)}\n`;
                md += `- **PVP Carta Real:** ${formatCurrency(totals.realGrossPrice, sym)} (Food Cost Real: **${formatNumber(totals.realFoodCostPct, 1)}%**)\n`;
                md += `- **Margen Bruto por Ración:** ${formatCurrency(totals.grossMarginPerPortion, sym)}\n\n`;
            }

            // 4. Ingredients Markdown Table
            md += `## 🧾 Escandallo de Ingredientes y Mermas\n\n`;
            md += `| # | Ingrediente | Cant. Bruta | Ud | Merma % | Cant. Neta | Precio/Ud | Coste Real/Ud | Coste Total | % Coste |\n`;
            md += `|---:|:---|---:|:---:|---:|---:|---:|---:|---:|---:|\n`;

            totals.enrichedIngredients.forEach((ing, idx) => {
                const rawName = (ing.name || 'Ingrediente sin nombre').trim();
                const cleanForWiki = rawName.replace(/[\[\]|]/g, ' ').replace(/\s+/g, ' ').trim();
                const displayName = state.optWikiLinks ? `[[${cleanForWiki}]]` : escapeMdCell(rawName);
                const weightShare = totals.totalCost > 0 ? (ing.totalCost / totals.totalCost) * 100 : 0;

                md += `| ${idx + 1} | ${displayName} | ${formatNumber(ing.gross, 3)} | ${escapeMdCell(ing.unit)} | ${formatNumber(ing.waste, 1)}% | ${formatNumber(ing.netQty, 3)} | ${formatCurrency(ing.price, sym)} | ${formatCurrency(ing.effectiveUnitPrice, sym)} | **${formatCurrency(ing.totalCost, sym)}** | ${formatNumber(weightShare, 1)}% |\n`;
            });

            md += `| | **TOTALES** | | | | **${weightFormatted}** | | | **${formatCurrency(totals.totalCost, sym)}** | **100%** |\n\n`;

            // 5. Allergens Section
            if (state.optIncludeCallouts) {
                md += `> [!danger] Alérgenos Presentes (Reglamento UE 1169/2011)\n`;
                md += `> ${selectedAllergens.length > 0 ? selectedAllergens.join(' · ') : '✅ Sin alérgenos de declaración obligatoria en esta fórmula.'}\n\n`;
            } else {
                md += `## ⚠️ Alérgenos\n`;
                md += `${selectedAllergens.length > 0 ? selectedAllergens.join(', ') : 'Sin alérgenos declarados.'}\n\n`;
            }

            // 6. Culinary Instructions
            md += `## 👨‍🍳 Procedimiento de Elaboración (Mise en Place)\n\n`;
            md += `${(state.recipeSteps || 'Sin instrucciones especificadas.').trim()}\n\n`;

            md += `## 🎨 Acabado y Pase (Emplatado)\n\n`;
            md += `${(state.recipePlating || 'Sin notas de emplatado.').trim()}\n\n`;

            if ((state.recipeConservation || '').trim()) {
                if (state.optIncludeCallouts) {
                    md += `> [!info] Conservación, Vacío y Control APPCC\n`;
                    state.recipeConservation.trim().split('\n').forEach(line => {
                        md += `> ${line}\n`;
                    });
                    md += `\n`;
                } else {
                    md += `## ❄️ Conservación y APPCC\n\n${state.recipeConservation.trim()}\n\n`;
                }
            }

            return md;
        }

        /**
         * Renders the 14 EU Allergen checkboxes
         */
        function renderAllergens() {
            const container = document.getElementById('allergensContainer');
            container.innerHTML = EU_ALLERGENS.map(allergen => {
                const isChecked = state.allergens.includes(allergen.id);
                return `
                    <label class="flex items-center gap-2 p-2 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                        isChecked 
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }">
                        <input type="checkbox" data-allergen="${allergen.id}" ${isChecked ? 'checked' : ''} class="sr-only" aria-label="Alérgeno ${allergen.name}">
                        <span class="text-base leading-none">${allergen.icon}</span>
                        <span class="truncate">${allergen.name}</span>
                    </label>
                `;
            }).join('');

            container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const id = e.target.getAttribute('data-allergen');
                    if (e.target.checked) {
                        if (!state.allergens.includes(id)) state.allergens.push(id);
                    } else {
                        state.allergens = state.allergens.filter(item => item !== id);
                    }
                    renderAllergens();
                    recalculateAndSync();
                });
            });
        }

        /**
         * Renders both the desktop table and mobile cards for ingredients, keeping them synchronized
         */
        function renderIngredientsTable() {
            const tbody = document.getElementById('ingredientsTableBody');
            const mobileList = document.getElementById('ingredientsMobileList');
            tbody.innerHTML = '';
            mobileList.innerHTML = '';

            state.ingredients.forEach((ing, index) => {
                const metrics = computeIngredientMetrics(ing);
                const safeName = escapeHtml(ing.name);
                const labelName = ing.name ? safeName : `Ingrediente ${index + 1}`;

                // 1. Desktop Table Row
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/80 transition group';
                tr.dataset.id = ing.id;

                tr.innerHTML = `
                    <td class="py-3 pl-4 pr-2 font-mono text-xs sm:text-sm text-slate-400 text-center">${index + 1}</td>
                    <td class="py-3 px-3">
                        <input type="text" data-field="name" value="${safeName}" placeholder="Nombre del ingrediente..." aria-label="Nombre del ingrediente ${index + 1}" class="w-full px-3.5 py-2.5 sm:py-3 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-orange-500 rounded-xl text-sm sm:text-base font-semibold text-slate-900 focus:outline-none transition">
                    </td>
                    <td class="py-3 px-3">
                        <input type="number" data-field="grossQty" value="${ing.grossQty}" min="0" step="0.001" aria-label="Cantidad bruta de ${labelName}" class="w-full px-3 py-2.5 sm:py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-right font-mono text-sm sm:text-base font-medium focus:outline-none">
                    </td>
                    <td class="py-3 px-2">
                        <select data-field="unit" aria-label="Unidad de medida de ${labelName}" class="w-full px-2 py-2.5 sm:py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-center font-mono text-sm sm:text-base font-medium focus:outline-none">
                            <option value="kg" ${ing.unit === 'kg' ? 'selected' : ''}>kg</option>
                            <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                            <option value="L" ${ing.unit === 'L' ? 'selected' : ''}>L</option>
                            <option value="ml" ${ing.unit === 'ml' ? 'selected' : ''}>ml</option>
                            <option value="ud" ${ing.unit === 'ud' ? 'selected' : ''}>ud</option>
                            <option value="manojo" ${ing.unit === 'manojo' ? 'selected' : ''}>mjo</option>
                        </select>
                    </td>
                    <td class="py-3 px-3">
                        <input type="number" data-field="wastePct" value="${ing.wastePct}" min="0" max="99" step="0.5" aria-label="Porcentaje de merma de ${labelName}" class="w-full px-3 py-2.5 sm:py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-right font-mono text-sm sm:text-base text-amber-700 font-medium focus:outline-none">
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-sm sm:text-base text-slate-700 bg-slate-100/60 font-medium" data-cell="netQty">
                        ${formatNumber(metrics.netQty, 3)} ${ing.unit}
                    </td>
                    <td class="py-3 px-3">
                        <input type="number" data-field="unitPrice" value="${ing.unitPrice}" min="0" step="0.01" aria-label="Precio unitario de ${labelName}" class="w-full px-3 py-2.5 sm:py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-right font-mono text-sm sm:text-base font-medium focus:outline-none">
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-sm sm:text-base text-slate-600 font-medium" data-cell="effectiveUnitPrice">
                        ${formatCurrency(metrics.effectiveUnitPrice)}
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-sm sm:text-base font-bold text-slate-900 bg-orange-50/50" data-cell="totalCost">
                        ${formatCurrency(metrics.totalCost)}
                    </td>
                    <td class="py-3 pl-1 pr-4 text-center no-print">
                        <button type="button" data-action="remove" aria-label="Eliminar ${labelName}" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition" title="Eliminar ingrediente">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </td>
                `;

                // 2. Mobile Card Item
                const card = document.createElement('div');
                card.className = 'p-3.5 bg-white space-y-3';
                card.dataset.id = ing.id;

                card.innerHTML = `
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between gap-2">
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-semibold">Ingrediente #${index + 1}</span>
                            <button type="button" data-action="remove" aria-label="Eliminar ${labelName}" class="px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition flex items-center gap-1" title="Eliminar ingrediente">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                                <span>Quitar</span>
                            </button>
                        </div>
                        <input type="text" data-field="name" value="${safeName}" placeholder="Nombre del ingrediente..." aria-label="Nombre del ingrediente ${index + 1}" class="w-full min-w-0 px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none">
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Cant. Bruta</label>
                            <input type="number" data-field="grossQty" value="${ing.grossQty}" min="0" step="0.001" aria-label="Cantidad bruta" class="w-full min-w-0 px-2.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-lg font-mono text-sm text-right focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Unidad</label>
                            <select data-field="unit" aria-label="Unidad" class="w-full min-w-0 px-2.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-lg font-mono text-sm text-center focus:outline-none">
                                <option value="kg" ${ing.unit === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                                <option value="L" ${ing.unit === 'L' ? 'selected' : ''}>L</option>
                                <option value="ml" ${ing.unit === 'ml' ? 'selected' : ''}>ml</option>
                                <option value="ud" ${ing.unit === 'ud' ? 'selected' : ''}>ud</option>
                                <option value="manojo" ${ing.unit === 'manojo' ? 'selected' : ''}>mjo</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-amber-700 mb-1">Merma %</label>
                            <input type="number" data-field="wastePct" value="${ing.wastePct}" min="0" max="99" step="0.5" aria-label="Porcentaje de merma" class="w-full min-w-0 px-2.5 py-2 bg-amber-50/40 focus:bg-white border border-amber-200 focus:border-orange-500 rounded-lg font-mono text-sm text-amber-800 text-right focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Precio / Ud</label>
                            <input type="number" data-field="unitPrice" value="${ing.unitPrice}" min="0" step="0.01" aria-label="Precio unitario" class="w-full min-w-0 px-2.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-lg font-mono text-sm text-right focus:outline-none">
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                        <div class="text-slate-500">
                            Neto: <span class="font-mono font-semibold text-slate-800" data-cell="netQty">${formatNumber(metrics.netQty, 3)} ${ing.unit}</span>
                            <span class="mx-1 text-slate-300">|</span>
                            Real/Ud: <span class="font-mono text-slate-600" data-cell="effectiveUnitPrice">${formatCurrency(metrics.effectiveUnitPrice)}</span>
                        </div>
                        <div class="font-mono font-bold text-sm text-orange-700 bg-orange-50 border border-orange-200/60 px-2.5 py-1 rounded-lg ml-auto" data-cell="totalCost">
                            ${formatCurrency(metrics.totalCost)}
                        </div>
                    </div>
                `;

                // Shared input handler that updates both Desktop Row and Mobile Card simultaneously
                const bindRowEvents = (containerEl, partnerEl) => {
                    containerEl.querySelectorAll('input, select').forEach(input => {
                        input.addEventListener('input', (e) => {
                            const field = e.target.getAttribute('data-field');
                            const val = e.target.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value;
                            ing[field] = val;

                            // Sync value to partner view (mobile <-> desktop)
                            const partnerInput = partnerEl.querySelector(`[data-field="${field}"]`);
                            if (partnerInput && partnerInput !== e.target) {
                                partnerInput.value = e.target.value;
                            }

                            const updated = computeIngredientMetrics(ing);
                            [containerEl, partnerEl].forEach(view => {
                                view.querySelector('[data-cell="netQty"]').textContent = `${formatNumber(updated.netQty, 3)} ${ing.unit}`;
                                view.querySelector('[data-cell="effectiveUnitPrice"]').textContent = formatCurrency(updated.effectiveUnitPrice);
                                view.querySelector('[data-cell="totalCost"]').textContent = formatCurrency(updated.totalCost);
                            });

                            recalculateAndSync();
                        });
                    });

                    containerEl.querySelector('[data-action="remove"]').addEventListener('click', () => {
                        if (state.ingredients.length <= 1) {
                            showToast('El escandallo debe tener al menos una línea de ingrediente.', 'warning');
                            return;
                        }
                        state.ingredients = state.ingredients.filter(item => item.id !== ing.id);
                        renderIngredientsTable();
                        recalculateAndSync();
                    });
                };

                bindRowEvents(tr, card);
                bindRowEvents(card, tr);

                tbody.appendChild(tr);
                mobileList.appendChild(card);
            });
        }

        /**
         * Recalculates KPIs, updates the Markdown preview, and saves to localStorage
         */
        function recalculateAndSync() {
            const totals = computeRecipeTotals();
            const sym = state.currencySymbol;

            // Update KPI Cards
            document.getElementById('kpiTotalCost').textContent = formatCurrency(totals.totalCost, sym);
            
            // Weight calculation & indicators
            const weightKg = totals.totalNetGrams / 1000;
            const weightText = formatNumber(weightKg, 3);
            const hasNonPonderable = totals.ponderableCount < state.ingredients.length;
            let weightLabel = `Peso neto est.: ${weightText} kg`;
            if (totals.ponderableCount === 0) {
                weightLabel = 'Peso neto: N/D (insumos en ud/mjo)';
            } else if (hasNonPonderable) {
                weightLabel = `Peso neto est.: ${weightText} kg*`;
            }
            const kpiWeightEl = document.getElementById('kpiTotalWeight');
            kpiWeightEl.textContent = weightLabel;
            kpiWeightEl.title = hasNonPonderable
                ? 'Los ingredientes en unidades o manojos no se suman al peso en kilogramos.'
                : '';

            document.getElementById('kpiPortionCost').textContent = formatCurrency(totals.costPerPortion, sym);
            document.getElementById('kpiPortionsLabel').textContent = `Para ${totals.portions} ${totals.portions === 1 ? 'ración' : 'raciones'}`;

            document.getElementById('kpiSuggestedNet').textContent = formatCurrency(totals.suggestedNetPrice, sym);
            document.getElementById('kpiTargetFcLabel').textContent = `Según Food Cost ${totals.targetFc}%`;

            document.getElementById('kpiTaxBadge').textContent = `+${totals.taxPct}% IVA`;
            document.getElementById('kpiSuggestedGross').textContent = formatCurrency(totals.suggestedGrossPrice, sym);

            // Real Food Cost status coloring
            const fcEl = document.getElementById('kpiRealFoodCost');
            const fcDot = document.getElementById('kpiFcStatusDot');
            const fcHint = document.getElementById('kpiRealFcHint');
            fcEl.textContent = `${formatNumber(totals.realFoodCostPct, 1)}%`;

            if (totals.realFoodCostPct <= totals.targetFc) {
                fcEl.className = 'text-xl sm:text-2xl font-bold font-mono text-emerald-600';
                fcDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
                fcHint.textContent = 'Óptimo (Dentro de objetivo)';
            } else if (totals.realFoodCostPct <= totals.targetFc + 5) {
                fcEl.className = 'text-xl sm:text-2xl font-bold font-mono text-amber-600';
                fcDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500';
                fcHint.textContent = 'Atención (Ligeramente alto)';
            } else {
                fcEl.className = 'text-xl sm:text-2xl font-bold font-mono text-rose-600';
                fcDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500';
                fcHint.textContent = 'Alerta (Desviación crítica)';
            }

            document.getElementById('kpiGrossMargin').textContent = formatCurrency(totals.grossMarginPerPortion, sym);
            document.getElementById('kpiTotalBatchMargin').textContent = `Lote total: ${formatCurrency(totals.totalBatchMargin, sym)}`;

            // Update Table Footer
            document.getElementById('tableTotalNetWeight').textContent = totals.ponderableCount === 0
                ? 'N/D'
                : `${weightText} kg${hasNonPonderable ? '*' : ''}`;
            document.getElementById('tableTotalCost').textContent = formatCurrency(totals.totalCost, sym);

            // Persist state (Markdown preview removed to maximize editing space)

            // Persist in LocalStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                // Ignore storage quota errors in restricted frames
            }
        }

        function slugifyFilename(text) {
            return text
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'escandallo-cocina';
        }

        /**
         * Syncs state values into the DOM form inputs
         */
        function populateFormInputs() {
            document.getElementById('recipeName').value = state.recipeName || '';
            document.getElementById('recipeCode').value = state.recipeCode || '';
            document.getElementById('recipeCategory').value = state.recipeCategory || 'Plato Principal - Carnes';
            document.getElementById('recipeChef').value = state.recipeChef || '';
            document.getElementById('recipeTime').value = state.recipeTime || 0;
            document.getElementById('recipeTags').value = state.recipeTags || '';
            document.getElementById('recipePortions').value = state.recipePortions || 1;
            document.getElementById('targetFoodCost').value = state.targetFoodCost || 30;
            document.getElementById('taxRate').value = String(state.taxRate ?? 10);
            document.getElementById('realMenuPrice').value = state.realMenuPrice || 0;
            document.getElementById('currencySymbol').value = state.currencySymbol || '€';

            document.getElementById('optIncludeYaml').checked = state.optIncludeYaml !== false;
            document.getElementById('optIncludeCallouts').checked = state.optIncludeCallouts !== false;
            document.getElementById('optWikiLinks').checked = state.optWikiLinks !== false;

            document.getElementById('recipeSteps').value = state.recipeSteps || '';
            document.getElementById('recipePlating').value = state.recipePlating || '';
            document.getElementById('recipeConservation').value = state.recipeConservation || '';

            renderAllergens();
            renderIngredientsTable();
            recalculateAndSync();
        }

        /**
         * Downloads or saves the generated Markdown as a .md file for Obsidian.
         * Prompts the user to pick the destination folder/file using the native File System Access API.
         */
        async function downloadMarkdownFile() {
            const totals = computeRecipeTotals();
            const mdContent = generateObsidianMarkdown(totals);
            const filename = `${slugifyFilename(state.recipeName || 'escandallo')}.md`;

            // 1. Si se sirve desde el servidor local (just serve), invocar /api/save para
            // abrir el selector nativo del sistema operativo (Zenity / GTK / Tkinter).
            if (window.location.protocol.startsWith('http')) {
                try {
                    const resp = await fetch('/api/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename, content: mdContent })
                    });
                    if (resp.ok) {
                        const result = await resp.json();
                        if (result.cancelled) {
                            return; // El usuario canceló el diálogo en el sistema
                        }
                        if (result.ok && result.path) {
                            showToast(`Ficha guardada con éxito en: ${result.path}`, 'success');
                            return;
                        }
                    }
                } catch (e) {
                    // Si el servidor local no tiene /api/save o da error de red, continuar con métodos del navegador
                }
            }

            // 2. File System Access API del navegador (Chrome / Edge en orígenes seguros)
            const isFileOrigin = window.location.protocol === 'file:' || !window.isSecureContext;
            if (!isFileOrigin && typeof window.showSaveFilePicker === 'function') {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [
                            {
                                description: 'Documento Markdown de Obsidian (*.md)',
                                accept: {
                                    'text/markdown': ['.md'],
                                },
                            },
                        ],
                    });
                    const writableStream = await fileHandle.createWritable();
                    await writableStream.write(mdContent);
                    await writableStream.close();
                    showToast(`Ficha guardada con éxito como "${fileHandle.name}".`, 'success');
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') {
                        return; // El usuario canceló el diálogo del selector de carpetas
                    }
                    console.warn('showSaveFilePicker no disponible o denegado, usando descarga estándar:', err);
                }
            }

            // 3. Fallback estándar para protocolo file:/// o navegadores sin File System Access API
            const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (isFileOrigin) {
                showToast(`Archivo "${filename}" descargado. (Para seleccionar carpeta con el diálogo del sistema, ejecuta "just serve").`, 'success');
            } else {
                showToast(`Archivo "${filename}" descargado.`, 'success');
            }
        }

        /**
         * Copies the generated Markdown to the clipboard using modern Async API with graceful fallback
         */
        async function copyMarkdownToClipboard() {
            const totals = computeRecipeTotals();
            const mdContent = generateObsidianMarkdown(totals);

            // Modern asynchronous Clipboard API
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                try {
                    await navigator.clipboard.writeText(mdContent);
                    showToast('Markdown copiado al portapapeles. Pégalo directamente en Obsidian.', 'success');
                    return;
                } catch (err) {
                    // Fallback to legacy execCommand if clipboard permissions reject
                }
            }

            // Fallback for restricted contexts / iframe / legacy WebViews
            const textarea = document.createElement('textarea');
            textarea.value = mdContent;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            textarea.setAttribute('readonly', '');
            document.body.appendChild(textarea);
            textarea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showToast('Markdown copiado al portapapeles. Pégalo directamente en Obsidian.', 'success');
                } else {
                    showToast('No se pudo copiar automáticamente. Selecciona el texto de la vista previa.', 'warning');
                }
            } catch (err) {
                showToast('No se pudo copiar automáticamente. Selecciona el texto de la vista previa.', 'warning');
            } finally {
                document.body.removeChild(textarea);
            }
        }

        /**
         * Displays a non-intrusive toast notification
         */
        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            const bgClass = type === 'success' 
                ? 'bg-slate-900 text-white border-violet-500' 
                : 'bg-amber-900 text-amber-100 border-amber-500';

            toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border-l-4 text-xs sm:text-sm font-medium transition-all duration-300 ${bgClass}`;
            toast.innerHTML = `
                <span class="text-base">${type === 'success' ? '✨' : '⚠️'}</span>
                <span>${escapeHtml(message)}</span>
            `;

            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(8px)';
                setTimeout(() => toast.remove(), 300);
            }, 3200);
        }

        function initApp() {
            // Load saved state from localStorage if available
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.ingredients)) {
                        state = { ...getDemoState(), ...parsed };
                    }
                }
            } catch (e) {
                state = getDemoState();
            }

            populateFormInputs();

            // Bind Top-Level Input Listeners
            const textInputs = [
                'recipeName', 'recipeCode', 'recipeCategory', 'recipeChef',
                'recipeTags', 'currencySymbol', 'recipeSteps', 'recipePlating', 'recipeConservation'
            ];
            textInputs.forEach(id => {
                document.getElementById(id).addEventListener('input', (e) => {
                    state[id] = e.target.value;
                    if (id === 'currencySymbol') renderIngredientsTable();
                    recalculateAndSync();
                });
            });

            const numInputs = ['recipeTime', 'recipePortions', 'targetFoodCost', 'taxRate', 'realMenuPrice'];
            numInputs.forEach(id => {
                document.getElementById(id).addEventListener('input', (e) => {
                    state[id] = parseFloat(e.target.value) || 0;
                    recalculateAndSync();
                });
            });

            // Obsidian Format Checkboxes
            ['optIncludeYaml', 'optIncludeCallouts', 'optWikiLinks'].forEach(id => {
                document.getElementById(id).addEventListener('change', (e) => {
                    state[id] = e.target.checked;
                    recalculateAndSync();
                });
            });

            // Helper function to add a new empty ingredient and focus it on active viewport
            const addEmptyIngredientLine = () => {
                state.ingredients.push({
                    id: generateId(),
                    name: '',
                    grossQty: 0.100,
                    unit: 'kg',
                    wastePct: 0,
                    unitPrice: 0.00
                });
                renderIngredientsTable();
                recalculateAndSync();

                const isMobile = window.innerWidth < 768;
                const selector = isMobile
                    ? '#ingredientsMobileList input[data-field="name"]'
                    : '#ingredientsTableBody input[data-field="name"]';
                const inputs = document.querySelectorAll(selector);
                if (inputs.length > 0) {
                    inputs[inputs.length - 1].focus();
                    inputs[inputs.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };

            document.getElementById('btnAddIngredient').addEventListener('click', addEmptyIngredientLine);
            document.getElementById('btnMobileAddIng').addEventListener('click', addEmptyIngredientLine);

            // Quick Ingredient Selector
            document.getElementById('quickIngredientSelect').addEventListener('change', (e) => {
                if (!e.target.value) return;
                const [name, unit, grossQty, wastePct, unitPrice] = e.target.value.split('|');
                state.ingredients.push({
                    id: generateId(),
                    name,
                    unit,
                    grossQty: parseFloat(grossQty),
                    wastePct: parseFloat(wastePct),
                    unitPrice: parseFloat(unitPrice)
                });
                e.target.value = '';
                renderIngredientsTable();
                recalculateAndSync();
                showToast(`Insumo "${name}" añadido al escandallo.`);
            });

            // Load Demo Button
            document.getElementById('btnLoadDemo').addEventListener('click', () => {
                state = getDemoState();
                populateFormInputs();
                showToast('Receta de demostración profesional cargada.');
            });

            // Clear All Modal Handlers
            const clearModal = document.getElementById('clearModal');
            document.getElementById('btnClearAll').addEventListener('click', () => {
                clearModal.classList.remove('hidden');
                clearModal.classList.add('flex');
            });
            document.getElementById('btnCancelClear').addEventListener('click', () => {
                clearModal.classList.add('hidden');
                clearModal.classList.remove('flex');
            });
            document.getElementById('btnConfirmClear').addEventListener('click', () => {
                state = {
                    recipeName: '',
                    recipeCode: 'ESC-001',
                    recipeCategory: 'Plato Principal - Carnes',
                    recipeChef: '',
                    recipeTime: 30,
                    recipeTags: 'escandallo, cocina',
                    recipePortions: 4,
                    targetFoodCost: 30,
                    taxRate: 10,
                    realMenuPrice: 0,
                    currencySymbol: '€',
                    optIncludeYaml: true,
                    optIncludeCallouts: true,
                    optWikiLinks: true,
                    allergens: [],
                    ingredients: [
                        { id: generateId(), name: '', grossQty: 1.000, unit: 'kg', wastePct: 0, unitPrice: 0 }
                    ],
                    recipeSteps: '',
                    recipePlating: '',
                    recipeConservation: ''
                };
                populateFormInputs();
                clearModal.classList.add('hidden');
                clearModal.classList.remove('flex');
                showToast('Formulario reiniciado para nuevo escandallo.');
            });

            // Download & Copy Buttons (direct event listeners to preserve trusted user gestures)
            ['btnDownloadMd', 'btnDownloadMdToolbar', 'btnMobileDownloadMd'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', downloadMarkdownFile);
            });
            ['btnCopyMdHeader', 'btnCopyMdToolbar', 'btnMobileCopyMd'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', copyMarkdownToClipboard);
            });
        }

        window.addEventListener('DOMContentLoaded', initApp);
