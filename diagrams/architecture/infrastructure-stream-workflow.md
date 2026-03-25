# KubeLite: The Infrastructure Stream Workflow

This diagram visualizes the high-level user journey and the underlying technical synchronization that powers the "Click. Deploy. Done." experience.

```mermaid
sequenceDiagram
    autonumber
    participant D as Developer (Command Palette)
    participant I as Ingest (API Layer)
    participant F as Forge (Build Engine)
    participant P as Pulse (Live Edge)

    Note over D,I: STAGE 1: INGEST
    D->>I: git push / deploy (intent)
    I->>I: Resolve Dependencies & Runtime

    Note over I,F: STAGE 2: FORGE
    I->>F: Trigger Build (Tekton/Kaniko)
    F->>F: Package Application
    F->>F: Optimize Image Layers
    F->>P: Orchestrate Deployment (K8s)

    Note over F,P: STAGE 3: PULSE
    P->>P: Traffic Ingress Warm-up
    P->>P: Global DNS Propagation
    P-->>D: "Success" Pulse (Live URL)
```

## Interaction Design
1.  **Ingest**: Focused on low-friction entry via the Command Palette.
2.  **Forge**: Completely automated, high-density build process.
3.  **Pulse**: Continuous health monitoring and traffic routing.
