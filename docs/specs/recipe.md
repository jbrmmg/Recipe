# JBR-716 Recipe Application

## Objective

A web-based application for managing and cooking recipes, available on the home network (no user authentication required). The app covers the full lifecycle: maintaining an ingredient database, building recipes with timed steps, searching/filtering recipes, and guiding the user through cooking with timers and alarms.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot (Java) |
| Frontend | Angular (TypeScript) |
| Database | MariaDB |
| API style | REST |

---

## Core Entities

### Ingredient (Master List)
A managed database of known ingredients, independent of any recipe.

- Name
- Default unit (g, ml, tsp, tbsp, cup, item, etc.)
- Purchase quantity (e.g. 500g, 1 litre, 6 pack) — used for shopping list generation
- Purchase unit (the unit the item is sold in)
- Category (e.g. Dairy, Meat, Produce, Tinned, Spices) — for grouping the shopping list

> Managed via a dedicated CRUD screen so ingredients are reused consistently across recipes.

### Recipe Ingredient
Links a recipe to an ingredient from the master list, with the quantity needed for the recipe's base serving size.

- Ingredient (reference to master list)
- Quantity required (for base serving size)
- Unit
- Notes (e.g. "finely chopped", "at room temperature")

> When cooking, quantities are scaled proportionally if the user adjusts the serving count.

### Recipe Step
Each step belongs to one of two phases: **Prep** or **Cook**.

- Phase (`PREP` or `COOK`)
- Order (integer — defines sequence within the phase)
- Parallel group (optional — steps sharing the same group run simultaneously, e.g. "while X is frying, do Y")
- Description (instruction text)
- Duration (minutes / seconds)
- Timer required (boolean — whether this step needs an alarm when time expires)

> Steps within the same parallel group run concurrently. The next sequential step only starts after all steps in the current parallel group are complete.

### Recipe
- Title
- Description (short summary)
- Base servings (number of people the recipe is written for)
- Prep time (derived from prep steps, or manually overridden)
- Cook time (derived from cook steps, or manually overridden)
- Tags (many-to-many — assigned from the managed tag list)
- Ingredients (list of Recipe Ingredients at base serving size)
- Prep steps (ordered list)
- Cook steps (ordered list, supports parallel groups)
- Image (optional — stored on filesystem; path reference held in DB)
- Created date / Last modified date

### Tag
A centrally managed list of tags, assigned to recipes to support search and filtering.

- Name (e.g. "vegetarian", "quick", "batch cook", "Italian", "gluten-free")

> Tags are managed via a dedicated Tag Management screen and then assigned to recipes. They are not free-text per recipe.

---

## Features

### Phase 1 — Core Recipe Management

- **Ingredient master list** — CRUD screen to manage ingredients with purchase quantity and category
- **Tag management** — CRUD screen to manage the list of available tags
- **Recipe CRUD** — Create, view, edit, and delete recipes including assigning tags and ingredients
- **Recipe list / browse** — View all recipes with title, tags, image thumbnail, and times
- **Recipe detail view** — Full recipe: ingredients, prep steps, cook steps, times, servings
- **Search** — Search by recipe title or tag
- **Find by ingredient** — Search for recipes that contain **all** of the supplied ingredients
- **Filter** — Filter recipe list by tag, total time, etc.

### Phase 2 — Guided Cooking Mode

A step-by-step interactive mode that guides the user through cooking a recipe.

- **Serving size selection** — Before starting, choose how many people you are cooking for; all ingredient quantities scale proportionally from the base serving size
- Display current step(s) — shows one step at a time, or multiple steps simultaneously if in a parallel group
- **Per-step timer** — countdown for steps that have a duration
- **Alarm** — both a browser notification and an audio beep when a timed step completes and the next is due
- **Pause / Resume** — pause all active timers; resume from where you left off
- **Progress indicator** — shows where you are in the recipe (e.g. step 3 of 8)
- Separate display for Prep phase and Cook phase

### Phase 3 — Shopping List

