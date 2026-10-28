const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const editor = require("../src/despensa.js");

describe("Editor de despensa: normalización y validación", () => {
  it("normaliza comas decimales, alias de unidades y valores ausentes", () => {
    const item = editor.normalizeItem({
      categoria: "  Verduras y Hortalizas ",
      name: "  Cebolla  ",
      unit: "KILOS",
      grossQty: "0,40",
      wastePct: "15,5",
      unitPrice: "1,60",
    });

    assert.deepEqual(item, {
      categoria: "Verduras y Hortalizas",
      name: "Cebolla",
      unit: "kg",
      grossQty: 0.4,
      wastePct: 15.5,
      unitPrice: 1.6,
    });
  });

  it("detecta todos los campos inválidos de un insumo", () => {
    const errors = editor.getItemErrors({
      categoria: "",
      name: "",
      unit: "xx",
      grossQty: 0,
      wastePct: 100,
      unitPrice: -1,
    });

    assert.deepEqual(Object.keys(errors).sort(), [
      "categoria",
      "grossQty",
      "name",
      "unit",
      "unitPrice",
      "wastePct",
    ]);
  });

  it("acepta un insumo válido con merma y precio cero", () => {
    const errors = editor.getItemErrors({
      categoria: "Fondos y Caldos",
      name: "Agua",
      unit: "L",
      grossQty: 1,
      wastePct: 0,
      unitPrice: 0,
    });

    assert.deepEqual(errors, {});
  });

  it("serializa con el orden y formato de claves esperado por EscandalloPro", () => {
    const json = editor.serializeItems([{
      categoria: "Grasas y Aceites",
      name: "Aceite de Oliva Virgen Extra",
      unit: "L",
      grossQty: 0.08,
      wastePct: 0,
      unitPrice: 9.2345,
    }]);

    const parsed = JSON.parse(json);
    assert.deepEqual(Object.keys(parsed[0]), [
      "categoria",
      "name",
      "unit",
      "grossQty",
      "wastePct",
      "unitPrice",
    ]);
    assert.equal(parsed[0].unitPrice, 9.2345);
    assert.match(json, /"unitPrice": 9\.2345/);
    assert.match(json, /^\s*\[/);
  });

  it("redondea el precio unitario a cuatro decimales al exportar y conserva el resto de precisiones", () => {
    const exported = editor.toExportItem({
      categoria: "Carnes",
      name: "Pollo",
      unit: "kg",
      grossQty: 1.23456,
      wastePct: 12.345,
      unitPrice: 5.67891,
    });

    assert.equal(exported.grossQty, 1.235);
    assert.equal(exported.wastePct, 12.35);
    assert.equal(exported.unitPrice, 5.6789);
  });

  it("muestra los campos numéricos con el mismo separador decimal español que los cálculos", () => {
    assert.equal(editor.displayFieldValue("unitPrice", 1.5), "1,5000");
    assert.equal(editor.displayFieldValue("unitPrice", 1.2345), "1,2345");
    assert.equal(editor.displayFieldValue("grossQty", 0.08), "0,080");
    assert.equal(editor.displayFieldValue("wastePct", 15), "15,00");
    assert.equal(editor.displayFieldValue("name", "Cebolla"), "Cebolla");
  });

  it("formatea categorías y nombres con mayúsculas de título respetando palabras menores", () => {
    assert.equal(
      editor.formatTitleCase("aceite de oliva virgen extra"),
      "Aceite de Oliva Virgen Extra",
    );
    assert.equal(
      editor.formatTitleCase("grasas y aceites"),
      "Grasas y Aceites",
    );
    assert.equal(
      editor.formatTitleCase("la sal en escamas"),
      "La Sal en Escamas",
    );
    assert.equal(editor.formatTitleCase("sal y pimienta"), "Sal y Pimienta");
    assert.equal(
      editor.formatTitleCase("producto a granel"),
      "Producto a Granel",
    );
    assert.equal(editor.formatTitleCase("de la casa"), "De la Casa");
    assert.equal(
      editor.formatTitleCase("  carrillera   cerdo  "),
      "Carrillera Cerdo",
    );
    assert.equal(
      editor.formatTitleCase("nata culinaria 35% M.G."),
      "Nata Culinaria 35% M.G.",
    );
    assert.equal(
      editor.formatTitleCase("queso parmigiano reggiano 24m"),
      "Queso Parmigiano Reggiano 24m",
    );
    assert.equal(
      editor.formatTitleCase("sub-receta / base"),
      "Sub-Receta / Base",
    );
    assert.equal(editor.formatTitleCase(""), "");
  });

  it("aplica el formato título al cargar o importar insumos", () => {
    const item = editor.normalizeItem({
      categoria: "grasas y aceites",
      name: "aceite de oliva virgen extra 82% M.G.",
      unit: "L",
      grossQty: 1,
      wastePct: 0,
      unitPrice: 10,
    });

    assert.equal(item.categoria, "Grasas y Aceites");
    assert.equal(item.name, "Aceite de Oliva Virgen Extra 82% M.G.");
  });

  it("bloquea la exportación si existe algún error y localiza el primero", () => {
    const result = editor.buildValidatedJson([
      {
        categoria: "Carnes",
        name: "Pollo",
        unit: "kg",
        grossQty: 1,
        wastePct: 0,
        unitPrice: 5,
      },
      {
        categoria: "",
        name: "",
        unit: "kg",
        grossQty: 0,
        wastePct: 0,
        unitPrice: 0,
      },
    ]);

    assert.equal(result.valid, false);
    assert.equal(result.content, null);
    assert.deepEqual(result.first, {
      index: 1,
      field: "categoria",
      message: "La categoría es obligatoria.",
    });
  });

  it("calcula estadísticas de la despensa", () => {
    const stats = editor.computeStats([
      {
        categoria: "A",
        name: "Uno",
        unit: "kg",
        grossQty: 1,
        wastePct: 10,
        unitPrice: 2,
      },
      {
        categoria: "A",
        name: "Dos",
        unit: "L",
        grossQty: 2,
        wastePct: 0,
        unitPrice: 4,
      },
      {
        categoria: "B",
        name: "Tres",
        unit: "ud",
        grossQty: 0,
        wastePct: 20,
        unitPrice: 1,
      },
    ]);

    assert.equal(stats.total, 3);
    assert.equal(stats.categories, 2);
    assert.equal(stats.withWaste, 2);
    assert.equal(stats.avgWaste, 10);
    assert.equal(stats.avgPrice, 7 / 3);
    assert.equal(stats.totalCost, 10);
  });

  it("la despensa real del proyecto supera la validación del editor", () => {
    const fs = require("fs");
    const path = require("path");
    const raw = fs.readFileSync(
      path.resolve(__dirname, "../src/despensa.json"),
      "utf8",
    );
    const list = JSON.parse(raw).map(editor.normalizeItem);
    const result = editor.buildValidatedJson(list);

    assert.equal(result.valid, true, result.first ? result.first.message : "");
    assert.ok(JSON.parse(result.content).length >= 10);
  });
});
