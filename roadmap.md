# Ork8stra (KubeLite) Development Roadmap
**Current Date:** January 26, 2026
**Deadline:** March 30, 2026
**Total Duration:** 9 Weeks

## 🎯 Project Goals

### MVP Goal (Target: Feb 28, 2026)
A functional "Walking Skeleton" that can:
1.  **Authenticate** users (Login/Register).
2.  **Create** a Project and Application entity.
3.  **Trigger** a mock build/deployment process (even if not fully running inside K8s yet).
4.  **Visualize** status updates via simple API polling.

### Final Goal (Target: March 30, 2026)
A production-ready PaaS featuring:
1.  **Full CI/CD**: Git based source-to-image (Kaniko) and deployment to K8s.
2.  **Real-time Features**: Live build logs via WebSockets (Redis/RabbitMQ).
3.  **Multi-tenancy**: Organization-based user grouping.
4.  **Observability**: Application logs archived in MinIO.
5.  **Polished UI**: Responsive Angular Dashboard.

---

## 🛠️ Technical Constraints & Specs

-   **Backend**: Spring Boot 3.5 (Modular Monolith).
-   **Frontend**: Angular 17+ (standalone components).
-   **Database**: PostgreSQL (Entities: User, Org, Project, App, Deployment, Build).
-   **Orchestration**: Kubernetes (Fabric8 client).
-   **Builds**: Kaniko (running as K8s Jobs).
-   **Messaging**: RabbitMQ (Event-driven architecture for Build/Deploy events).
-   **Caching/Stream**: Redis (Real-time logs, Caching).
-   **Storage**: MinIO (S3 compatible for Log Archiving).

---

## 📅 Weekly Timeline

### Phase 1: Foundation & Core Backend (Weeks 1-3)
*Focus: Data Modeling, Auth, and Infrastructure Setup*

#### Week 1: Jan 26 - Feb 1 (Current)
-   [x] **Security**: Review existing JWT/Security Config.
-   [ ] **Refactor**: Ensure clean separation of `auth` and `user` domains.
-   [ ] **Domain Modeling**: Implement missing `Organization` domain. Establish relationships: `Org -> Project -> App`.
-   [ ] **Infra**: Update `compose.yaml` to include RabbitMQ, Redis, and MinIO.

#### Week 2: Feb 2 - Feb 8
-   [ ] **Messaging Layer**: Implement RabbitMQ configuration and `EventPublisher` port.
-   [ ] **Project/App Modules**: Complete CRUD APIs for Projects and Applications.
-   [ ] **Git Integration**: Implement service to validate Git Repos URLs and fetch branches/tags.

#### Week 3: Feb 9 - Feb 15
-   [ ] **K8s Connectivity**: Configure Fabric8 client. Connect to a local K8s cluster (minikube/k3d).
-   [ ] **Build Engine (Part 1)**: Design the `BuildJob` payload. Create logic to spawn a "Hello World" pod via the API.

### Phase 2: The Engine & MVP (Weeks 4-6)
*Focus: CI/CD Logic and Basic UI*

#### Week 4: Feb 16 - Feb 22
-   [ ] **Build Engine (Part 2)**: Integrate Kaniko.
    -   Generate `Dockerfile` (or use existing).
    -   Create K8s Job specifically for Kaniko build.
-   [ ] **Deployment Engine**: Create logic to deploy the built image to K8s (Deployment + Service + Ingress).

#### Week 5: Feb 23 - Mar 1
-   [ ] **Frontend Setup**: Initialize Angular project.
-   [ ] **Auth UI**: Login, Register, Profile pages.
-   [ ] **Dashboard UI**: List Projects/Apps. Create new App wizard.

#### Week 6: Mar 2 - Mar 8 (MVP Milestone)
-   [ ] **Integration**: Connect Frontend "Deploy" button to Backend "Build Engine".
-   [ ] **Status Sync**: Ensure backend updates Database when K8s Job finishes (via Polling or K8s Watcher).
-   [ ] **Walkthrough**: Verify End-to-End flow (Git URL -> Running Pod).

### Phase 3: Real-time & Polish (Weeks 7-8)
*Focus: WebSockets, Logs, and Experience*

#### Week 7: Mar 9 - Mar 15
-   [ ] **Log Streaming**:
    -   **Agent**: Sidecar or logic to pipe Pod logs to Redis.
    -   **Backend**: SSE/WebSocket endpoint reading from Redis.
    -   **Frontend**: Terminal window showing live logs.
-   [ ] **Log Archiving**: Move finished build logs from Redis to MinIO for long-term storage.

#### Week 8: Mar 16 - Mar 22
-   [ ] **Frontend Polish**: Error handling, Loading states, Toasts, "Premium" aesthetics (Dark mode, Glassmorphism).
-   [ ] **Security Audit**: Ensure granular permissions (Member vs Admin).
-   [ ] **Documentation**: API Docs (Swagger/OpenAPI), Developer Setup Guide.

### Phase 4: Finalization (Week 9)
*Focus: Testing and Delivery*

#### Week 9: Mar 23 - Mar 30
-   [ ] **Load Testing**: Trigger multiple builds simultaneously.
-   [ ] **Bug Fixes**: Buffer for unexpected K8s issues.
-   [ ] **Final Deployment**: Deploy the Platform itself or finalize the `docker-compose`.
-   [ ] **Video Demo**: Record the "From Code to Cloud" flow.

---

## 🚦 Status Protocol
-   **Green**: On track.
-   **Yellow**: one feature behind (recoverable).
-   **Red**: Blocking architecture issue (needs immediate attention).

## 📝 Immediate Next Steps
1.  **Update Docker Compose**: Add missing infrastructure (Rabbit, Redis, MinIO).
2.  **Domain Cleanup**: Verify `User` and `Auth` do not have cyclic dependencies.
3.  **Scaffold Organization**: Allow users to create organizations.
