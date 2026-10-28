# Ingredientes estructurados · Fase 0 (issue #7)

Inventario, casos límite y plan para pasar los ingredientes de `content_md` a `recipes.ingredients`. Nada de esto se ha aplicado aún a la base de datos.

## Inventario (copia del 2026-10-28)

27 recetas, todas publicadas, 23.687 caracteres de Markdown. La copia es un `select *` por la API pública, guardada en `.migration/backup-2026-10-28.json` (ignorada por git). El informe receta a receta lo genera el script en `.migration/report.md`.

La extracción automática dejó 16 recetas seguras, 11 para revisar y ninguna sin resolver. Las 11 se revisaron el 2026-10-28, y sus correcciones están en `scripts/ingredients-overrides.ts`, que el script aplica encima de la extracción. Tras la revisión, las 27 quedan aprobadas.

| Receta | Corrección aprobada |
|---|---|
| dhal | Los pasos 1 y 4 dejan de citar cantidades; se corrige "tomate tomate" |
| sopa-de-lasana | Los pasos 1, 3 y 6 dejan de citar cantidades |
| crumble-de-pera | El paso 3 dice "el azúcar moreno", sin "20 g" |
| sopa-de-tomate | Se añaden el agua (250 ml) y la nata vegetal (1 bote), que solo estaban en el paso 5; el paso deja de citar cantidades |
| sopa-china | Las alternativas pasan a la nota: `4 nidos de fideos de arroz · o 1 bolsa de gyozas`, `4 cebolletas · o 1 cebolla grande` |
| plumcake-de-limon-con-arandanos | `2 limones · solo la ralladura`, que ahora escala |
| tortitas, verduras-asadas-al-horno | La línea de opcionales pasa a un grupo "Opcional", con un ingrediente por línea |
| albondigas-de-lentejas, curry-de-garbanzos, paella-de-verduras | Se aceptan tal cual: 1–2 botes, ½ tableta y la nota del azafrán |

Además, se quita el `# TÍTULO` inicial del Markdown cuando coincide con el título de la receta: pasa en 20 recetas. Lo conservan `salchichas-de-alubias` (`# SALCHICHAS CASERAS DE ALUBIA`) y `masa-para-empanada` (`# MASA EMPANADA`), porque no coinciden.

## Formatos encontrados

- **Encabezados:** `## Ingredientes` en casi todas, y `## Ingredients` en inglés en crumble-de-pera. Ninguna receta carece de la sección.
- **Listas:** con `-` y con `*` (verduras-asadas); sin listas anidadas.
- **Subgrupos:** `Para la base:` con dos puntos (crumble), `Para la salsa` sin ellos (sopa-china), y en tofu-baos y la lasaña como subtítulos.
- **Separador `---`:** entre ingredientes e instrucciones (paella).
- **Orden:** casi siempre `cantidad unidad de nombre`; nunca `nombre: cantidad`.

## Casos límite, con ejemplos reales

| Caso | Ejemplo | Tratamiento | Severidad |
|---|---|---|---|
| Fracciones | `1/2 limón`, `¼ cucharadita`, `½ cdta` | Se convierten a número (0,5, 0,25) y se muestran como fracción (`½`) | segura |
| Intervalos | `2-3 dientes`, `60-80 gr` | `{min, max}`, y se escalan los dos extremos | segura |
| «X o Y» | `1 o 2 botes de lentejas` | Intervalo 1–2 | revisar |
| Cantidad con palabras | `Media tableta de curry` | 0,5 | revisar |
| Imprecisas | `Canela al gusto`, `1 puñado de nueces`, `Sal y pimienta al gusto` | «al gusto» va a la nota, sin cantidad, y nunca se escala. «1 puñado» sí lleva número y se escala (2 puñados) | segura |
| Sin cantidad | `Sal gorda`, `Pimentón.`, `Aceite de oliva` | Solo nombre, sin cantidad | segura |
| Unidades | `g`, `gr`, `gr.`, `kg`, `ml`, `l`, `litro`, `cucharada(s)`, `cucharadas soperas`, `cda`, `cdta`, `diente(s)`, `bote`, `lata grande`, `bolsa`, `bandeja`, `rollo`, `lámina`, `hoja`, `taza` | Se guardan como se escribieron. Al escalar cambian singular y plural (`1 cucharada` → `2 cucharadas`). `g/ml` se redondean a entero desde 10, y `kg/l` llevan 2 decimales | segura |
| Notas | `(Yolanda)`, `, troceada`, `(opcional)` | Campo `note` | segura |
| Notas con cantidades | paella: `¼ cucharadita de hebras de azafrán (también puedes usar ⅛ cucharadita de azafrán molido…)` | La nota no se escala | revisar |
| Nombres con números o alternativas | `4 nidos de fideos de arroz o 1 bolsa de gyozas`, `La rayadura de 2 limones` | Se guarda tal cual. La cantidad de la alternativa no se escala | revisar |
| Opcionales en una línea | `Opcional: jengibre, nuez moscada, cacao, etc.` | Un ingrediente con la nota «opcional» | revisar |
| Cantidades en los pasos | dhal: `Picamos 1 cebolla y 4 dientes de ajo`. crumble: `Añadir los 20 g de azúcar` | No se escalan. La ficha avisa al multiplicar: *«Las que aparecen en la preparación no cambian»* | revisar |
| Plural del nombre | `1 cebolla` ×2 → `2 cebolla` | No se pluraliza el nombre, solo la unidad | conocido |
| Repetidos | lasaña: `Sal y pimienta` en los dos grupos | Permitido entre grupos; se avisa si se repite dentro del mismo grupo | segura |

