# IoTFlow

IoTFlow is a robust, scalable IoT data processing environment built on a **Medallion Architecture** and a **Manifest-based self-describing data strategy**.

The project facilitates the routing of high-frequency sensor streams through **Kafka** into **S3-compatible storage (MinIO)**, enabling both real-time alerting and deep historical analysis.

## 🏗 Architecture

The project implements a **Medallion Architecture** to manage data quality and structure across three distinct layers:

- **Bronze (Raw):** Landing zone for raw, ingested sensor streams directly from the source.
- **Silver (Validated/Cleaned):** Data that has been parsed, validated against manifests, and cleaned of inconsistencies.

- **Gold (Aggregated/Business-ready):** Highly refined, aggregated, and feature-rich datasets prepared for analytical workloads and alerting.

### System Architecture

Status legend: `[built]` exists in the repo today, `[partial]` started, `[planned]` not started.

```text
                         INTERNET
                             │
                             ▼
                      ┌──────────────┐
                      │ React Client │  [planned]
                      └──────┬───────┘
                             │
                          GraphQL
                             │
                             ▼
                  ┌─────────────────────┐
                  │ GraphQL BFF / API   │
                  │ TypeScript          │  [planned]
                  └──────────┬──────────┘
                             │
                   ┌─────────┼─────────┐
                   │         │         │
                  gRPC      gRPC      gRPC
                   │         │         │
                   ▼         ▼         ▼
              Device       Alert    Analytics
              Service      Service   Service
                Go           Go      Python
             [planned]    [planned]  [planned]

────────────────────────────────────────────────────────

                             ▲
                             │
                           Kafka  [infra built, not yet wired to the gateway]
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼

     IoT Gateway       Stream Processor     Data Pipeline
     TypeScript        TypeScript today     Python
     [built]           (Java planned)       [planned]
          ▲            [partial]
          │
         MQTT
          │
          ▼
   Device Simulator [built]
   ESP32 hardware   [planned]

────────────────────────────────────────────────────────

 Storage (Medallion layers)

   Gateway ──► Bronze  (MinIO)      [built]   raw { manifest, payload }
   Gateway ──► PostgreSQL           [built]   devices + parsed telemetry
   Stream Processor ──► Silver      [planned] validated, normalized
   Data Pipeline    ──► Gold        [planned] aggregated, business-ready
```

| Component | Location | Status |
| --- | --- | --- |
| IoT Gateway (MQTT to Bronze and PostgreSQL, manifest validation) | `apps/gateway` | Built |
| Device Simulator (temperature/humidity over MQTT) | `devices/simulator` | Built |
| Shared data contracts and manifest | `packages/shared` | Built |
| Stream Processor (Bronze to Silver) | `apps/stream-processor` | Partial: transformer only, no Kafka consumer or Silver output yet |
| Kafka, MinIO, Mosquitto, PostgreSQL | `infrastructure/` | Built |
| Device, Alert and Analytics services (gRPC) | not yet created | Planned |
| GraphQL BFF and React client | not yet created | Planned |
| Data Pipeline (Gold aggregation, batch analytics) | not yet created | Planned |

## 📊 Data Strategy: Manifest-based Self-Description

To ensure interoperability and scalability, IoTFlow utilizes a **Manifest-based strategy**. Every data stream is accompanied by a manifest that describes:

- **Schema Definitions:** Detailed structure of the payload.
- **Metadata:** Source information, timestamps, and sensor properties.
- **Data Contracts:** Enforced rules for ingestion and transformation.

This approach allows for a "self-describing" ecosystem where new devices and sensors can be integrated with minimal manual configuration.

## 🛠 Technology Stack

IoTFlow leverages a polyglot approach to utilize the best tools for each part of the pipeline:

- **Languages:** **Java**, **TypeScript**, **C++**, **Go**, and **Python** for high-performance processing, gateway logic, and analytical scripting.
- **Streaming & Messaging:** **Apache Kafka** for reliable, high-throughput message orchestration.
- **Storage:** **MinIO** (S3-compatible) for durable, scalable, and cost-effective object storage.
- **Package Management:** **pnpm** workspaces for efficient monorepo management.

## 🚀 Implementation Roadmap: "Tracer Bullets"

Development follows the **"Tracer Bullets"** methodology. We focus on implementing thin, end-to-end slices of functionality (from device ingestion to S3 storage) to validate the architecture, identify bottlenecks, and prove the technical feasibility of the Medallion and Manifest-based approaches before full-scale deployment.

## 📁 Project Structure

```text
.
├── apps/           # Core applications (Gateway, Alerting, etc.)
├── packages/       # Reusable libraries and modules
├── infrastructure/ # IaC, Kafka, and MinIO configurations
├── devices/        # IoT device simulations and integrations
├── CLAUDE.md       # Development guidelines
└── README.md       # Project overview
```

## 🛠 Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) (version 11.23.0+)
- Docker/Kubernetes (for local Kafka and MinIO instances)

### Running the Project

1. **Install dependencies:**
    ```bash
    pnpm install
    ```
2. **Run the development gateway:**
    ```bash
    pnpm dev:gateway
    ```
3. **Build the workspace:**
    ```bash
    pnpm -r build
    ```
