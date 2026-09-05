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

- **Branch Naming**: For each issue, create a new git branch named `[issue code]-short-description`.
- **Commit Messages**: Commit messages must follow the format `type[issue code]: summary`.
- **Issue Types**: Use `feat`, `chore`, or `fix` as the type.
- **Example**: For issue `T-01` (feature to create the ESP-32 control layer and IoT gateway), the branch name should be `T-01-create-esp-32-control-layer-and-iot-gateway` and the commit message should be `feat[T-01]: some message`.


## Testing and Verification

- Always run `pnpm -r typecheck` before committing changes to ensure type safety across the monorepo.
- Ensure any changes to the data pipeline are validated against the "Tracer Bullet" implementation patterns.
