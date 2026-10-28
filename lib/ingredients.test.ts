import assert from "node:assert/strict"
import {describe, it} from "node:test"
import type {RecipeDTO} from "@/core/models/recipe-dto"
import {ingredientsToRows, rowsToIngredients} from "@/lib/ingredient-rows"
import {
    editableQuantity,
    formatAmount,
    formatIngredientAmount,
    groupIngredients,
    inflectUnit,
    parseQuantity,
    parseStoredIngredients,
    scaleQuantity,
} from "@/lib/ingredients"
import {extractIngredients, parseIngredientLine} from "@/lib/ingredients-markdown"
import {dtoToRecipe, recipeToDtoPayload, recipeToDtoPayloadPartial} from "@/lib/recipe-adapter"

describe("parseQuantity", () => {
    const cases: [string, unknown][] = [
        ["200", {min: 200}],
        ["1,5", {min: 1.5}],
        ["1.5", {min: 1.5}],
        ["1/2", {min: 0.5}],
        ["½", {min: 0.5}],
        ["1 ½", {min: 1.5}],
        ["1½", {min: 1.5}],
        ["1 1/2", {min: 1.5}],
        ["2-3", {min: 2, max: 3}],
        ["2–3", {min: 2, max: 3}],
        ["2 a 3", {min: 2, max: 3}],
        ["1 o 2", {min: 1, max: 2}],
    ]
    for (const [input, expected] of cases) {
        it(`reads «${input}»`, () => assert.deepEqual(parseQuantity(input), {ok: true, quantity: expected}))
    }
    it("treats empty as no quantity", () => assert.deepEqual(parseQuantity("  "), {ok: true}))
    for (const bad of ["abc", "0", "3-2", "1/0", "1-2-3"]) {
        it(`rejects «${bad}»`, () => assert.equal(parseQuantity(bad).ok, false))
    }
})

describe("scaling and formatting", () => {
    it("scales from the original value", () => {
        assert.deepEqual(scaleQuantity({min: 2, max: 3}, 0.5), {min: 1, max: 1.5})
    })
    it("keeps metric amounts as decimals without float noise", () => {
        assert.equal(formatAmount(125 * 0.5, "g"), "63")
        assert.equal(formatAmount(2.5, "g"), "2,5")
        assert.equal(formatAmount(0.1 + 0.2, "ml"), "0,3")
        assert.equal(formatAmount(1.25, "kg"), "1,25")
    })
    it("uses kitchen fractions for the rest", () => {
        assert.equal(formatAmount(0.5), "½")
        assert.equal(formatAmount(1.5, "cucharadas"), "1½")
        assert.equal(formatAmount(1 / 3), "⅓")
        assert.equal(formatAmount(0.125, "cucharadita"), "⅛")
        assert.equal(formatAmount(3), "3")
        assert.equal(formatAmount(0.99), "1")
        assert.equal(formatAmount(1.4), "1,4")
    })
    it("inflects units after scaling", () => {
        assert.equal(inflectUnit("taza", {min: 2}), "tazas")
        assert.equal(inflectUnit("cucharadas", {min: 0.5}), "cucharada")
        assert.equal(inflectUnit("cucharadas soperas", {min: 1}), "cucharada sopera")
        assert.equal(inflectUnit("g", {min: 400}), "g")
    })
    it("formats every multiplier for a real line", () => {
        const ing = {id: "1", name: "aceite", quantity: {min: 2}, unit: "cucharadas"}
        assert.equal(formatIngredientAmount(ing, 0.5), "1 cucharada")
        assert.equal(formatIngredientAmount(ing, 1), "2 cucharadas")
        assert.equal(formatIngredientAmount(ing, 2), "4 cucharadas")
        assert.equal(formatIngredientAmount(ing, 3), "6 cucharadas")
    })
    it("scales ranges and leaves non-scalable amounts alone", () => {
        assert.equal(formatIngredientAmount({id: "1", name: "ajo", quantity: {min: 2, max: 3}, unit: "dientes"}, 2), "4–6 dientes")
        assert.equal(formatIngredientAmount({id: "2", name: "sal", note: "al gusto"}, 3), undefined)
    })
})

describe("groups", () => {
    it("starts a heading whenever the group changes, keeping order", () => {
        const groups = groupIngredients([
            {id: "1", name: "tofu", group: "Para el tofu"},
            {id: "2", name: "soja", group: "Para el tofu"},
            {id: "3", name: "harina", group: "Para la masa"},
            {id: "4", name: "sal"},
        ])
        assert.deepEqual(groups.map((g) => [g.title, g.items.length]), [["Para el tofu", 2], ["Para la masa", 1], [undefined, 1]])
    })
})

