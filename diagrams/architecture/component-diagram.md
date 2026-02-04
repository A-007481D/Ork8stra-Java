# Ork8stra V2 - Component Diagram

## Visual Architecture

[//]: # (![V3 Architecture]&#40;./v2-architecture.png&#41;)

```mermaid
flowchart TB
    subgraph UserSpace["User Space"]
        Git[("Git Repository\n(GitHub/GitLab)")]
        Dev["Developer\n(Browser/CLI)"]
    end

    subgraph ControlPlane["Control Plane - The Brain"]
        LB["Load Balancer\n(Traefik/Nginx)"]
        API["API Service\n(Spring Boot)"]
        MQ[("RabbitMQ\n(Job Queue)")]
        DB[("PostgreSQL\n(State)")]
        Redis[("Redis\n(Live Logs)")]
    end

    subgraph WorkerPlane[" Worker Plane - The Muscle"]
        Worker["Worker Service\n(Spring Boot Module)"]
        K8s["Kubernetes API"]
        Kaniko["Kaniko Pod\n(Ephemeral)"]
        Registry[("Docker Registry")]
        MinIO[("MinIO\n(Log Archive)")]
    end

    subgraph UserApps["Deployed Apps"]
        App1["User App 1"]
        App2["User App 2"]
    end

    Dev -->|"POST /deploy"| LB
    LB --> API
    API -->|"persist"| DB
    API -->|"publish job"| MQ
    MQ -->|"consume"| Worker
    Worker -->|"create pod"| K8s
    K8s --> Kaniko
    Git -.->|"clone"| Kaniko
    Kaniko -->|"push image"| Registry
    Worker -->|"update state"| DB
    Worker -->|"stream logs"| Redis
    Redis -.->|"WebSocket"| Dev
    Worker -->|"archive"| MinIO
    Worker -->|"deploy manifest"| K8s
    Registry -.->|"pull"| App1
    Registry -.->|"pull"| App2
```

## Component Descriptions

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Load Balancer** | Traffic routing, SSL termination | Traefik / Nginx Ingress |
| **API Service** | REST API, orchestration | Spring Boot 3 |
| **RabbitMQ** | Async job dispatch | AMQP message broker |
| **PostgreSQL** | Persistent state storage | Relational DB |
| **Redis** | Live log streaming | Pub/Sub + Cache |
| **Worker Service** | Build & deployment execution | Spring Boot module |
| **Kaniko** | Docker image building | Ephemeral K8s Pod |
| **MinIO** | Log archival | S3-compatible storage |
| **Docker Registry** | Image storage | Harbor / DockerHub |
