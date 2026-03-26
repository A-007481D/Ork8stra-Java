# 🏁 Ork8stra Technical Jury Handbook (CONFIDENTIAL) 🏁

This document is your **Master Source of Truth** for the Ork8stra Platform's architecture, deployment lifecycle, and technical health. It is designed to prepare you for any "How does this actually work?" questions from the jury.

---

## 🏗️ 1. High-Level Architecture
Ork8stra is a **Container Orchestration & CI/CD Platform** that abstracts Kubernetes for developers.

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion (for premium UI/UX).
- **Backend**: Java 21 + Spring Boot 3.5 + Spring Security (JWT-based).
- **Database**: PostgreSQL (Entities/States) + Redis (Cache/Sessions).
- **Storage**: Minio (S3-compatible) for build artifacts and logs.
- **Messaging**: RabbitMQ (Async build/deploy events).
- **Cluster**: Kubernetes (Local k3s/minikube) using **Fabric8 Java Client**.

---

## 🚀 2. The Deployment Pipeline (Step-by-Step)
This is how a project goes from "Git URL" to "Live URL".

1.  **Source Identification**: The user provides a Git URL (GitHub/Git URL).
2.  **Clone Step**: The `DeploymentService` clones the repo into a temporary workspace.
3.  **Build Execution**:
    *   **Nixpacks**: If no Dockerfile is found, we use **Nixpacks** to auto-detect the environment (Node, Go, Python) and generate an OCI image.
    *   **Kaniko**: We use **Kaniko** inside the cluster to build the image *without* requiring privileged Docker-in-Docker access (Security First).
4.  **OCI Registry**: The built image is pushed to the local Ork8stra registry.
5.  **Reconciliation**:
    *   `DeploymentService` applies the Kubernetes **Deployment**, **Service**, and **Ingress** resources.
    *   **Magic Port Resolution Hub**: (NEW) If the user provides a wrong port (or leaves the default 3000), the platform now "Magic-fixes" it by:
        1. Peering into the **OCI Image Metadata** for the source of truth.
        2. Applying **Framework Heuristics** (e.g., if Name contains "Angular", it favors port 80/8080).
        3. This makes the platform "port-agnostic" and user-error proof.

---

## ❤️ 3. Technical Honesty: The Health Watcher
*The most important part of your presentation!*

The platform doesn't just "guess" if an app is running. It performs **Active Reconciliation**:
- **ServiceHealthWatcher**: A background loop that watches the Kubernetes API in real-time.
- **Label-based Tracking**: Every resource is labeled with `ork8stra.com/app-id`.
- **Honest Status**: If a pod crashes or is pending, the Watcher sees the `ReadyReplicas` count drop and immediately updates the backend DB. The Dashboard then auto-refreshes (every 10s) to show the change.

---

## 🚦 4. Status Mapping Matrix
*How Backend states map to what the User sees:*

| Backend Status (`DeploymentStatus`) | UI Badge | Logic / Meaning |
| :--- | :--- | :--- |
| `IN_PROGRESS` | **BUILDING** (Yellow) | Build job is running or Pods are currently scaling up. |
| `HEALTHY` | **LIVE** (Green) | Kubernetes `ReadyReplicas` >= `DesiredReplicas`. App is reachable. |
| `FAILED` | **FAILED** (Red) | Build failed or Pods crashed repeatedly (Back-off). |
| `STOPPED` | **STOPPED** (Gray) | Deployment was scaled to 0 replicas manually. |

---

## 🔧 5. Troubleshooting Guide (For the Presentation)
If something goes wrong during the demo, check these:

- **"Stuck in Building"**: Check `kubectl get jobs -A`. If a Kaniko job is pending, the cluster might be out of resources.
- **"Application Starting" Page**: This is our custom Nginx Error Handler. It means the Pod exists but isn't responding yet (Health Check is still warm). Wait 10-20 seconds.
- **Link not working (404)**: Ensure the `Ingress` host (`local.kubelite.io`) is mapped in your `/etc/hosts` to the Minikube/K8s IP.
- **Spamming Logs**: This was usually an infinite loop in the frontend `useCallback`. *Fixed!*

---

## 🔒 6. Key Security Points (Jury Likes This)
- **Namespace Isolation**: Every project gets its own K8s Namespace.
- **RBAC**: Users can only see projects/apps within their assigned Team and Organization.
- **Network Policies**: (Simulation) We ensure projects cannot talk to each other cross-namespace unless connected via ReactFlow.

---

**🏁 Presentation Tip**: Emphasize that Ork8stra is **Environment-Aware**. It doesn't just run scripts; it monitors the actual state of the cluster every second. That is "Technical Honesty".