describe("adapter read/write", () => {
    const dto: RecipeDTO = {
        id: "r1", title: "Dhal", slug: "dhal", description: "", emoji: "🍛", content_md: "## Instrucciones",
        prep_time: 10, cook_time: 25, servings: 4, difficulty: "easy", tags: [], is_published: true, version: 1,
        created_by: "u", created_at: new Date(0), updated_at: new Date(0),
        ingredients: [{id: "a", name: "lentejas", quantity: {min: 1}, unit: "bote"}],
    }

    it("reads ingredients and defaults to [] for recipes not migrated yet", () => {
        assert.deepEqual(dtoToRecipe(dto, "x").ingredients, dto.ingredients)
        assert.deepEqual(dtoToRecipe({...dto, ingredients: undefined}, "x").ingredients, [])
    })
    it("drops malformed stored rows instead of crashing", () => {
        assert.deepEqual(parseStoredIngredients([{name: "sal", quantity: {min: -1}}, {nope: 1}, "x", null]), [{id: "ing-0", name: "sal"}])
        assert.deepEqual(parseStoredIngredients({}), [])
    })
    it("round-trips through the write payload without touching the original", () => {
        const recipe = dtoToRecipe(dto, "x")
        const payload = recipeToDtoPayload(recipe)
        assert.deepEqual(payload.ingredients, dto.ingredients)
        assert.equal(payload.content_md, dto.content_md)
        assert.deepEqual(recipeToDtoPayloadPartial({ingredients: [{id: "b", name: "  sal ", note: " "}]}), {ingredients: [{id: "b", name: "sal"}]})
    })
})

describe("Markdown extraction (Phase 0)", () => {
    it("reads quantity, unit, name and notes in either order", () => {
        assert.deepEqual(parseIngredientLine("200 g de harina (tamizada)").ingredient, {name: "harina", quantity: {min: 200}, unit: "g", note: "tamizada"})
        assert.deepEqual(parseIngredientLine("harina: 200 g").ingredient, {name: "harina", quantity: {min: 200}, unit: "g"})
        assert.deepEqual(parseIngredientLine("1 cebolla, troceada").ingredient, {name: "cebolla", quantity: {min: 1}, note: "troceada"})
        assert.deepEqual(parseIngredientLine("100 gr. de chocolate").ingredient, {name: "chocolate", quantity: {min: 100}, unit: "gr"})
        assert.deepEqual(parseIngredientLine("4 cucharadas soperas de salsa de soja").ingredient, {name: "salsa de soja", quantity: {min: 4}, unit: "cucharadas soperas"})
    })
    it("never invents a number for imprecise amounts", () => {
        assert.deepEqual(parseIngredientLine("Canela al gusto").ingredient, {name: "Canela", note: "al gusto"})
        assert.deepEqual(parseIngredientLine("una pizca de sal").ingredient, {name: "sal", note: "una pizca"})
    })
    it("flags what needs a human", () => {
        assert.ok(parseIngredientLine("Media tableta de curry").issues.some((i) => i.level === "review"))
        assert.ok(parseIngredientLine("La rayadura de 2 limones").issues.some((i) => i.level === "review"))
        assert.ok(parseIngredientLine("1 o 2 botes de lentejas").issues.some((i) => i.level === "review"))
    })
    it("extracts groups and leaves only the preparation in content_md", () => {
        const md = [
            "# CRUMBLE", "## Ingredients", "", "Para la base:", "", "- 800 g de peras", "", "Para el crumble", "- 1/2 limón",
            "", "---", "", "## Instrucciones", "1. Añadir los 20 g de azúcar.",
        ].join("\n")
        const result = extractIngredients(md)
        assert.deepEqual(result.ingredients, [
            {name: "peras", quantity: {min: 800}, unit: "g", group: "Para la base"},
            {name: "limón", quantity: {min: 0.5}, group: "Para el crumble"},
        ])
        assert.equal(result.remaining, "# CRUMBLE\n## Instrucciones\n1. Añadir los 20 g de azúcar.")
        assert.ok(result.issues.some((i) => i.message.includes("preparación menciona")))
    })
    it("reports a missing section as a blocker", () => {
        assert.equal(extractIngredients("## Pasos\n1. Hervir").issues[0].level, "blocker")
    })
})

describe("editor rows round trip", () => {
    const stored = [
        {id: "1", name: "tofu", quantity: {min: 12.5}, unit: "g", group: "Base"},
        {id: "2", name: "harina", quantity: {min: 10000}, unit: "g", group: "Base"},
        {id: "3", name: "azúcar", quantity: {min: 1 / 3}, unit: "taza"},
        {id: "4", name: "agua", quantity: {min: 4 / 3, max: 2}, unit: "tazas", note: "templada"},
        {id: "5", name: "sal"},
        {id: "6", name: "soja", quantity: {min: 0.125}, unit: "cucharadita", group: "Salsa"},
    ]

    it("shows stored amounts without rounding or grouping", () => {
        assert.equal(editableQuantity({min: 12.5}), "12,5")
        assert.equal(editableQuantity({min: 10000}), "10000")
        assert.equal(editableQuantity({min: 1 / 3}), "1/3")
        assert.equal(editableQuantity({min: 4 / 3, max: 2}), "1 1/3-2")
    })
    it("saves an untouched recipe exactly as stored, groups included", () => {
        assert.deepEqual(rowsToIngredients(ingredientsToRows(stored)), {ok: true, ingredients: stored})
    })
})