- Select one or more recipes (and the serving size for each)
- **Generate shopping list** — aggregates ingredient quantities across selected recipes, scaled to chosen serving sizes
- Groups shopping list items by ingredient category (e.g. Dairy, Produce, Spices)
- Uses purchase quantity from the ingredient master list to suggest how many packs/units to buy (e.g. "800g flour needed → buy 2 × 500g bags")
- Ability to mark items as already in stock to exclude them from the list

---

## API Outline (Draft)

### Ingredients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | List all ingredients (searchable) |
| GET | `/api/ingredients/{id}` | Get a single ingredient |
| POST | `/api/ingredients` | Create an ingredient |
| PUT | `/api/ingredients/{id}` | Update an ingredient |
| DELETE | `/api/ingredients/{id}` | Delete an ingredient |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create a tag |
| PUT | `/api/tags/{id}` | Update a tag |
| DELETE | `/api/tags/{id}` | Delete a tag |

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List recipes (with search, filter, pagination) |
| GET | `/api/recipes/{id}` | Get full recipe detail |
| POST | `/api/recipes` | Create a recipe |
| PUT | `/api/recipes/{id}` | Update a recipe |
| DELETE | `/api/recipes/{id}` | Delete a recipe |
| GET | `/api/recipes/by-ingredient` | Find recipes containing all given ingredient IDs |

### Shopping List
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shopping-list` | Generate a shopping list from recipe IDs + serving sizes |

---

## Infrastructure & Deployment

### Database Migrations — Liquibase
Database schema changes are managed via Liquibase changelogs stored under `src/main/resources/db/changelog/`. Spring Boot auto-runs migrations on startup.

### Docker
The application is a **single Docker container** (`recipe`). The Angular frontend is built into the Spring Boot jar via the `frontend-maven-plugin` (output copied to `src/main/resources/static`), so the Spring Boot container serves both the API and the UI.

| Container | Image | Port |
|-----------|-------|------|
| `recipe` | `nexus.jbrmmg.me.uk:8084/recipe:latest` | 8080 |

- MariaDB is an existing external instance — not managed by this project.
- The container joins the shared `jbr-network` Docker network.
- Dockerfile lives at `src/main/resources/docker/Dockerfile` (consistent with Money/Backup).

### CI/CD — GitHub Actions
Self-hosted runner, consistent with Money and Backup. The workflow (on push to `Release` branch) will:

1. Check out and set up JDK 21 (Temurin)
2. Configure Maven to use the Nexus repository (`nexus.jbrmmg.me.uk:8081`)
3. Compute version as `YYYY.MM.<run_number>`
4. `mvn verify` — builds Angular, runs tests (including integration tests via Testcontainers)
5. Run Sonar analysis
6. Build Docker image, tag as `:<sha>` and `:latest`, push to `nexus.jbrmmg.me.uk:8083`
7. Deploy: pull from `nexus.jbrmmg.me.uk:8084`, `docker compose up -d`

GitHub secrets required: `NEXUS_PASSWORD`, `SONAR_TOKEN`, `DB_PDN_RECIPE_SERVER`, `DB_PDN_RECIPE_USER`, `DB_PDN_RECIPE_PASSWORD`.

### Reverse Proxy — nginx
The existing nginx instance at `../WebPage/nginx` will be updated to add a `/recipe/` location block, following the same pattern as Money and Backup:

```nginx
location /recipe/api/v1/ {
    rewrite            ^/recipe(/.*)$       $1 break;
    proxy_pass         http://recipe:8080;
    ...
}

location /recipe/docs/ {
    rewrite            ^/recipe/docs(/.*)?$ $1 break;
    proxy_pass         http://recipe:8080;
    # sub_filter to rewrite Swagger API doc paths
    ...
}

location /recipe/ {
    rewrite            ^/recipe(/.*)?$      /$1 break;
    proxy_pass         http://recipe:8080;
    ...
}
```

---

## Decisions Log

| # | Decision |
|---|----------|
| 1 | Images stored on filesystem; path reference held in the DB |
| 2 | Cooking alarms trigger both a browser notification and an audio beep |
| 3 | "Find by ingredient" returns recipes containing **all** supplied ingredients |
| 4 | Recipes define a base serving size; quantities scale proportionally in guided cooking mode |
| 5 | Tags are a centrally managed list (tag management screen); assigned to recipes, not free-text |
