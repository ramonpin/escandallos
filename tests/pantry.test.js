const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

describe("Estructura e integridad de la despensa externa (despensa.json)", () => {
  const pantryPath = path.resolve(__dirname, "../src/despensa.json");

  it("el archivo src/despensa.json existe y es un JSON válido", () => {
    assert.ok(fs.existsSync(pantryPath), "src/despensa.json debe existir");
    const raw = fs.readFileSync(pantryPath, "utf8");
    assert.doesNotThrow(
      () => JSON.parse(raw),
      "src/despensa.json debe ser JSON válido",
    );
  });

  it("contiene una lista no vacía de insumos con todas las propiedades requeridas", () => {
    const items = JSON.parse(fs.readFileSync(pantryPath, "utf8"));
    assert.ok(Array.isArray(items), "Debe ser un array");
    assert.ok(items.length >= 10, "Debe contener al menos 10 insumos básicos");

    const validUnits = ["kg", "g", "L", "ml", "ud", "mjo"];

    items.forEach((item, idx) => {
      assert.ok(
        typeof item.name === "string" && item.name.trim().length > 0,
        `El insumo en índice ${idx} debe tener un nombre válido`,
      );
      assert.ok(
        typeof item.categoria === "string" && item.categoria.trim().length > 0,
        `El insumo «${item.name}» debe tener una categoría válida`,
      );
      assert.ok(
        validUnits.includes(item.unit),
        `El insumo «${item.name}» debe tener una unidad válida (${
          validUnits.join(", ")
        }), recibido: ${item.unit}`,
      );
      assert.ok(
        typeof item.grossQty === "number" && item.grossQty > 0,
        `El insumo «${item.name}» debe tener grossQty numérico > 0`,
      );
      assert.ok(
        typeof item.wastePct === "number" && item.wastePct >= 0 &&
          item.wastePct < 100,
        `El insumo «${item.name}» debe tener wastePct numérico entre 0 y 99.9`,
      );
      assert.ok(
        typeof item.unitPrice === "number" && item.unitPrice >= 0,
        `El insumo «${item.name}» debe tener unitPrice numérico >= 0`,
      );
    });
  });

  it("incluye categorías gastronómicas estructuradas", () => {
    const items = JSON.parse(fs.readFileSync(pantryPath, "utf8"));
    const categories = new Set(items.map((i) => i.categoria));
    assert.ok(
      categories.size >= 4,
      "Debe incluir al menos 4 categorías diferentes",
    );
    assert.ok(
      categories.has("Verduras y Hortalizas"),
      "Debe incluir categoría de verduras",
    );
    assert.ok(
      categories.has("Grasas y Aceites"),
      "Debe incluir categoría de grasas/aceites",
    );
  });
});
