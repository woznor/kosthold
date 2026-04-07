# Architecture

This project is a static Vue 3 + Vite app for meal planning, shopping-list generation, and nutrient auditing.

The app is designed to run fully on the client side:
- the UI is rendered in the browser
- meal data is loaded from JSON files in `public/`
- user-specific state is stored in `localStorage`
- nutrient verification is calculated locally from a food table plus a controlled ingredient-matching file

## Main Pieces

- Frontend framework:
  [`vue`](./package.json)

- Build tool:
  [`vite`](./package.json)

- State management:
  [`pinia`](./package.json)

- Static datasets:
  [`public/meals.json`](/home/wosvet1/Documents/projects/kosthold/public/meals.json)
  [`public/matvaretabellen.json`](/home/wosvet1/Documents/projects/kosthold/public/matvaretabellen.json)
  [`public/nutrients.json`](/home/wosvet1/Documents/projects/kosthold/public/nutrients.json)
  [`public/ingredient-matching.json`](/home/wosvet1/Documents/projects/kosthold/public/ingredient-matching.json)

- Audit engine:
  [`src/services/nutritionAudit.js`](/home/wosvet1/Documents/projects/kosthold/src/services/nutritionAudit.js)

- App store:
  [`src/stores/app.js`](/home/wosvet1/Documents/projects/kosthold/src/stores/app.js)

- Meal UI:
  [`src/components/MealCard.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/MealCard.vue)
  [`src/components/Nutrients.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/Nutrients.vue)

- CLI audit script:
  [`scripts/nutrient-audit.mjs`](/home/wosvet1/Documents/projects/kosthold/scripts/nutrient-audit.mjs)

## High-Level Flow

1. The app loads meals from [`public/meals.json`](/home/wosvet1/Documents/projects/kosthold/public/meals.json).
2. The store loads the food table from [`public/matvaretabellen.json`](/home/wosvet1/Documents/projects/kosthold/public/matvaretabellen.json).
3. The store loads controlled ingredient mapping from [`public/ingredient-matching.json`](/home/wosvet1/Documents/projects/kosthold/public/ingredient-matching.json).
4. The audit engine matches each meal ingredient to either:
   - a food in Matvaretabellen
   - a manual nutrient entry
   - an intentionally ignored ingredient
5. The engine calculates nutrients from `grams`.
6. The resulting audit object is attached to each meal in the store.
7. The meal card UI shows:
   - the saved nutrient values from the meal
   - and, for fully verified meals, a calculated-vs-saved comparison with ingredient inspection

## Data Model

### Meals

Meals live in [`public/meals.json`](/home/wosvet1/Documents/projects/kosthold/public/meals.json).

Each meal can contain:
- `ingredients`
- `protein_addons`
- `nutrients`
- metadata like `name`, `meal_type`, `image`, `procedure`

Important detail:
- nutrient calculation uses `grams`
- the `number` field is informational only

That means a row like `4 lomper` only affects nutrients through its `grams` value.

### Ingredient Matching

Controlled matching lives in [`public/ingredient-matching.json`](/home/wosvet1/Documents/projects/kosthold/public/ingredient-matching.json).

This file exists so nutrient verification is explicit and editable instead of hidden in code.

It currently supports:
- `aliases`
  Maps app ingredient names to a `foodName` in Matvaretabellen
- `manual`
  Defines nutrients directly per `100g`
- `sameAsAlias`
  Reuses another alias mapping
- `sameAsManual`
  Reuses another manual mapping
- `skip`
  Ignores ingredients entirely in both unresolved lists and calculations

This file is the control layer for the audit system.

## Audit Engine

The nutrient-audit logic lives in [`src/services/nutritionAudit.js`](/home/wosvet1/Documents/projects/kosthold/src/services/nutritionAudit.js).

### Core responsibilities

- Normalize ingredient names with `normalizeIngredient()`
- Build alias and manual lookup tables in `createNutritionAuditEngine()`
- Match ingredients against:
  - skipped items
  - manual entries
  - aliases
  - exact Matvaretabellen `foodName`
  - safe fallback prefix/partial matching
- Calculate nutrient contribution for each ingredient
- Build meal-level audit output with:
  - matched ingredients
  - unmatched ingredients
  - ignored ingredients
  - calculated nutrients
  - saved nutrients
  - delta between them
  - `fullyVerified`

### Calculation rule

For each nutrient:

```text
ingredient contribution = per100g nutrient * (grams / 100)
```

The meal total is the sum of all ingredient contributions.

### Match types

Each matched ingredient gets a `matchType`, such as:
- `manual`
- `alias`
- `exact`
- `single-prefix`
- `single-partial`
- `ignored`

This is surfaced in the UI so you can tell how the ingredient was resolved.

## Store Architecture

The main app store is in [`src/stores/app.js`](/home/wosvet1/Documents/projects/kosthold/src/stores/app.js).

### Important state

- `baseMeals`
  Raw meals loaded from JSON
- `meals`
  Render-ready meals used by the UI
- `nutritionAuditByMealId`
  Audit results keyed by meal id
- `mealPlan`
  Stored plan for upcoming dates
- `favoriteMealIds`
  Saved favorites
