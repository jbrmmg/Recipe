# Recipe

A home-network web application for managing and cooking recipes.

Built with Spring Boot (backend REST API) and Angular (frontend), packaged as a single Docker container.

## Features

- **Ingredient library** — maintain a database of ingredients with purchase quantities, used to generate shopping lists
- **Recipe management** — create and manage recipes with a list of ingredients, timed prep steps, and timed cook steps (including parallel steps)
- **Search & filter** — find recipes by name, tag, or ingredient
- **Guided cooking mode** — step-by-step cook mode with per-step countdown timers, alarms, and pause/resume
- **Shopping list** — generate an aggregated shopping list from one or more recipes, grouped by category

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3 (Java 21) |
| Frontend | Angular (TypeScript) |
| Database | MariaDB |
| Migrations | Liquibase |
| Container | Docker |

## Development Setup

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+ and npm
- MariaDB (or Docker for integration tests — Testcontainers handles this automatically)

### Running locally

1. Start a local MariaDB instance, or let integration tests use Testcontainers automatically.

2. Build the backend (skipping integration tests for speed):
   ```bash
   mvn verify -DskipITs
   ```

3. Run the Angular dev server with a proxy to the local backend:
   ```bash
   cd ui
   npm install
   npm start
   ```
   The UI is available at `http://localhost:4200`.

### Running the full build

```bash
mvn verify
```

This builds the Angular app, runs unit and integration tests, and packages everything into a single jar.

### Integration tests and Docker API version

Integration tests use Testcontainers to spin up a MariaDB container. Testcontainers bundles its own shaded copy of docker-java, which defaults to Docker API version 1.32. Docker Engine 25+ raised its minimum accepted API version to 1.40, so running the tests against a modern Docker daemon fails with:

> `client version 1.32 is too old. Minimum supported API version is 1.40`

**Fix** — create `~/.docker-java.properties` in the home directory of whoever runs the tests (developer machine or CI runner):

```properties
api.version=1.41
```

This file is read automatically by docker-java on startup. The CI workflows (`build.yml`, `dev.yml`) create this file as a step before the Maven build, so no manual action is needed on the runner. On a developer machine, create it once and it will apply to all projects (Money, Backup, etc.) that use Testcontainers.

## Docker

The app runs as a single container. In production it sits on the shared `jbr-network` Docker network, behind the shared nginx reverse proxy at `/recipe/`.

```bash
# Build
docker build -f src/main/resources/docker/Dockerfile -t recipe .

# Run
docker compose up -d
```

## Deployment

Deployment is automated via GitHub Actions on push to the `Release` branch. The workflow builds, tests, and pushes a Docker image to the private Nexus registry, then deploys to the home server.

## Related Projects

| Project | Description |
|---------|-------------|
| [WebPage](../WebPage) | Shared nginx reverse proxy and home page Angular app |
| [Money](../Money) | Financial management app |
| [Backup](../Backup) | Backup management app |
