# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a single-repo Spring Boot + Angular application. The backend and frontend are built together by Maven using the `frontend-maven-plugin`. The Angular output is bundled into the Spring Boot jar as static resources.

```
recipe/
├── src/main/
│   ├── java/          # Spring Boot backend
│   ├── resources/
│   │   ├── config/    # application.yml and profile variants
│   │   ├── db/changelog/  # Liquibase changelogs
│   │   ├── docker/    # Dockerfile
│   │   └── static/    # Angular build output (generated — do not edit directly)
├── src/test/          # Unit and integration tests
├── ui/                # Angular frontend source
│   ├── src/
│   └── package.json
└── pom.xml
```

## Build & Test Commands

### Backend (Maven)

```bash
# Full build including Angular and integration tests
mvn verify

# Build without integration tests (faster)
mvn verify -DskipITs

# Run unit tests only
mvn test

# Run a single unit test class
mvn test -Dtest=RecipeServiceTest

# Run integration tests only
mvn failsafe:integration-test failsafe:verify

# Run a single integration test class
mvn verify -Dit.test=RecipeIT -DskipTests
```

Unit tests (`*Test.java`) run with an H2 in-memory database. Integration tests (`*IT.java`) use Testcontainers with a real MariaDB container.

### Frontend (Angular)

```bash
cd ui

npm install           # install dependencies
npm run build         # production build
npm test              # run tests (interactive)
npm run test-headless # run tests in CI mode (ChromeHeadless)
npm run lint          # lint
```

### Dev server

```bash
cd ui
npm start             # Angular dev server with proxy to local backend
```

The dev proxy forwards `/recipe/api/` to `localhost:8080`.

## Architecture

### Request Flow

Controllers (`controller/`) → Services (`service/`) → Repositories (`repository/`)

Controllers handle HTTP mapping only; all business logic lives in services. DTOs are the API boundary — MapStruct mappers handle entity↔DTO conversions. Never expose JPA entities directly from controllers.

### API URL Structure

All REST endpoints are served under `/api/v1`. Nginx rewrites `/recipe/api/v1/` → `/api/v1/` in production.

### Angular Frontend

The Angular app is built by Maven into `src/main/resources/static/`. In production, Spring Boot serves it as static content. The Angular router uses `PathLocationStrategy` — Spring Boot has a catch-all that returns `index.html` for any non-API path.

## Spring Profiles

| Profile | Database | Notes |
|---------|----------|-------|
| *(default)* | H2 in-memory | For unit tests |
| `dev` | MariaDB (local) | For local development |
| `pdn` | MariaDB (production) | Production |

## Database Migrations

Liquibase changelogs live in `src/main/resources/db/changelog/`. The master file is `db.changelog-master.yaml`. Individual changelogs are numbered sequentially (e.g. `db.changelog-001-ingredient.yaml`). Spring Boot runs migrations automatically on startup.

Never modify an existing changelog that has already been applied to any environment — always add a new numbered changelog file.

## Testing Conventions

- Unit tests are named `*Test.java` and live alongside source; Surefire picks them up.
- Integration tests are named `*IT.java` and live under `src/test/java/.../integration/`; Failsafe picks them up.
- Integration tests use Testcontainers (MariaDB) and `@SpringBootTest` with `@ActiveProfiles("it")`.

## Docker

The app runs as a single container (`recipe`) on the shared `jbr-network` Docker network. The Dockerfile is at `src/main/resources/docker/Dockerfile`.

```bash
# Build image locally
docker build -f src/main/resources/docker/Dockerfile -t recipe .

# Run locally (requires jbr-network and a MariaDB instance)
docker compose up -d
```

## CI/CD

Built by a self-hosted GitHub Actions runner on push to the `Release` branch. The workflow:
1. Builds with `mvn verify` (includes Angular build and integration tests)
2. Runs Sonar analysis
3. Builds and pushes the Docker image to `nexus.jbrmmg.me.uk:8083`
4. Deploys by pulling from `nexus.jbrmmg.me.uk:8084` and running `docker compose up -d`

Version format: `YYYY.MM.<run_number>`

## Production Environment Variables

```
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

GitHub secrets: `NEXUS_PASSWORD`, `SONAR_TOKEN`, `DB_PDN_RECIPE_SERVER`, `DB_PDN_RECIPE_USER`, `DB_PDN_RECIPE_PASSWORD`