- `hiddenShoppingItems`
  User-hidden shopping-list items

### Important actions

- `loadMealsFromFile()`
  Loads `public/meals.json`

- `loadNutritionAudit()`
  Loads:
  [`public/ingredient-matching.json`](/home/wosvet1/Documents/projects/kosthold/public/ingredient-matching.json)
  and
  [`public/matvaretabellen.json`](/home/wosvet1/Documents/projects/kosthold/public/matvaretabellen.json)
  then builds a fresh audit report

- `updateRenderedMeals()`
  Scales meal data for display and attaches `nutritionAudit` to each meal object

- `fetchMeals()`
  Main entry point that loads meals, runs the audit, and updates rendered meals

- `saveMeal()` and `deleteMeal()`
  Recompute the audit after data changes

### Why `baseMeals` and `meals` are separate

`baseMeals` is the source dataset.

`meals` is the rendered version that may include:
- scaled nutrients
- derived display values
- attached audit output

This keeps the original loaded meal data separate from UI-ready transformations.

## UI Architecture

### Meal cards

Meal cards are rendered in [`src/components/MealCard.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/MealCard.vue).

Responsibilities:
- display meal image, title, details, and actions
- pass the meal object into [`Nutrients.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/Nutrients.vue)
- keep image layout consistent across cards

### Nutrient display and audit inspector

The nutrient comparison UI lives in [`src/components/Nutrients.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/Nutrients.vue).

Responsibilities:
- show the saved nutrients from the meal
- show the `Beregnet mot Matvaretabellen` panel when `audit.fullyVerified === true`
- show:
  - calculated vs saved values
  - macro deltas
  - “Hva driver forskjellen?” summaries
  - ingredient-by-ingredient contributions
  - match source labels like `manuell`, `mapping`, `eksakt`, or `automatisk`

This component is the main debugging surface for nutrient mismatches.

## CLI Audit

The script [`scripts/nutrient-audit.mjs`](/home/wosvet1/Documents/projects/kosthold/scripts/nutrient-audit.mjs) is a terminal entry point for the same audit engine used by the app.

Run it with:

```bash
npm run audit:nutrients
```

It loads the same three data sources:
- meals
- Matvaretabellen foods
- ingredient matching

Then it prints:
- summary counts
- top audited meals
- unresolved ingredients

This is useful for maintenance work on the mapping file.

## Persistence

Because the app is built for static hosting, persistent user state is local to the browser.

Current `localStorage` usage in [`src/stores/app.js`](/home/wosvet1/Documents/projects/kosthold/src/stores/app.js):
- `mealPlan`
- `hiddenShoppingItems`
- `favoriteMealIds`
- `showFavoritesOnly`
- `compactMobile`

Important limitation:
- this state is not shared automatically across devices
- GitHub Pages hosts the app, but does not provide shared storage

## Design Decisions

### Why use a matching file

The app ingredient names do not always exactly match Matvaretabellen `foodName` values.

Instead of hardcoding special cases in JavaScript, the project keeps those decisions in:
- [`public/ingredient-matching.json`](/home/wosvet1/Documents/projects/kosthold/public/ingredient-matching.json)

Benefits:
- easier to audit
- easier to update
- no code deploy needed for every mapping decision
- clear distinction between official table matches and manual overrides

### Why use `grams` instead of `number`

`grams` is the most stable basis for nutrient calculation.

`number` is too ambiguous:
- `1 lompe`
- `1 skive ost`
- `1 boks skyr`

Those depend on product size assumptions, while `grams` is explicit.

### Why only show the audit for fully verified meals

Partial matches can be misleading.

The UI currently only shows the detailed comparison box when every non-ignored ingredient has a resolved nutrient source. That keeps the displayed diff more trustworthy.

## Known Limitations

- Some manual entries still need to be maintained by hand
- Generic placeholders like `Saus/dressing` are hard to verify meaningfully
- Static hosting means no cross-device meal-plan sync
- Calculations depend on the correctness of:
  - `grams` in meals
  - manual nutrient inputs
  - ingredient mapping choices

## Safe Change Points

If you want to extend the system later, these are the normal places to work:

- Add or refine ingredient mappings:
  [`public/ingredient-matching.json`](/home/wosvet1/Documents/projects/kosthold/public/ingredient-matching.json)

- Change audit matching logic:
  [`src/services/nutritionAudit.js`](/home/wosvet1/Documents/projects/kosthold/src/services/nutritionAudit.js)

- Change how audit results are presented:
  [`src/components/Nutrients.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/Nutrients.vue)

- Change how meal cards render:
  [`src/components/MealCard.vue`](/home/wosvet1/Documents/projects/kosthold/src/components/MealCard.vue)

- Change store loading/persistence flow:
  [`src/stores/app.js`](/home/wosvet1/Documents/projects/kosthold/src/stores/app.js)

## In Short

The app has three layers:

1. Data:
   meals, Matvaretabellen foods, and controlled matching JSON
2. Logic:
   the audit engine and Pinia store
3. Presentation:
   meal cards and the nutrient audit inspector

The key architectural idea is that nutrient verification is local, explainable, and controlled through data files rather than hidden backend logic.
