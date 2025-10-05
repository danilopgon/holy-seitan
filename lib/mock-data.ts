import type { Recipe } from "./types"

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Revuelto Crujiente de Tofu",
    slug: "revuelto-crujiente-de-tofu",
    description: "Un revuelto rico en proteínas con cúrcuma y vegetales para el desayuno",
    content: `# Revuelto Crujiente de Tofu

Un delicioso desayuno rico en proteínas que rivaliza con los huevos revueltos tradicionales.

## Ingredientes

- 1 bloque de tofu firme, prensado y desmenuzado
- 1/2 cucharadita de cúrcuma
- 1/4 cucharadita de sal negra (kala namak)
- 1 pimiento morrón, cortado en cubitos
- 1 cebolla pequeña, cortada en cubitos
- 2 dientes de ajo, picados
- 2 cucharadas de levadura nutricional
- Sal y pimienta al gusto
- 2 cucharadas de aceite de oliva

## Instrucciones

1. Calienta el aceite de oliva en una sartén grande a fuego medio-alto
2. Agrega la cebolla y el pimiento, saltea por 3-4 minutos
3. Añade el ajo y cocina por 1 minuto
4. Agrega el tofu desmenuzado, la cúrcuma y la sal negra
5. Cocina por 8-10 minutos, revolviendo ocasionalmente, hasta que el tofu esté dorado y crujiente
6. Incorpora la levadura nutricional
7. Sazona con sal y pimienta
8. Sirve caliente con tostadas o en un burrito de desayuno

## Consejos

- Prensa el tofu por al menos 15 minutos para mejor textura
- La sal negra da un sabor a huevo
- Agrega espinacas o col rizada para nutrición extra`,
    emoji: "🍳",
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: "Fácil",
    tags: ["desayuno", "alto-en-proteínas", "rápido", "tofu"],
    author: "Chef Tempeh",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Pasta Alfredo Cremosa de Anacardos",
    slug: "pasta-alfredo-cremosa-de-anacardos",
    description: "Salsa cremosa para pasta hecha con anacardos, sin lácteos",
    content: `# Pasta Alfredo Cremosa de Anacardos

Una lujosa salsa alfredo sin lácteos que es increíblemente cremosa y sabrosa.

## Ingredientes

### Para la salsa:
- 1 taza de anacardos crudos, remojados
- 1 taza de leche vegetal sin azúcar
- 3 dientes de ajo
- 2 cucharadas de levadura nutricional
- 1 cucharada de jugo de limón
- 1/2 cucharadita de sal
- 1/4 cucharadita de pimienta negra
- 1/4 cucharadita de nuez moscada

### Para la pasta:
- 1 lb de fettuccine
- 2 tazas de floretes de brócoli
- Perejil fresco para decorar

## Instrucciones

1. Remoja los anacardos en agua caliente por 30 minutos, luego escurre
2. Cocina la pasta según las instrucciones del paquete
3. Cocina el brócoli al vapor hasta que esté tierno-crujiente
4. Licúa los anacardos, leche vegetal, ajo, levadura nutricional, jugo de limón y condimentos hasta que esté suave
5. Vierte la salsa en una sartén y calienta suavemente, revolviendo constantemente
6. Mezcla la pasta con la salsa y el brócoli
7. Decora con perejil y sirve

## Notas

- La salsa se espesa al enfriarse
- Agrega agua de la pasta para diluir si es necesario
- Guarda la salsa sobrante en el refrigerador hasta por 5 días`,
    emoji: "🍝",
    prepTime: 35,
    cookTime: 15,
    servings: 6,
    difficulty: "Fácil",
    tags: ["pasta", "cena", "anacardos", "cremoso"],
    author: "Chef Tempeh",
    createdAt: "2024-01-20T14:30:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "3",
    title: "Hamburguesas Picantes de Frijoles Negros",
    slug: "hamburguesas-picantes-de-frijoles-negros",
    description: "Hamburguesas vegetarianas caseras con un toque picante",
    content: `# Hamburguesas Picantes de Frijoles Negros

Estas hamburguesas se mantienen perfectamente unidas y están llenas de sabor y proteínas.

## Ingredientes

- 2 latas de frijoles negros, escurridos y enjuagados
- 1 taza de pan rallado
- 1/2 taza de avena en hojuelas
- 1 cebolla pequeña, finamente picada
- 2 dientes de ajo, picados
- 1 jalapeño, picado
- 1 cucharadita de comino
- 1 cucharadita de pimentón ahumado
- 1/2 cucharadita de chile en polvo
- 2 cucharadas de salsa de soja
- 2 cucharadas de pasta de tomate
- Sal y pimienta al gusto

## Instrucciones

1. Machaca los frijoles negros en un tazón grande, dejando algunos trozos
2. Saltea la cebolla, ajo y jalapeño hasta que estén suaves
3. Agrega los vegetales salteados a los frijoles
4. Mezcla el pan rallado, avena, especias, salsa de soja y pasta de tomate
5. Forma 6 hamburguesas
6. Refrigera por 30 minutos para que se afirmen
7. Cocina en una sartén con aceite por 4-5 minutos por lado
8. Sirve en panes con tus ingredientes favoritos

## Sugerencias para Servir

- Cubre con aguacate, lechuga, tomate y mayonesa vegana
- Sirve con papas fritas de camote
- Haz mini hamburguesas para fiestas`,
    emoji: "🍔",
    prepTime: 20,
    cookTime: 10,
    servings: 6,
    difficulty: "Media",
    tags: ["hamburguesas", "cena", "alto-en-proteínas", "picante", "frijoles"],
    author: "Chef Seitan",
    createdAt: "2024-02-01T12:00:00Z",
    updatedAt: "2024-02-01T12:00:00Z",
  },
  {
    id: "4",
    title: "Curry Tailandés de Coco",
    slug: "curry-tailandes-de-coco",
    description: "Curry aromático con vegetales en una rica salsa de coco",
    content: `# Curry Tailandés de Coco

Un curry fragante y reconfortante que está listo en 30 minutos.

## Ingredientes

- 1 lata de leche de coco
- 2 cucharadas de pasta de curry rojo
- 1 bloque de tofu, cortado en cubos
- 2 tazas de vegetales mixtos (pimientos, zanahorias, guisantes)
- 1 taza de brotes de bambú
- 2 cucharadas de salsa de soja
- 1 cucharada de jarabe de arce
- 1 lima, exprimida
- Albahaca y cilantro frescos
- Arroz jazmín cocido para servir

## Instrucciones

1. Prensa y corta el tofu en cubos, luego fríe en la sartén hasta que esté dorado
2. En una olla grande, calienta 2 cucharadas de leche de coco
3. Agrega la pasta de curry y cocina por 1 minuto
4. Vierte el resto de la leche de coco
5. Añade los vegetales y brotes de bambú
6. Cocina a fuego lento por 10 minutos
7. Agrega el tofu, salsa de soja, jarabe de arce y jugo de lima
8. Cocina por 5 minutos más
9. Decora con hierbas frescas
10. Sirve sobre arroz jazmín

## Consejos

- Ajusta la cantidad de pasta de curry según el nivel de picante deseado
- Agrega más vegetales según desees
- Las sobras saben aún mejor al día siguiente`,
    emoji: "🍛",
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: "Fácil",
    tags: ["curry", "cena", "tailandés", "coco", "tofu"],
    author: "Chef Seitan",
    createdAt: "2024-02-10T16:45:00Z",
    updatedAt: "2024-02-10T16:45:00Z",
  },
  {
    id: "5",
    title: "Mousse de Chocolate y Aguacate",
    slug: "mousse-de-chocolate-y-aguacate",
    description: "Postre decadente de chocolate hecho con aguacates",
    content: `# Mousse de Chocolate y Aguacate

Un postre rico y cremoso que es secretamente saludable e increíblemente fácil de hacer.

## Ingredientes

- 2 aguacates maduros
- 1/4 taza de cacao en polvo
- 1/4 taza de jarabe de arce
- 1/4 taza de leche vegetal
- 1 cucharadita de extracto de vainilla
- Pizca de sal
- Frutos rojos frescos para decorar

## Instrucciones

1. Saca la pulpa del aguacate y colócala en un procesador de alimentos
2. Agrega el cacao en polvo, jarabe de arce, leche vegetal, vainilla y sal
3. Licúa hasta que esté completamente suave y cremoso
4. Prueba y ajusta el dulzor si es necesario
5. Refrigera por al menos 1 hora
6. Sirve en tazones pequeños decorados con frutos rojos frescos

## Notas

- Usa aguacates muy maduros para mejor sabor
- Se puede guardar en el refrigerador hasta por 3 días
- Agrega un shot de espresso para mousse de moka
- Cubre con crema batida de coco para extra indulgencia`,
    emoji: "🍫",
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    difficulty: "Fácil",
    tags: ["postre", "chocolate", "sin-hornear", "rápido", "saludable"],
    author: "Chef Tempeh",
    createdAt: "2024-02-15T09:30:00Z",
    updatedAt: "2024-02-15T09:30:00Z",
  },
  {
    id: "6",
    title: "Boloñesa de Lentejas",
    slug: "bolonesa-de-lentejas",
    description: "Salsa italiana abundante con lentejas en lugar de carne",
    content: `# Boloñesa de Lentejas

Una salsa para pasta rica en proteínas y satisfactoria, perfecta para preparar con anticipación.

## Ingredientes

- 1 taza de lentejas marrones o verdes
- 1 lata de tomates triturados
- 1 lata de pasta de tomate
- 1 cebolla, cortada en cubitos
- 2 zanahorias, cortadas en cubitos
- 2 tallos de apio, cortados en cubitos
- 4 dientes de ajo, picados
- 1 taza de caldo de vegetales
- 2 cucharadas de aceite de oliva
- 2 cucharaditas de condimento italiano
- 1 hoja de laurel
- Sal y pimienta al gusto
- Albahaca fresca para decorar

## Instrucciones

1. Cocina las lentejas según las instrucciones del paquete, escurre
2. Calienta el aceite de oliva en una olla grande
3. Saltea la cebolla, zanahorias y apio por 5 minutos
4. Agrega el ajo y cocina por 1 minuto
5. Añade la pasta de tomate y cocina por 2 minutos
6. Vierte los tomates triturados y el caldo de vegetales
7. Agrega las lentejas cocidas, condimento italiano y hoja de laurel
8. Cocina a fuego lento por 20-25 minutos, revolviendo ocasionalmente
9. Sazona con sal y pimienta
10. Retira la hoja de laurel y sirve sobre pasta
11. Decora con albahaca fresca

## Almacenamiento

- Se mantiene en el refrigerador por 5 días
- Se congela bien hasta por 3 meses
- Perfecta para preparar con anticipación`,
    emoji: "🍝",
    prepTime: 15,
    cookTime: 35,
    servings: 6,
    difficulty: "Media",
    tags: ["pasta", "cena", "italiana", "lentejas", "preparación-anticipada"],
    author: "Chef Seitan",
    createdAt: "2024-02-20T11:15:00Z",
    updatedAt: "2024-02-20T11:15:00Z",
  },
]

export const mockUser: { email: string; isAdmin: boolean } | null = null
