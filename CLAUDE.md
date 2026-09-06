# CLAUDE.md - IoTFlow Development Guide

## Build and Test Commands

### Core Commands

- Build all packages: `pnpm -r build`
- Check types: `pnpm -r typecheck`
- Run development gateway: `pnpm dev:gateway`

### Package-specific Commands

(Refer to individual `package.json` files in `apps/` and `packages/` for specific test/lint scripts)

## Development Workflow

### Coding Standards

- **Polyglot Environment**: This repository contains code in **Java, TypeScript, C++, Go, and Python**. Ensure your editor is configured with the appropriate language servers.
- **Monorepo Management**: Use `pnpm` for all dependency and workspace operations.

- **Data Contracts**: Adhere to the **Manifest-based self-describing data strategy**. Any new data stream must include or update its corresponding manifest.
- **Architecture Adherence**: All data processing must follow the **Medallion Architecture** (Bronze, Silver, Gold layers).

### Project Structure

- `apps/`: High-level applications (e.g., Gateway, Alerting).
- `packages/`: Reusable libraries and modules.
- `infrastructure/`: Infrastructure as Code (IaC) and deployment configurations (Kafka, MinIO).
- `devices/`: Definitions and logic for IoT device simulations or integrations.

## Issue Workflow

### Issue Creation Standards

All new issues must follow a professional, structured format to ensure clarity and engineering alignment. Every issue should include the following sections:

- **Title**: A concise, action-oriented title (e.g., "[T-XX] Short Description").
- **Overview**: A high-level summary of the task.
- **Context**: The technical rationale or "why" behind the issue.
- **Proposed Implementation**: A technical outline of the approach or components involved.
- **Acceptance Criteria**: A checklist of verifiable requirements (using `- [ ]` syntax) that must be met to consider the issue resolved.

Furthermore, if an issue should have relationships, they must be defined on issue creation.

### Branching

For each issue, create a new git branch named `[issue code]-short-description`. Any changes or commit related to an issue should only be pushed to the corresponding branch.

### Commit Messages

Commit messages must follow the format `type[issue code]: summary`. If no issue is related to the commit, then issue code will be `no-issue`.

- **Issue Types**: Use `feat`, `chore`, or `fix` as the type. The type of an issue must be mentioned in the issue description.
- **Example**: For issue `T-01` (feature to create the ESP-32 control layer and IoT gateway), the branch name should be `T-01-create-esp-32-control-layer-and-iot-gateway` and the commit message should be `feat[T-01]: some message`.

## Testing and Verification

- Always run `pnpm -r typecheck` before committing changes to ensure type safety across the monorepo.
- Ensure any changes to the data pipeline are validated against the "Tracer Bullet" implementation patterns.
