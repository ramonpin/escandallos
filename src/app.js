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
         * Decimales visibles para los campos numéricos de los ingredientes.
         * Se usan tanto al renderizar como al formatear tras editar.
         */
        const INGREDIENT_FIELD_DECIMALS = { grossQty: 3, wastePct: 1, unitPrice: 4 };

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
         * Capitalización de nombres con la misma lógica que el editor de despensa:
         * formato título respetando artículos, conjunciones y preposiciones menores.
         */
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

        /**
         * Default Demo Recipe (Carrillera Ibérica al Oporto)
         */
        function getDemoState() {
            const demo = {
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

            return {
                ...demo,
                recipeName: formatTitleCase(demo.recipeName),
                ingredients: demo.ingredients.map(ing => ({ ...ing, name: formatTitleCase(ing.name) }))
            };
        }

        let state = getDemoState();

        /**
         * Formats a number with Spanish locale formatting
         */
        function formatNumber(num, decimals = 2) {
            const val = typeof num === 'number' ? num : parseLocaleFloat(num);
            if (!Number.isFinite(val)) {
                return (0).toLocaleString('es-ES', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                });
            }
            return val.toLocaleString('es-ES', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        function formatCurrency(num, symbol = state.currencySymbol) {
            return `${formatNumber(num, 2)} ${symbol}`;
        }

        /**
         * Precio unitario de compra: se muestra y exporta con cuatro decimales.
         * El resto de importes (coste real, coste total, PVP, márgenes) usan dos.
         */
        function formatUnitPrice(num, symbol = state.currencySymbol) {
            return `${formatNumber(num, INGREDIENT_FIELD_DECIMALS.unitPrice)} ${symbol}`;
        }

        function roundTo(value, decimals) {
            const num = typeof value === 'number' ? value : parseLocaleFloat(value);
            if (!Number.isFinite(num)) return 0;
            const factor = Math.pow(10, decimals);
            return Math.round((num + Number.EPSILON) * factor) / factor;
        }

        /**
         * Parses a numeric value from Spanish or standard locale string safely
         */
        function parseLocaleFloat(val) {
            if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
            if (!val) return 0;
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

        /**
         * Calculates individual ingredient row metrics:
         * - Net Quantity = Gross Quantity * (1 - Waste% / 100)
         * - Line Cost = Gross Quantity * Unit Purchase Price
         * - Effective Price per Net Unit = Unit Purchase Price / (1 - Waste% / 100)
         */
        function computeIngredientMetrics(ing) {
            const gross = Math.max(0, parseLocaleFloat(ing.grossQty) || 0);
            const waste = Math.min(99.9, Math.max(0, parseLocaleFloat(ing.wastePct) || 0));
            const price = Math.max(0, parseLocaleFloat(ing.unitPrice) || 0);
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
        function computeRecipeTotals(targetState = state) {
            let totalCost = 0;
            let totalNetGrams = 0;
            let ponderableCount = 0;

            const enrichedIngredients = (targetState.ingredients || []).map(ing => {
                const metrics = computeIngredientMetrics(ing);
                totalCost += metrics.totalCost;
                totalNetGrams += metrics.netGrams;
                if (metrics.hasPonderableWeight) ponderableCount++;
                return { ...ing, ...metrics };
            });

            const portions = Math.max(1, parseLocaleFloat(targetState.recipePortions) || 1);
            const targetFc = Math.min(99, Math.max(1, parseLocaleFloat(targetState.targetFoodCost) || 30));
            const taxPct = Math.max(0, parseLocaleFloat(targetState.taxRate) || 0);
            const realGrossPrice = Math.max(0, parseLocaleFloat(targetState.realMenuPrice) || 0);

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
        function generateObsidianMarkdown(totals, targetState = state) {
            const sym = targetState.currencySymbol || '€';
            const today = new Date().toISOString().split('T')[0];
            const title = (targetState.recipeName || 'Escandallo Sin Título').trim();
            const code = (targetState.recipeCode || 'S/C').trim();
            const category = targetState.recipeCategory || 'General';
            const chef = (targetState.recipeChef || 'Cocina').trim();
            const time = targetState.recipeTime || 0;

            // Parse and sanitize tags into valid YAML identifiers
            const tagsList = (targetState.recipeTags || 'escandallo, cocina')
                .split(',')
                .map(t => t.trim().replace(/^#/, '').replace(/\s+/g, '-').toLowerCase())
                .map(t => t.replace(/[^a-z0-9_\-\/]/gi, ''))
                .filter(Boolean);
            if (tagsList.length === 0) tagsList.push('escandallo');

            const selectedAllergens = EU_ALLERGENS
                .filter(a => (targetState.allergens || []).includes(a.id))
                .map(a => `${a.icon} ${a.name}`);

            let md = '';

            // 1. YAML Frontmatter for Obsidian Properties & Dataview
            if (targetState.optIncludeYaml) {
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
                    EU_ALLERGENS.filter(a => (targetState.allergens || []).includes(a.id)).forEach(a => {
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
            if (targetState.optIncludeCallouts) {
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
                const displayName = targetState.optWikiLinks ? `[[${cleanForWiki}]]` : escapeMdCell(rawName);
                const weightShare = totals.totalCost > 0 ? (ing.totalCost / totals.totalCost) * 100 : 0;

                md += `| ${idx + 1} | ${displayName} | ${formatNumber(ing.gross, 3)} | ${escapeMdCell(ing.unit)} | ${formatNumber(ing.waste, 1)}% | ${formatNumber(ing.netQty, 3)} | ${formatUnitPrice(ing.price, sym)} | ${formatCurrency(ing.effectiveUnitPrice, sym)} | **${formatCurrency(ing.totalCost, sym)}** | ${formatNumber(weightShare, 1)}% |\n`;
            });

            md += `| | **TOTALES** | | | | **${weightFormatted}** | | | **${formatCurrency(totals.totalCost, sym)}** | **100%** |\n\n`;

            // 5. Allergens Section
            if (targetState.optIncludeCallouts) {
                md += `> [!danger] Alérgenos Presentes (Reglamento UE 1169/2011)\n`;
                md += `> ${selectedAllergens.length > 0 ? selectedAllergens.join(' · ') : '✅ Sin alérgenos de declaración obligatoria en esta fórmula.'}\n\n`;
            } else {
                md += `## ⚠️ Alérgenos\n`;
                md += `${selectedAllergens.length > 0 ? selectedAllergens.join(', ') : 'Sin alérgenos declarados.'}\n\n`;
            }

            // 6. Culinary Instructions
            md += `## 👨‍🍳 Procedimiento de Elaboración (Mise en Place)\n\n`;
            md += `${(targetState.recipeSteps || 'Sin instrucciones especificadas.').trim()}\n\n`;

            md += `## 🎨 Acabado y Pase (Emplatado)\n\n`;
            md += `${(targetState.recipePlating || 'Sin notas de emplatado.').trim()}\n\n`;

            if ((targetState.recipeConservation || '').trim()) {
                if (targetState.optIncludeCallouts) {
                    md += `> [!info] Conservación, Vacío y Control APPCC\n`;
                    targetState.recipeConservation.trim().split('\n').forEach(line => {
                        md += `> ${line}\n`;
                    });
                    md += `\n`;
                } else {
                    md += `## ❄️ Conservación y APPCC\n\n${targetState.recipeConservation.trim()}\n\n`;
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
                            ? 'bg-[#3d2410] border-amber-400 text-amber-200 shadow-sm' 
                            : 'bg-[#141218] border-[#33303a] text-[#cac4d0] hover:bg-[#24222a] hover:text-[#e6e1e5]'
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
                tr.className = 'hover:bg-[#25222c]/60 transition group';
                tr.dataset.id = ing.id;

                tr.innerHTML = `
                    <td class="py-3 pl-4 pr-2 font-mono text-xs sm:text-sm text-[#79747e] text-center">${index + 1}</td>
                    <td class="py-3 px-3">
                        <input type="text" data-field="name" value="${safeName}" placeholder="Nombre del ingrediente..." aria-label="Nombre del ingrediente ${index + 1}" class="w-full px-3.5 py-2.5 sm:py-3 bg-transparent hover:bg-[#141218] focus:bg-[#141218] border border-transparent hover:border-[#3e3c46] focus:border-amber-400 rounded-xl text-sm sm:text-base font-semibold text-[#f3eff4] placeholder-[#79747e] focus:outline-none transition">
                    </td>
                    <td class="py-3 px-3">
                        <input type="text" inputmode="decimal" data-field="grossQty" value="${formatNumber(ing.grossQty, INGREDIENT_FIELD_DECIMALS.grossQty)}" aria-label="Cantidad bruta de ${labelName}" class="w-full px-3 py-2.5 sm:py-3 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-xl text-right font-mono text-sm sm:text-base font-medium text-[#f3eff4] focus:outline-none">
                    </td>
                    <td class="py-3 px-2">
                        <select data-field="unit" aria-label="Unidad de medida de ${labelName}" class="w-full px-2 py-2.5 sm:py-3 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-xl text-center font-mono text-sm sm:text-base font-medium text-[#f3eff4] focus:outline-none">
                            <option value="kg" ${ing.unit === 'kg' ? 'selected' : ''}>kg</option>
                            <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                            <option value="L" ${ing.unit === 'L' ? 'selected' : ''}>L</option>
                            <option value="ml" ${ing.unit === 'ml' ? 'selected' : ''}>ml</option>
                            <option value="ud" ${ing.unit === 'ud' ? 'selected' : ''}>ud</option>
                            <option value="manojo" ${ing.unit === 'manojo' ? 'selected' : ''}>mjo</option>
                        </select>
                    </td>
                    <td class="py-3 px-3">
                        <input type="text" inputmode="decimal" data-field="wastePct" value="${formatNumber(ing.wastePct, INGREDIENT_FIELD_DECIMALS.wastePct)}" aria-label="Porcentaje de merma de ${labelName}" class="w-full px-3 py-2.5 sm:py-3 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-xl text-right font-mono text-sm sm:text-base text-amber-300 font-medium focus:outline-none">
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-sm sm:text-base text-[#cac4d0] bg-[#17151c] font-medium" data-cell="netQty">
                        ${formatNumber(metrics.netQty, 3)} ${ing.unit}
                    </td>
                    <td class="py-3 px-3">
                        <input type="text" inputmode="decimal" data-field="unitPrice" value="${formatNumber(ing.unitPrice, INGREDIENT_FIELD_DECIMALS.unitPrice)}" aria-label="Precio unitario de ${labelName}" class="w-full px-3 py-2.5 sm:py-3 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-xl text-right font-mono text-sm sm:text-base font-medium text-[#f3eff4] focus:outline-none">
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-sm sm:text-base text-[#938f99] font-medium" data-cell="effectiveUnitPrice">
                        ${formatCurrency(metrics.effectiveUnitPrice)}
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-sm sm:text-base font-bold text-amber-300 bg-[#2a1d12]/40" data-cell="totalCost">
                        ${formatCurrency(metrics.totalCost)}
                    </td>
                    <td class="py-3 pl-1 pr-4 text-center no-print">
                        <button type="button" data-action="remove" aria-label="Eliminar ${labelName}" class="p-2 text-[#79747e] hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition" title="Eliminar ingrediente">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </td>
                `;

                // 2. Mobile Card Item
                const card = document.createElement('div');
                card.className = 'p-3.5 bg-[#1e1b24] space-y-3';
                card.dataset.id = ing.id;

                card.innerHTML = `
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between gap-2">
                            <span class="px-2 py-0.5 rounded-md bg-[#282630] text-[#cac4d0] font-mono text-xs font-semibold">Ingrediente #${index + 1}</span>
                            <button type="button" data-action="remove" aria-label="Eliminar ${labelName}" class="px-2 py-1 text-xs font-medium text-rose-400 hover:bg-rose-950/40 active:bg-rose-900/60 rounded-lg transition flex items-center gap-1" title="Eliminar ingrediente">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                                <span>Quitar</span>
                            </button>
                        </div>
                        <input type="text" data-field="name" value="${safeName}" placeholder="Nombre del ingrediente..." aria-label="Nombre del ingrediente ${index + 1}" class="w-full min-w-0 px-3 py-2 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-xl text-sm font-semibold text-[#f3eff4] focus:outline-none">
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-[#938f99] mb-1">Cant. Bruta</label>
                            <input type="text" inputmode="decimal" data-field="grossQty" value="${formatNumber(ing.grossQty, INGREDIENT_FIELD_DECIMALS.grossQty)}" aria-label="Cantidad bruta" class="w-full min-w-0 px-2.5 py-2 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-lg font-mono text-sm text-[#f3eff4] text-right focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-[#938f99] mb-1">Unidad</label>
                            <select data-field="unit" aria-label="Unidad" class="w-full min-w-0 px-2.5 py-2 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-lg font-mono text-sm text-[#f3eff4] text-center focus:outline-none">
                                <option value="kg" ${ing.unit === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="g" ${ing.unit === 'g' ? 'selected' : ''}>g</option>
                                <option value="L" ${ing.unit === 'L' ? 'selected' : ''}>L</option>
                                <option value="ml" ${ing.unit === 'ml' ? 'selected' : ''}>ml</option>
                                <option value="ud" ${ing.unit === 'ud' ? 'selected' : ''}>ud</option>
                                <option value="manojo" ${ing.unit === 'manojo' ? 'selected' : ''}>mjo</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-amber-400 mb-1">Merma %</label>
                            <input type="text" inputmode="decimal" data-field="wastePct" value="${formatNumber(ing.wastePct, INGREDIENT_FIELD_DECIMALS.wastePct)}" aria-label="Porcentaje de merma" class="w-full min-w-0 px-2.5 py-2 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-lg font-mono text-sm text-amber-300 text-right focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold uppercase text-[#938f99] mb-1">Precio / Ud</label>
                            <input type="text" inputmode="decimal" data-field="unitPrice" value="${formatNumber(ing.unitPrice, INGREDIENT_FIELD_DECIMALS.unitPrice)}" aria-label="Precio unitario" class="w-full min-w-0 px-2.5 py-2 bg-[#141218] focus:bg-[#191720] border border-[#33303a] focus:border-amber-400 rounded-lg font-mono text-sm text-[#f3eff4] text-right focus:outline-none">
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#2d2b35] text-xs">
                        <div class="text-[#938f99]">
                            Neto: <span class="font-mono font-semibold text-[#e6e1e5]" data-cell="netQty">${formatNumber(metrics.netQty, 3)} ${ing.unit}</span>
                            <span class="mx-1 text-[#49454f]">|</span>
                            Real/Ud: <span class="font-mono text-[#cac4d0]" data-cell="effectiveUnitPrice">${formatCurrency(metrics.effectiveUnitPrice)}</span>
                        </div>
                        <div class="font-mono font-bold text-sm text-amber-300 bg-[#3a2210] border border-amber-500/40 px-2.5 py-1 rounded-lg ml-auto" data-cell="totalCost">
                            ${formatCurrency(metrics.totalCost)}
                        </div>
                    </div>
                `;

                // Shared input handler that updates both Desktop Row and Mobile Card simultaneously
                const bindRowEvents = (containerEl, partnerEl) => {
                    containerEl.querySelectorAll('input, select').forEach(input => {
                        const field = input.getAttribute('data-field');
                        const isNumericField = INGREDIENT_FIELD_DECIMALS[field] !== undefined;

                        input.addEventListener('input', (e) => {
                            const val = isNumericField ? parseLocaleFloat(e.target.value) : e.target.value;
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

                        // Mostrar los campos numéricos con coma decimal española al confirmar el valor
                        if (isNumericField) {
                            const formatNumericField = (e) => {
                                const formatted = formatNumber(parseLocaleFloat(e.target.value), INGREDIENT_FIELD_DECIMALS[field]);
                                ing[field] = parseLocaleFloat(formatted);
                                e.target.value = formatted;
                                const partnerInput = partnerEl.querySelector(`[data-field="${field}"]`);
                                if (partnerInput && partnerInput !== e.target) {
                                    partnerInput.value = formatted;
                                }
                            };
                            input.addEventListener('blur', formatNumericField);
                            input.addEventListener('change', formatNumericField);
                        }

                        // Aplicar la misma capitalización tipo título que en la despensa.
                        if (field === 'name') {
                            const formatNameField = (e) => {
                                const formatted = formatTitleCase(e.target.value);
                                ing.name = formatted;
                                e.target.value = formatted;
                                const partnerInput = partnerEl.querySelector('[data-field="name"]');
                                if (partnerInput && partnerInput !== e.target) {
                                    partnerInput.value = formatted;
                                }
                                recalculateAndSync();
                            };
                            input.addEventListener('blur', formatNameField);
                            input.addEventListener('change', formatNameField);
                        }
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
                fcEl.className = 'text-xl sm:text-2xl font-bold font-mono text-emerald-400';
                fcDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
                fcHint.textContent = 'Óptimo (Dentro de objetivo)';
            } else if (totals.realFoodCostPct <= totals.targetFc + 5) {
                fcEl.className = 'text-xl sm:text-2xl font-bold font-mono text-amber-400';
                fcDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
                fcHint.textContent = 'Atención (Ligeramente alto)';
            } else {
                fcEl.className = 'text-xl sm:text-2xl font-bold font-mono text-rose-400';
                fcDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-400';
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
            document.getElementById('targetFoodCost').value = formatNumber(state.targetFoodCost || 30, 1);
            document.getElementById('taxRate').value = String(state.taxRate ?? 10);
            document.getElementById('realMenuPrice').value = formatNumber(state.realMenuPrice || 0, 2);
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

            // La File System Access API (showSaveFilePicker) está restringida por la política de
            // seguridad de los navegadores en URLs con protocolo "file:///". Solo se permite en
            // orígenes seguros o locales (http://localhost o https://).
            const isFileOrigin = window.location.protocol === 'file:' || !window.isSecureContext;

            // 1. Selector de ficheros del sistema nativo (disponible en localhost / HTTPS)
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

            // 2. Fallback estándar para protocolo file:/// o navegadores sin File System Access API
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
                showToast(`Archivo "${filename}" descargado. (Bajo HTTPS o en Chromium podrás elegir carpeta con el selector del sistema).`, 'success');
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
         * Parses an exported Obsidian Markdown escandallo file and converts it into application state
         */
        function parseMarkdownEscandallo(content) {
            if (!content || typeof content !== 'string') return null;

            let frontmatter = null;
            let body = content;

            const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
            const hasYaml = !!fmMatch;
            const yamlData = {};

            if (fmMatch) {
                frontmatter = fmMatch[1];
                body = content.slice(fmMatch[0].length);

                const lines = frontmatter.split(/\r?\n/);
                let currentKey = null;

                lines.forEach(line => {
                    const listMatch = line.match(/^\s*-\s+(.*)$/);
                    if (listMatch && currentKey) {
                        let val = listMatch[1].trim();
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.slice(1, -1);
                        }
                        if (!Array.isArray(yamlData[currentKey])) yamlData[currentKey] = [];
                        yamlData[currentKey].push(val);
                        return;
                    }

                    const kvMatch = line.match(/^([a-z0-9_]+)\s*:\s*(.*)$/i);
                    if (kvMatch) {
                        currentKey = kvMatch[1].trim();
                        let val = kvMatch[2].trim();
                        if (val === '') {
                            yamlData[currentKey] = [];
                        } else {
                            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.slice(1, -1);
                            }
                            yamlData[currentKey] = val;
                        }
                    }
                });
            }

            // Extracción de título de la receta
            let recipeName = yamlData.title;
            if (!recipeName) {
                const titleMatch = body.match(/^#\s*(?:🍽️\s*)?(.*?)$/m);
                if (titleMatch) recipeName = titleMatch[1].trim();
            }

            // Metadatos generales
            let recipeCode = yamlData.codigo;
            let recipeCategory = yamlData.categoria;
            let recipeChef = yamlData.responsable;
            let recipeTime = yamlData.tiempo_min !== undefined ? parseInt(yamlData.tiempo_min, 10) : undefined;

            const codeMatch = body.match(/\*\*Código:\*\*\s*`?([^`|\n]+)`?/i);
            if (!recipeCode && codeMatch) recipeCode = codeMatch[1].trim();

            const catMatch = body.match(/\*\*Partida:\*\*\s*([^|\n]+)/i);
            if (!recipeCategory && catMatch) recipeCategory = catMatch[1].trim();

            const chefMatch = body.match(/\*\*Responsable:\*\*\s*([^|\n]+)/i);
            if (!recipeChef && chefMatch) recipeChef = chefMatch[1].trim();

            const timeMatch = body.match(/\*\*Tiempo:\*\*\s*(\d+)/i);
            if (recipeTime === undefined && timeMatch) recipeTime = parseInt(timeMatch[1], 10);

            // Parámetros de escandallo y costes
            let recipePortions = yamlData.raciones !== undefined ? parseInt(yamlData.raciones, 10) : undefined;
            if (recipePortions === undefined) {
                const portionsMatch = body.match(/Resumen Económico.*?\((\d+)\s*raciones\)/i);
                if (portionsMatch) recipePortions = parseInt(portionsMatch[1], 10);
            }

            let targetFoodCost = yamlData.food_cost_objetivo !== undefined ? parseLocaleFloat(yamlData.food_cost_objetivo) : undefined;
            if (targetFoodCost === undefined) {
                const fcMatch = body.match(/(?:Food Cost|FC)\s*(\d+(?:[.,]\d+)?)\s*%/i);
                if (fcMatch) targetFoodCost = parseLocaleFloat(fcMatch[1]);
            }

            let taxRate = undefined;
            const taxMatch = body.match(/\+(\d+(?:[.,]\d+)?)\s*%\s*IVA/i);
            if (taxMatch) taxRate = parseLocaleFloat(taxMatch[1]);

            let realMenuPrice = yamlData.pvp_carta_real !== undefined ? parseLocaleFloat(yamlData.pvp_carta_real) : undefined;
            if (realMenuPrice === undefined) {
                const rmpMatch = body.match(/PVP (?:Real en Carta|Carta Real|Carta):.*?\*?([0-9.,]+)/i);
                if (rmpMatch) realMenuPrice = parseLocaleFloat(rmpMatch[1]);
            }

            // Etiquetas
            let recipeTags = undefined;
            if (Array.isArray(yamlData.tags) && yamlData.tags.length > 0) {
                recipeTags = yamlData.tags.join(', ');
            }

            // Tabla de ingredientes
            const ingredients = [];
            const lines = body.split(/\r?\n/);
            let inTable = false;
            let detectedCurrency = null;
            let hasWikiLinks = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line.startsWith('|')) {
                    if (inTable && ingredients.length > 0) inTable = false;
                    continue;
                }

                const rawCells = line.split('|').map(c => c.trim());
                const row = rawCells.filter((_, idx) => idx > 0 && idx < rawCells.length - 1);
                if (row.length < 8) continue;

                if (row[0].includes('---') || row[1].toLowerCase().includes('ingrediente')) {
                    inTable = true;
                    continue;
                }

                if (row.some(c => c.toUpperCase().includes('TOTAL'))) {
                    continue;
                }

                inTable = true;

                let rawName = row[1] || '';
                if (rawName.includes('[[')) {
                    hasWikiLinks = true;
                    rawName = rawName.replace(/\[\[(.*?)\]\]/g, '$1');
                }
                const name = formatTitleCase(rawName.replace(/\*\*/g, '').trim());
                const grossQty = parseLocaleFloat(row[2]);
                const unit = (row[3] || 'kg').replace(/[`*]/g, '').trim();
                const wastePct = parseLocaleFloat(row[4]);

                const priceCell = row[6] || '';
                const currMatch = priceCell.match(/([€$£¥])|([A-Z]{3})/);
                if (currMatch && !detectedCurrency) {
                    detectedCurrency = currMatch[0];
                }
                const unitPrice = parseLocaleFloat(priceCell);

                if (name || grossQty > 0 || unitPrice > 0) {
                    ingredients.push({
                        id: generateId(),
                        name,
                        grossQty: grossQty || 0.1,
                        unit: unit || 'kg',
                        wastePct: wastePct || 0,
                        unitPrice: roundTo(unitPrice || 0, INGREDIENT_FIELD_DECIMALS.unitPrice)
                    });
                }
            }

            // Alérgenos (desde YAML o sección del cuerpo)
            const rawAllergenData = yamlData.alergenos || body.match(/(?:Alérgenos(?: Presentes)?)[^\n]*\n([\s\S]*?)(?=\n(?:##?|> \[!|\s*$))/i)?.[1] || '';
            const allergenIds = [];
            const allergenStr = (Array.isArray(rawAllergenData) ? rawAllergenData.join(' ') : String(rawAllergenData)).toLowerCase();

            if (!allergenStr.includes('sin alérgenos') && !allergenStr.includes('sin alergenos')) {
                EU_ALLERGENS.forEach(allergen => {
                    const cleanName = allergen.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    if (
                        allergenStr.includes(allergen.icon) ||
                        allergenStr.includes(cleanName) ||
                        allergenStr.includes(allergen.name.toLowerCase())
                    ) {
                        allergenIds.push(allergen.id);
                    }
                });
            }

            // Extracción de secciones de texto
            const extractSection = (headerRegex) => {
                let capturing = false;
                const collected = [];
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (!capturing) {
                        if (headerRegex.test(line)) capturing = true;
                    } else {
                        if (/^##?\s+/.test(line) || /^>\s*\[!/.test(line)) break;
                        collected.push(line);
                    }
                }
                return collected.join('\n').trim();
            };

            let recipeSteps = extractSection(/##.*Procedimiento/i);
            if (recipeSteps.includes('Sin instrucciones especificadas.')) recipeSteps = '';

            let recipePlating = extractSection(/##.*(?:Acabado|Emplatado)/i);
            if (recipePlating.includes('Sin notas de emplatado.')) recipePlating = '';

            // Conservación (Callout o Sección estándar)
            let recipeConservation = '';
            const consCalloutMatch = body.match(/>\s*\[!info\]\s*Conservación[^\n]*\n([\s\S]*?)(?=\n(?:##?|> \[!|\s*$))/i);
            if (consCalloutMatch) {
                recipeConservation = consCalloutMatch[1]
                    .split(/\r?\n/)
                    .map(l => l.replace(/^>\s?/, ''))
                    .join('\n')
                    .trim();
            } else {
                recipeConservation = extractSection(/##.*Conservación/i);
            }

            const hasCallouts = />\s*\[!/.test(body);

            return {
                recipeName: formatTitleCase(recipeName || ''),
                recipeCode: recipeCode || 'ESC-001',
                recipeCategory: recipeCategory || 'Plato Principal - Carnes',
                recipeChef: recipeChef || '',
                recipeTime: recipeTime !== undefined ? recipeTime : 30,
                recipePortions: recipePortions !== undefined ? recipePortions : 4,
                targetFoodCost: targetFoodCost !== undefined ? targetFoodCost : 30,
                taxRate: taxRate !== undefined ? taxRate : 10,
                realMenuPrice: realMenuPrice !== undefined ? realMenuPrice : 0,
                currencySymbol: detectedCurrency || '€',
                optIncludeYaml: hasYaml,
                optIncludeCallouts: hasCallouts,
                optWikiLinks: hasWikiLinks,
                allergens: allergenIds,
                ingredients,
                recipeSteps,
                recipePlating,
                recipeConservation,
                recipeTags: recipeTags || 'escandallo, cocina'
            };
        }

        /**
         * Applies parsed Markdown data to the application state and refreshes the UI
         */
        function applyParsedMarkdown(content, fileName = '') {
            try {
                const parsed = parseMarkdownEscandallo(content);
                if (!parsed || (!parsed.recipeName && (!parsed.ingredients || parsed.ingredients.length === 0))) {
                    showToast('No se reconoció un formato de escandallo válido en el archivo.', 'warning');
                    return;
                }

                state = { ...state, ...parsed };
                populateFormInputs();
                const displayName = parsed.recipeName || fileName || 'Escandallo';
                showToast(`«${displayName}» cargado para modificar.`, 'success');
            } catch (err) {
                console.error('Error al procesar el archivo Markdown:', err);
                showToast('Ocurrió un error al procesar el archivo Markdown.', 'warning');
            }
        }

        /**
         * Loads and parses an Obsidian Markdown file into the application state
         */
        async function loadMarkdownFile() {
            // 1. Prioridad: File System Access API nativa si el navegador y el contexto seguro lo soportan
            const isFileOrigin = window.location.protocol === 'file:' || !window.isSecureContext;
            if (!isFileOrigin && typeof window.showOpenFilePicker === 'function') {
                try {
                    const [fileHandle] = await window.showOpenFilePicker({
                        types: [
                            {
                                description: 'Documento Markdown de Obsidian (*.md)',
                                accept: {
                                    'text/markdown': ['.md', '.markdown']
                                }
                            }
                        ],
                        multiple: false
                    });
                    const file = await fileHandle.getFile();
                    const content = await file.text();
                    applyParsedMarkdown(content, file.name);
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    console.warn('showOpenFilePicker no disponible o denegado, recurriendo al selector estándar:', err);
                }
            }

            // 2. Fallback estándar para Firefox, Safari, file:/// o contextos restringidos
            let input = document.getElementById('fileImportInput');
            if (!input) {
                input = document.createElement('input');
                input.id = 'fileImportInput';
                input.type = 'file';
                input.accept = '.md,.markdown,text/markdown';
                input.className = 'hidden';
                document.body.appendChild(input);
            }
            input.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                    const content = await file.text();
                    applyParsedMarkdown(content, file.name);
                } catch (err) {
                    console.error('Error al leer el archivo Markdown:', err);
                    showToast('Error al leer el archivo seleccionado.', 'warning');
                } finally {
                    input.value = '';
                }
            };
            input.click();
        }

        /**
         * Displays a non-intrusive toast notification
         */
        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
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
            }, 3200);
        }

        let cachedPantry = [];
        let pantryLoadState = 'loading';
        let pantryVisibleResults = [];
        let activePantryIndex = -1;
        let pantryResultsOpen = false;
        let suppressPantryFocusOpen = false;

        /**
         * Normaliza un insumo de la despensa para poder incorporarlo al escandallo.
         */
        function normalizePantryItem(raw) {
            const src = raw && typeof raw === 'object' ? raw : {};
            const name = formatTitleCase(String(src.name ?? '').trim());
            if (!name) return null;

            const grossQty = Math.max(0, parseLocaleFloat(src.grossQty));
            const wastePct = Math.min(99.9, Math.max(0, parseLocaleFloat(src.wastePct)));

            return {
                categoria: formatTitleCase(String(src.categoria ?? '').trim()),
                name,
                unit: String(src.unit ?? 'kg').trim() || 'kg',
                grossQty: roundTo(grossQty > 0 ? grossQty : 0.1, INGREDIENT_FIELD_DECIMALS.grossQty),
                wastePct,
                unitPrice: roundTo(Math.max(0, parseLocaleFloat(src.unitPrice)), INGREDIENT_FIELD_DECIMALS.unitPrice)
            };
        }

        /**
         * Búsqueda tolerante a tildes por nombre, categoría y unidad.
         * Los resultados que empiezan por el término buscado aparecen primero.
         */
        function filterPantryItems(items, query = '') {
            const list = Array.isArray(items) ? items : [];
            const tokens = foldText(query).split(/\s+/).filter(Boolean);

            const entries = list.map(raw => {
                const item = normalizePantryItem(raw);
                if (!item) return null;
                const nameFold = foldText(item.name);
                const categoryFold = foldText(item.categoria);
                return {
                    item,
                    nameFold,
                    categoryFold,
                    haystack: `${nameFold} ${categoryFold} ${foldText(item.unit)}`
                };
            }).filter(Boolean);

            const filtered = tokens.length > 0
                ? entries.filter(entry => tokens.every(token => entry.haystack.includes(token)))
                : entries;

            filtered.sort((a, b) => {
                if (tokens.length > 0) {
                    const aStarts = a.nameFold.startsWith(tokens[0]) ? 0 : 1;
                    const bStarts = b.nameFold.startsWith(tokens[0]) ? 0 : 1;
                    if (aStarts !== bStarts) return aStarts - bStarts;

                    const aPosition = a.nameFold.indexOf(tokens[0]);
                    const bPosition = b.nameFold.indexOf(tokens[0]);
                    if (aPosition !== bPosition) return aPosition - bPosition;
                }

                return a.categoryFold.localeCompare(b.categoryFold, 'es', { sensitivity: 'base' })
                    || a.nameFold.localeCompare(b.nameFold, 'es', { sensitivity: 'base' });
            });

            return filtered.map(entry => entry.item);
        }

        /**
         * Carga la despensa externa desde despensa.json servido en el origen.
         */
        async function loadExternalPantry() {
            const input = document.getElementById('pantrySearchInput');
            if (!input) return;

            pantryLoadState = 'loading';
            refreshPantryResults();

            try {
                // Fetch desde el mismo origen sin caché para obtener siempre los precios/insumos más recientes
                const response = await fetch('./despensa.json', { cache: 'no-cache' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const items = await response.json();
                cachedPantry = Array.isArray(items) ? items : [];
                pantryLoadState = 'ready';
            } catch (err) {
                pantryLoadState = 'error';
                console.warn('No se pudo cargar despensa.json desde el origen:', err);
            }

            refreshPantryResults();
        }

        function buildFreeIngredientButton(query) {
            const cleanQuery = String(query ?? '').trim();
            if (!cleanQuery) return '';
            const displayName = formatTitleCase(cleanQuery);

            return `
                <button type="button" data-pantry-action="create" data-pantry-query="${escapeHtml(cleanQuery)}" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-[#2a1700] text-xs font-bold transition">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    <span>Crear ingrediente libre «${escapeHtml(displayName)}»</span>
                </button>`;
        }

        function setPantryActiveIndex(index, scroll = true) {
            const input = document.getElementById('pantrySearchInput');
            const results = document.getElementById('pantrySearchResults');
            if (!input || !results) return;

            const options = Array.from(results.querySelectorAll('[role="option"]'));
            if (options.length === 0) {
                activePantryIndex = -1;
                input.removeAttribute('aria-activedescendant');
                return;
            }

            if (index < 0) index = options.length - 1;
            if (index >= options.length) index = 0;
            activePantryIndex = index;

            options.forEach((option, optionIndex) => {
                const isActive = optionIndex === index;
                option.setAttribute('aria-selected', isActive ? 'true' : 'false');
                option.classList.toggle('bg-[#2f293a]', isActive);
                option.classList.toggle('ring-1', isActive);
                option.classList.toggle('ring-inset', isActive);
                option.classList.toggle('ring-amber-400/20', isActive);
            });

            const activeOption = options[index];
            input.setAttribute('aria-activedescendant', activeOption.id);

            if (scroll) {
                const top = activeOption.offsetTop;
                const bottom = top + activeOption.offsetHeight;
                if (top < results.scrollTop) {
                    results.scrollTop = top;
                } else if (bottom > results.scrollTop + results.clientHeight) {
                    results.scrollTop = bottom - results.clientHeight;
                }
            }
        }

        /**
         * Renderiza los resultados del buscador de despensa.
         */
        function renderPantryResults(query = '') {
            const resultsEl = document.getElementById('pantrySearchResults');
            const hint = document.getElementById('pantrySearchHint');
            if (!resultsEl) return;

            const search = String(query ?? '');
            const freeButton = buildFreeIngredientButton(search);

            if (pantryLoadState === 'loading') {
                pantryVisibleResults = [];
                resultsEl.innerHTML = `
                    <div class="px-4 py-6 text-center text-xs text-[#938f99] flex items-center justify-center gap-2">
                        <span class="w-4 h-4 border-2 border-[#49454f] border-t-amber-400 rounded-full animate-spin" aria-hidden="true"></span>
                        <span>Cargando despensa…</span>
                    </div>`;
                if (hint) hint.textContent = 'Cargando la despensa.';
                setPantryActiveIndex(-1, false);
                return;
            }

            if (pantryLoadState === 'error') {
                pantryVisibleResults = [];
                resultsEl.innerHTML = `
                    <div class="px-4 py-5 text-center space-y-3">
                        <p class="text-xs text-[#f0c9a0]">No se pudo cargar la despensa.</p>
                        <div class="flex flex-wrap items-center justify-center gap-2">
                            <button type="button" data-pantry-action="retry" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2b2930] hover:bg-[#36343b] text-[#e6e1e5] border border-[#3e3c46] text-xs font-semibold transition">
                                Reintentar
                            </button>
                            ${freeButton}
                        </div>
                    </div>`;
                if (hint) hint.textContent = 'No se pudo cargar la despensa.';
                setPantryActiveIndex(-1, false);
                return;
            }

            pantryVisibleResults = filterPantryItems(cachedPantry, search);
            const total = pantryVisibleResults.length;
            resultsEl.scrollTop = 0;

            if (total === 0) {
                const emptyMessage = search.trim()
                    ? `No hay coincidencias para «<span class="text-[#e6e1e5] font-medium">${escapeHtml(search.trim())}</span>».`
                    : 'La despensa no contiene insumos.';
                resultsEl.innerHTML = `
                    <div class="px-4 py-5 text-center space-y-3">
                        <p class="text-xs text-[#938f99]">${emptyMessage}</p>
                        ${freeButton}
                    </div>`;
                if (hint) hint.textContent = 'No hay resultados en la despensa.';
                setPantryActiveIndex(-1, false);
                return;
            }

            const sym = escapeHtml(state.currencySymbol || '€');
            const headerLabel = search.trim()
                ? `${total} resultado${total === 1 ? '' : 's'}`
                : `${total} insumo${total === 1 ? '' : 's'} en la despensa`;

            const rows = pantryVisibleResults.map((item, index) => {
                const priceLabel = `${formatNumber(item.unitPrice, INGREDIENT_FIELD_DECIMALS.unitPrice)} ${sym}/${escapeHtml(item.unit)}`;
                const wasteLabel = item.wastePct > 0
                    ? `Merma ${formatNumber(item.wastePct, 1)}%`
                    : 'Sin merma';
                const categoryLabel = item.categoria || 'Sin categoría';

                return `
                    <button type="button" role="option" id="pantryOption${index}" data-pantry-action="select" data-pantry-index="${index}" aria-selected="${index === 0 ? 'true' : 'false'}" class="w-full text-left px-3.5 py-2.5 flex items-start gap-3 border-b border-[#2d2b35] last:border-0 hover:bg-[#2b2930] focus:outline-none transition ${index === 0 ? 'bg-[#2f293a] ring-1 ring-inset ring-amber-400/20' : ''}">
                        <span class="min-w-0 flex-1">
                            <span class="block truncate text-sm font-semibold text-[#f3eff4]">${escapeHtml(item.name)}</span>
                            <span class="mt-0.5 block truncate text-[11px] text-[#938f99]">${escapeHtml(categoryLabel)} · ${escapeHtml(item.unit)}</span>
                        </span>
                        <span class="shrink-0 text-right">
                            <span class="block font-mono text-xs font-semibold text-amber-300">${priceLabel}</span>
                            <span class="mt-0.5 block text-[10px] text-[#938f99]">${wasteLabel}</span>
                        </span>
                    </button>`;
            }).join('');

            resultsEl.innerHTML = `
                <div class="sticky top-0 z-10 px-3.5 py-1.5 bg-[#1b191f]/95 backdrop-blur-sm border-b border-[#2d2b35] flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[#79747e]">
                    <span>${headerLabel}</span>
                    <span class="normal-case tracking-normal">↑↓ mover · Enter añadir</span>
                </div>
                ${rows}`;

            if (hint) {
                hint.textContent = `${total} resultado${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'} en la despensa.`;
            }
            setPantryActiveIndex(0, false);
        }

        function openPantryResults() {
            const input = document.getElementById('pantrySearchInput');
            const results = document.getElementById('pantrySearchResults');
            if (!input || !results) return;

            results.classList.remove('hidden');
            pantryResultsOpen = true;
            input.setAttribute('aria-expanded', 'true');
            renderPantryResults(input.value);
        }

        function closePantryResults() {
            const input = document.getElementById('pantrySearchInput');
            const results = document.getElementById('pantrySearchResults');
            if (!input || !results) return;

            results.classList.add('hidden');
            pantryResultsOpen = false;
            activePantryIndex = -1;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
        }

        function refreshPantryResults() {
            if (!pantryResultsOpen) return;
            const input = document.getElementById('pantrySearchInput');
            if (input) renderPantryResults(input.value);
        }

        function updatePantryClearButton() {
            const input = document.getElementById('pantrySearchInput');
            const button = document.getElementById('btnClearPantrySearch');
            if (!input || !button) return;
            button.classList.toggle('hidden', input.value.length === 0);
        }

        function addPantryItemToRecipe(rawItem) {
            const item = normalizePantryItem(rawItem);
            if (!item) return false;

            const existing = state.ingredients.find(ing => (
                foldText(ing.name) === foldText(item.name)
                && String(ing.unit || '').trim() === item.unit
            ));

            if (existing) {
                const nextGross = roundTo(
                    Math.max(0, parseLocaleFloat(existing.grossQty)) + item.grossQty,
                    INGREDIENT_FIELD_DECIMALS.grossQty
                );
                existing.grossQty = nextGross;
                showToast(`«${item.name}» ya estaba en el escandallo. Cantidad incrementada a ${formatNumber(nextGross, INGREDIENT_FIELD_DECIMALS.grossQty)} ${item.unit}.`);
            } else {
                state.ingredients.push({
                    id: generateId(),
                    name: item.name,
                    grossQty: item.grossQty,
                    unit: item.unit,
                    wastePct: item.wastePct,
                    unitPrice: item.unitPrice
                });
                showToast(`Insumo «${item.name}» añadido al escandallo.`);
            }

            renderIngredientsTable();
            recalculateAndSync();
            return true;
        }

        function addFreeIngredientFromQuery(query) {
            const name = formatTitleCase(String(query ?? '').trim());
            if (!name) return;

            state.ingredients.push({
                id: generateId(),
                name,
                grossQty: 0.100,
                unit: 'kg',
                wastePct: 0,
                unitPrice: 0
            });
            renderIngredientsTable();
            recalculateAndSync();
            showToast(`Ingrediente libre «${name}» añadido. Indica cantidad, unidad y precio.`);
        }

        function focusPantrySearchWithoutOpening() {
            const input = document.getElementById('pantrySearchInput');
            if (!input) return;
            suppressPantryFocusOpen = true;
            input.focus();
            setTimeout(() => { suppressPantryFocusOpen = false; }, 0);
        }

        function selectPantryResult(index) {
            const item = pantryVisibleResults[index];
            if (!item) return;

            addPantryItemToRecipe(item);

            const input = document.getElementById('pantrySearchInput');
            if (input) {
                input.value = '';
                updatePantryClearButton();
                closePantryResults();
                focusPantrySearchWithoutOpening();
            } else {
                closePantryResults();
            }
        }

        function onPantrySearchKeydown(event) {
            const input = event.target;
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!pantryResultsOpen) {
                    openPantryResults();
                } else {
                    setPantryActiveIndex(activePantryIndex + 1);
                }
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!pantryResultsOpen) {
                    openPantryResults();
                } else {
                    setPantryActiveIndex(activePantryIndex - 1);
                }
                return;
            }

            if (event.key === 'Enter') {
                if (pantryResultsOpen && activePantryIndex >= 0) {
                    event.preventDefault();
                    selectPantryResult(activePantryIndex);
                }
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                if (pantryResultsOpen) {
                    closePantryResults();
                } else if (input.value) {
                    input.value = '';
                    updatePantryClearButton();
                }
                return;
            }

            if (event.key === 'Tab') {
                closePantryResults();
            }
        }

        function bindPantryPickerEvents() {
            const picker = document.getElementById('pantryPicker');
            const input = document.getElementById('pantrySearchInput');
            const results = document.getElementById('pantrySearchResults');
            const clearButton = document.getElementById('btnClearPantrySearch');
            if (!picker || !input || !results) return;

            input.addEventListener('focus', () => {
                if (!suppressPantryFocusOpen) openPantryResults();
            });
            input.addEventListener('click', () => {
                if (!pantryResultsOpen) openPantryResults();
            });
            input.addEventListener('input', () => {
                updatePantryClearButton();
                openPantryResults();
            });
            input.addEventListener('keydown', onPantrySearchKeydown);

            clearButton?.addEventListener('click', () => {
                input.value = '';
                updatePantryClearButton();
                input.focus();
                openPantryResults();
            });

            // Evita que el input pierda el foco antes de procesar el clic en una opción.
            results.addEventListener('mousedown', (event) => {
                if (event.target.closest('[data-pantry-action]')) event.preventDefault();
            });

            results.addEventListener('click', (event) => {
                const actionEl = event.target.closest('[data-pantry-action]');
                if (!actionEl) return;

                const action = actionEl.dataset.pantryAction;
                if (action === 'retry') {
                    loadExternalPantry();
                    return;
                }
                if (action === 'create') {
                    const query = actionEl.dataset.pantryQuery || input.value;
                    addFreeIngredientFromQuery(query);
                    input.value = '';
                    updatePantryClearButton();
                    closePantryResults();
                    focusPantrySearchWithoutOpening();
                    return;
                }
                if (action === 'select') {
                    selectPantryResult(Number(actionEl.dataset.pantryIndex));
                }
            });

            document.addEventListener('pointerdown', (event) => {
                if (!picker.contains(event.target)) closePantryResults();
            });
        }

        function initApp() {
            // Load saved state from localStorage if available
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.ingredients)) {
                        const merged = { ...getDemoState(), ...parsed };
                        state = {
                            ...merged,
                            recipeName: formatTitleCase(merged.recipeName || ''),
                            ingredients: merged.ingredients.map(ing => ({
                                ...ing,
                                name: formatTitleCase(ing.name)
                            }))
                        };
                    }
                }
            } catch (e) {
                state = getDemoState();
            }

            populateFormInputs();
            bindPantryPickerEvents();
            loadExternalPantry();

            // Bind Top-Level Input Listeners
            const textInputs = [
                'recipeName', 'recipeCode', 'recipeCategory', 'recipeChef',
                'recipeTags', 'currencySymbol', 'recipeSteps', 'recipePlating', 'recipeConservation'
            ];
            textInputs.forEach(id => {
                document.getElementById(id).addEventListener('input', (e) => {
                    state[id] = e.target.value;
                    if (id === 'currencySymbol') {
                        renderIngredientsTable();
                        refreshPantryResults();
                    }
                    recalculateAndSync();
                });
            });

            // Aplicar la misma capitalización tipo título que en la despensa al nombre de la receta.
            const recipeNameInput = document.getElementById('recipeName');
            const formatRecipeNameField = (e) => {
                const formatted = formatTitleCase(e.target.value);
                e.target.value = formatted;
                state.recipeName = formatted;
                recalculateAndSync();
            };
            recipeNameInput.addEventListener('blur', formatRecipeNameField);
            recipeNameInput.addEventListener('change', formatRecipeNameField);

            const integerInputs = ['recipeTime', 'recipePortions', 'taxRate'];
            integerInputs.forEach(id => {
                document.getElementById(id).addEventListener('input', (e) => {
                    state[id] = parseFloat(e.target.value) || 0;
                    recalculateAndSync();
                });
            });

            const decimalInputs = { targetFoodCost: 1, realMenuPrice: 2 };
            Object.keys(decimalInputs).forEach(id => {
                const input = document.getElementById(id);
                const decimals = decimalInputs[id];
                input.addEventListener('input', (e) => {
                    state[id] = parseLocaleFloat(e.target.value) || 0;
                    recalculateAndSync();
                });
                const formatDecimalField = (e) => {
                    const formatted = formatNumber(parseLocaleFloat(e.target.value), decimals);
                    e.target.value = formatted;
                    state[id] = parseLocaleFloat(formatted);
                };
                input.addEventListener('blur', formatDecimalField);
                input.addEventListener('change', formatDecimalField);
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

            // Import, Download & Copy Buttons (direct event listeners to preserve trusted user gestures)
            ['btnImportMdHeader', 'btnImportMdToolbar', 'btnMobileImportMd'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', loadMarkdownFile);
            });
            ['btnDownloadMd', 'btnDownloadMdToolbar', 'btnMobileDownloadMd'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', downloadMarkdownFile);
            });
            ['btnCopyMdHeader', 'btnCopyMdToolbar', 'btnMobileCopyMd'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', copyMarkdownToClipboard);
            });
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('DOMContentLoaded', initApp);
        }

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = {
                EU_ALLERGENS,
                STORAGE_KEY,
                generateId,
                escapeYaml,
                escapeMdCell,
                escapeHtml,
                formatTitleCase,
                formatNumber,
                formatCurrency,
                formatUnitPrice,
                roundTo,
                normalizePantryItem,
                filterPantryItems,
                INGREDIENT_FIELD_DECIMALS,
                parseLocaleFloat,
                computeIngredientMetrics,
                computeRecipeTotals,
                generateObsidianMarkdown,
                parseMarkdownEscandallo,
                getDemoState,
                slugifyFilename,
                getState: () => state,
                setState: (newState) => { state = newState; }
            };
        }
