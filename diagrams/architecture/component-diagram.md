# KubeLite - System Architecture

## Visual Architecture (The Infrastructure Stream)

[//]: # (![V3 Architecture]&#40;./v2-architecture.png&#41;)

```mermaid
flowchart TB
    subgraph Stream_Ingest["STAGE 1: INGEST"]
        Git[("Git Repository\n(GitHub/GitLab)")]
        Dev["Developer\n(Command Palette/CLI)"]
    end

    subgraph Stream_Forge["STAGE 2: FORGE"]
        subgraph ControlPlane["Control Plane"]
            API["KubeLite API\n(Spring Boot)"]
            MQ[("RabbitMQ\n(Job Queue)")]
            DB[("PostgreSQL\n(State)")]
        end
        
        subgraph WorkerPlane["Worker Engine"]
            Worker["Deployment Worker"]
            Tekton["Tekton / Kaniko\n(Ephemeral Build)"]
            Registry[("Image Registry")]
        end
    end

    subgraph Stream_Pulse["STAGE 3: PULSE"]
        subgraph RuntimePlane["Production Cluster"]
            K8s["Kubernetes API"]
            App1["App Instance A"]
            App2["App Instance B"]
            Ingress["Global Ingress\n(Traffic)"]
        end
        
        Observability["Metrics & Logs\n(Prometheus/Grafana)"]
    end

    Dev -->|"Push / Deploy"| API
    API -->|"Trigger Forge"| MQ
    MQ -->|"Build & Package"| Worker
    Worker -->|"Orchestrate"| Tekton
    Git -.->|"Source"| Tekton
    Tekton -->|"Push Artifact"| Registry
    Worker -->|"Deploy"| K8s
    Registry -.->|"Pull"| App1
    Registry -.->|"Pull"| App2
    App1 --> Ingress
    App2 --> Ingress
    Ingress -->|"Traffic Pulse"| Dev
    App1 -.->|"Health/Logs"| Observability
```

## Component Descriptions

| Component | Stage | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **KubeLite API** | Ingest | Spring Boot 3 | The central brain for orchestration and user interface. |
| **Deployment Worker** | Forge | Spring Modulith | Manages the build lifecycle and Kubernetes state. |
| **Tekton / Kaniko** | Forge | Tekton / Kaniko | Cloud-native image building without Docker-in-Docker. |
| **Kubernetes API** | Pulse | EKS / GKE / K3s | The target runtime for all deployed applications. |
| **Global Ingress** | Pulse | Traefik / Nginx | Handles the traffic pulse and edge routing. |
| **PostgreSQL** | Control | PostgreSQL | Persistent storage for platform and application state. |
