# Jira User Story Tickets

## ORK-101: Infrastructure Services Setup

**Type**: Story  
**Priority**: High  
**Sprint**: Week 2 (Feb 2-8, 2026)  
**Status**: ✅ DONE

### Description
As a developer, I need the messaging (RabbitMQ), caching (Redis), and storage (MinIO) infrastructure running locally so that I can develop event-driven features and log archiving.

### Acceptance Criteria
- [x] RabbitMQ accessible on port 5672 (management on 15672)
- [x] Redis accessible on port 6379
- [x] MinIO accessible on port 9000 (console on 9001)
- [x] All services start with `docker compose up`
- [x] Health checks configured for each service

**Story Points**: 2  
**Branch**: `feature/infrastructure-services`  
**Commit**: `feat(infra): add RabbitMQ, Redis, and MinIO services`

---

## ORK-102: Enable Core Services

**Type**: Story  
**Priority**: High  
**Sprint**: Week 2 (Feb 2-8, 2026)  
**Status**: ✅ DONE (Already enabled on main)

### Description
As a developer, I need the core domain services activated so that the platform can manage projects, trigger builds, and deploy applications.

### Acceptance Criteria
- [x] ProjectService is a Spring bean (@Service enabled)
- [x] BuildService is a Spring bean (@Service enabled)
- [x] DeploymentService is a Spring bean (@Service enabled)
- [x] Application starts without errors
- [x] Services are injectable in controllers

**Story Points**: 1  
**Note**: Services were already enabled on main branch

---

## ORK-103: Project Management REST API

**Type**: Story  
**Priority**: High  
**Sprint**: Week 2 (Feb 2-8, 2026)  
**Status**: 🔄 IN PROGRESS

### Description
As a user, I want to create and manage projects via REST API so that I can organize my applications into logical groups.

### Acceptance Criteria
- [x] POST /api/v1/projects - Create project
- [x] GET /api/v1/projects - List all projects
- [x] GET /api/v1/projects/{id} - Get project by ID
- [x] All endpoints return proper DTOs
- [ ] Endpoints added to Insomnia collection
- [ ] Tested with authenticated user

**Story Points**: 3  
**Branch**: `feature/project-api`

---

## ORK-104: Application Management REST API

**Type**: Story  
**Priority**: High  
**Sprint**: Week 2 (Feb 2-8, 2026)  
**Status**: ⏳ TODO

### Description
As a user, I want to create and manage applications within projects so that I can configure deployable units with Git repos and env vars.

### Acceptance Criteria
- [ ] POST /api/v1/projects/{projectId}/apps - Create app
- [ ] GET /api/v1/projects/{projectId}/apps - List apps in project
- [ ] GET /api/v1/apps/{id} - Get app by ID
- [ ] All endpoints return proper DTOs
- [ ] Endpoints added to Insomnia collection

**Story Points**: 3  
**Branch**: `feature/application-api`

---

## ORK-105: Organization Management

**Type**: Epic  
**Priority**: Highest  
**Sprint**: Week 3 (Feb 9-15, 2026)  
**Status**: ✅ DONE

### Description
As a platform user, I want to create organizations and link projects to them, establishing multi-tenancy.

### Acceptance Criteria
- [x] Create `Organization` entity.
- [x] Implement `/api/v1/orgs` endpoints.
- [x] Modify `Project` to link securely via `organizationId`.
- [x] Enforce authorization checking tests.

**Story Points**: 5  
**Branch**: `feature/multi-tenancy-orgs`

---

## ORK-106: Lightweight Git Validation

**Type**: Task  
**Priority**: High  
**Sprint**: Week 2 (Feb 2-8, 2026)  
**Status**: ✅ DONE

### Description
As a platform, we need to ensure users cannot submit invalid Git URLs that would cause our underlying image building engine to fail later down the pipeline.

### Acceptance Criteria
- [x] Implement `GitUrlValidator`.
- [x] Catch Regex typos in Github/Gitlab URLs.
- [x] Ping repositories via HTTP HEAD to verify accessibility.
- [x] Prevent API from creating applications pointing to 404 repositories.

**Story Points**: 2  
**Branch**: `feature/git-integration`
