# 01 - Kaniko Build Engine

## Overview
This document outlines technical design decisions behind the Ork8stra (KubeLite) Kubernetes Build Engine component.

## Architecture Decisions
- **Kaniko Git Context:** Kaniko natively resolves Git contexts, eliminating the requirement for separate init-containers (e.g. `git-clone` sidecars).
- **Fail Fast Jobs:** The Fabric8 `JobBuilder` applies a `backoffLimit` of `0` and a `RestartPolicy` of `Never`. This prevents K8s from infinitely retrying failing image builds and consuming cluster compute.
- **Registry Mocking (MVP):** The `BuildController` routes the compiled images towards `ttl.sh` using anonymous 1-hour expiration tags (`:1h`). This is a temporary architectural bypass for the MVP phase to avoid implementing Docker Hub authentication credentials immediately.
- **Git URI Integrity:** Reachability checks (`HTTP HEAD`) are strictly enforced over regex verification during Application creation, saving Kaniko from instantiating builder Pods against dead / 404 repository URLs.