## Modelo

```ts
interface RecipeIngredient {
  id: string                                // estable, para ordenar y editar
  name: string
  quantity?: { min: number; max?: number }  // sin cantidad = no escalable
  unit?: string                             // texto libre, como se escribió
  note?: string
  group?: string                            // los consecutivos con el mismo grupo van bajo un encabezado
}
```

Se guarda en `recipes.ingredients jsonb not null default '[]'`, con un `check` de que sea un array. El orden del array es el de la lista. `content_md` queda para la preparación y las notas. El adaptador descarta las filas mal formadas al leer, y una receta con `[]` sigue mostrando su Markdown como hasta ahora (compatibilidad temporal).

## Plan de migración

1. **Esquema.** Hay que aplicar `supabase/migrations/20261028120000_add_recipe_ingredients.sql` **antes de desplegar** este código: el formulario ya envía `ingredients` y sin la columna los guardados fallarían. Es una migración aditiva y no toca ninguna fila.
2. **Copia.** Se hace `pnpm ingredients:phase0 report <copia.json> --approve` sobre una copia recién sacada, con la base de datos ya migrada. Las correcciones de `scripts/ingredients-overrides.ts` se aplican solas.
3. **Revisión.** En `.migration/proposal.json` se marca `"approved": true` en cada receta aceptada. Las de "revisar" se corrigen ahí mismo o se dejan sin aprobar y se migran a mano desde el editor del panel.
4. **Aplicar.** Se ejecuta `pnpm ingredients:phase0 sql .migration/proposal.json` y el `.migration/apply.sql` que genera, en una sola transacción. Cada `update` solo actúa si `content_md` sigue siendo el de la copia (hash SHA-256) y `ingredients` está vacío: una receta editada entretanto se salta, no se pisa.
5. **Comprobar.** Que el número de filas actualizadas sea el de aprobadas. Que ninguna receta aprobada tenga `ingredients = '[]'` ni `content_md` vacío. Y repaso visual de la ficha de cada una.
6. **Revertir.** `pnpm ingredients:phase0 rollback <copia.json>` genera `.migration/rollback.sql`, que devuelve `content_md` e `ingredients` a lo que había en la copia.

## Pendiente

- **Aplicar a producción** los pasos 1 y 4 del plan. El SQL está generado (`.migration/apply.sql`, 27 `update` en una transacción que se aborta entera si no se actualizan las 27), pero no se ha ejecutado.
- **Etiquetas casi repetidas** (aparte, en la portada): `rapido`/`rápido`, `salado`/`sálado`, `confort`/`comfort`, `garbanzo`/`garbanzos`, `italiana`/`italiano`.

## Pruebas

`pnpm test` cubre el parseo de cantidades, la escala con ×0,5/×1/×2/×3, el redondeo sin ruido de coma flotante, el plural de las unidades, los grupos, la lectura y escritura por el adaptador (incluido el `[]` de las recetas sin migrar) y la extracción del Markdown con casos de recetas reales.
