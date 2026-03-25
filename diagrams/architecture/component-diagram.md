# KubeLite - System Architecture

## Architecture Overview

```mermaid
flowchart TB
    subgraph ControlPlane["API & Control Plane"]
        Git[("Git Repository")]
        Dev["User / CLI"]
        API["KubeLite API\n(Spring Boot)"]
        MQ[("RabbitMQ\n(Job Queue)")]
        DB[("PostgreSQL\n(State)")]
    end

    subgraph BuildEngine["Build & Packaging Engine"]
        Worker["Deployment Worker"]
        Tekton["Tekton / Kaniko\n(Ephemeral Build)"]
        Registry[("Image Registry")]
    end

    subgraph RuntimeCluster["Production Runtime Cluster"]
        K8s["Kubernetes API"]
        App1["App Instance A"]
        App2["App Instance B"]
        Ingress["Global Ingress\n(Traffic)"]
        Observability["Metrics & Logs"]
    end

    Dev -->|"Deploy Request"| API
    API -->|"Persist State"| DB
    API -->|"Publish Job"| MQ
    MQ -->|"Build & Package"| Worker
    Worker -->|"Orchestrate"| Tekton
    Git -.->|"Source Code"| Tekton
    Tekton -->|"Push Image"| Registry
    Worker -->|"Deploy Manifests"| K8s
    Registry -.->|"Pull Image"| App1
    Registry -.->|"Pull Image"| App2
    App1 --> Ingress
    App2 --> Ingress
    Ingress -->|"Client Traffic"| App1
    App1 -.->|"Observability"| Observability
```

## Component Descriptions

| Component | Layer | Technology | Functional Description |
| :--- | :--- | :--- | :--- |
| **KubeLite API** | Control Plane | Spring Boot 3 | Central management API for application orchestration. |
| **Deployment Worker** | Build Engine | Spring Modulith | Executes build workflows and manages cluster state. |
| **Tekton / Kaniko** | Build Engine | Tekton / Kaniko | Cloud-native build tools for secure image creation. |
| **Kubernetes API** | Runtime | EKS / GKE / K3s | Container orchestration platform for application hosting. |
| **Global Ingress** | Runtime | Traefik / Nginx | Manages external traffic routing and SSL termination. |
| **PostgreSQL** | Control Plane | PostgreSQL | Persistent storage for platform configurations and state. |
