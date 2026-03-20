package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.projectmanagement.Project;
import io.fabric8.kubernetes.api.model.Container;
import io.fabric8.kubernetes.api.model.ContainerBuilder;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirements;
import io.fabric8.kubernetes.api.model.ResourceRequirementsBuilder;
import io.fabric8.kubernetes.api.model.Volume;
import io.fabric8.kubernetes.api.model.VolumeBuilder;
import io.fabric8.kubernetes.api.model.VolumeMountBuilder;
import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.api.model.batch.v1.JobBuilder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class KanikoJobFactory {

    public Job createKanikoJob(Application application, Project project, String imageDestination, UUID buildId) {
        String sanitizedAppName = application.getName().toLowerCase().replaceAll("[^a-z0-9]", "");
        String jobName = "build-" + sanitizedAppName + "-" + UUID.randomUUID().toString().substring(0, 8);
        String gitUrl = application.getGitRepoUrl();
        String branch = application.getBuildBranch() != null ? application.getBuildBranch() : "main";

        String requestedDockerfilePath = application.getDockerfilePath();
        boolean autoDetectDockerfile = isAutoDockerfileMode(requestedDockerfilePath);

        // If a manual Dockerfile path includes directories, use that as context sub-path.
        String contextSubPath = !autoDetectDockerfile && requestedDockerfilePath.contains("/")
                ? requestedDockerfilePath.substring(0, requestedDockerfilePath.lastIndexOf('/'))
                : null;

        // Handle GitHub URLs with /tree/branch/subpath
        if (gitUrl.contains("/tree/")) {
            String[] parts = gitUrl.split("/tree/");
            gitUrl = parts[0];
            String branchAndPath = parts[1];
            if (branchAndPath.contains("/")) {
                branch = branchAndPath.substring(0, branchAndPath.indexOf('/'));
                String subPath = branchAndPath.substring(branchAndPath.indexOf('/') + 1);
                contextSubPath = contextSubPath == null ? subPath : subPath + "/" + contextSubPath;
            } else {
                branch = branchAndPath;
            }
        }

        String localContext = "/workspace";
        String kanikoDockerfilePath = autoDetectDockerfile
                ? resolveAutoDockerfilePath(localContext, contextSubPath)
                : requestedDockerfilePath;

        List<String> args = new ArrayList<>();
        args.add("--context=dir://" + localContext);
        args.add("--dockerfile=" + kanikoDockerfilePath);
        if (contextSubPath != null && !contextSubPath.isBlank()) {
            args.add("--context-sub-path=" + contextSubPath);
        }
        args.add("--destination=" + imageDestination);
        args.add("--insecure");
        args.add("--skip-tls-verify");
        args.add("--compressed-caching=false");
        args.add("--use-new-run");
        args.add("--cache=true");
        args.add("--cache-repo=" + imageDestination.split(":")[0] + "/cache");

        String cloneCommand = buildCloneCommand(gitUrl, branch);
        String nixpacksCommand = buildNixpacksCommand(localContext, contextSubPath);

        Container gitCloneInit = new ContainerBuilder()
                .withName("git-clone")
                .withImage("alpine/git")
                .withCommand("sh", "-c", cloneCommand)
                .withWorkingDir("/workspace")
                .withVolumeMounts(new VolumeMountBuilder()
                        .withName("workspace")
                        .withMountPath("/workspace")
                        .build())
                .build();

        List<Container> initContainers = new ArrayList<>();
        initContainers.add(gitCloneInit);

        if (autoDetectDockerfile) {
            Container nixpacksInit = new ContainerBuilder()
                    .withName("dockerfile-auto-detect")
                    .withImage("ubuntu:22.04")
                    .withCommand("sh", "-c", nixpacksCommand)
                    .withWorkingDir("/workspace")
                    .withVolumeMounts(new VolumeMountBuilder()
                            .withName("workspace")
                            .withMountPath("/workspace")
                            .build())
                    .build();
            initContainers.add(nixpacksInit);
        }

        Container kanikoContainer = new ContainerBuilder()
                .withName("kaniko")
                .withImage("gcr.io/kaniko-project/executor:latest")
                .withArgs(args)
                .withWorkingDir("/workspace")
                .withEnv(new io.fabric8.kubernetes.api.model.EnvVarBuilder()
                        .withName("NIX_CONFIG")
                        .withValue("connect-timeout = 600\nmax-jobs = 2\nhttp-connections = 50")
                        .build())
                .withResources(new ResourceRequirementsBuilder()
                        .addToRequests("cpu", new Quantity("2"))
                        .addToRequests("memory", new Quantity("4Gi"))
                        .addToLimits("cpu", new Quantity("4"))
                        .addToLimits("memory", new Quantity("8Gi"))
                        .build())
                .withNewSecurityContext()
                        .withRunAsUser(0L)
                        .withPrivileged(true)
                .endSecurityContext()
                .withVolumeMounts(new VolumeMountBuilder()
                        .withName("workspace")
                        .withMountPath("/workspace")
                        .build())
                .build();

        Volume workspaceVolume = new VolumeBuilder()
                .withName("workspace")
                .withNewEmptyDir()
                .endEmptyDir()
                .build();

        return new JobBuilder()
                .withNewMetadata()
                .withName(jobName)
                .withNamespace(project.getK8sNamespace())
                .addToLabels("app", sanitizedAppName)
                .addToLabels("managed-by", "ork8stra")
                .addToLabels("job-type", "build")
                .addToAnnotations("ork8stra.com/build-id", buildId.toString())
                .endMetadata()
                .withNewSpec()
                .withBackoffLimit(2)
                .withNewTemplate()
                .withNewMetadata()
                .addToAnnotations("ork8stra.com/application-id", application.getId().toString())
                .endMetadata()
                .withNewSpec()
                .withRestartPolicy("Never")
                .withInitContainers(initContainers)
                .withContainers(Collections.singletonList(kanikoContainer))
                .withVolumes(workspaceVolume)
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }

    private String resolveAutoDockerfilePath(String localContext, String contextSubPath) {
        String targetDir = resolveTargetDir(localContext, contextSubPath);
        return targetDir + "/.ork8stra.auto.Dockerfile";
    }

    private String resolveTargetDir(String localContext, String contextSubPath) {
        if (contextSubPath == null || contextSubPath.isBlank()) {
            return localContext;
        }
        return localContext + "/" + contextSubPath;
    }

    private String buildCloneCommand(String gitUrl, String branch) {
        return String.format(
                "set -eu; git clone --depth 1 -b \"%s\" \"%s\" .",
                escapeForDoubleQuotes(branch),
                escapeForDoubleQuotes(gitUrl));
    }

    private String buildNixpacksCommand(String localContext, String contextSubPath) {
        String targetDir = resolveTargetDir(localContext, contextSubPath);
        String autoDockerfilePath = resolveAutoDockerfilePath(localContext, contextSubPath);

        return "set -eu\n"
                + "TARGET_DIR=\"" + escapeForDoubleQuotes(targetDir) + "\"\n"
                + "AUTO_DOCKERFILE=\"" + escapeForDoubleQuotes(autoDockerfilePath) + "\"\n"
                + "if [ ! -d \"$TARGET_DIR\" ]; then echo \"Invalid build context: $TARGET_DIR\"; exit 1; fi\n"
                + "if [ -f \"$TARGET_DIR/Dockerfile\" ]; then cp \"$TARGET_DIR/Dockerfile\" \"$AUTO_DOCKERFILE\"; fi\n"
                + "if [ ! -f \"$AUTO_DOCKERFILE\" ]; then\n"
                + "  echo \"Trying to generate Dockerfile using Nixpacks...\"\n"
                + "  apt-get update && apt-get install -y curl ca-certificates\n"
                + "  curl -sSL https://nixpacks.com/install.sh | bash\n"
                + "  # Nixpacks build --out generates the .nixpacks/Dockerfile without building an image\n"
                + "  /usr/local/bin/nixpacks build \"$TARGET_DIR\" --out \"$TARGET_DIR\" --name app\n"
                + "  \n"
                + "  # Nixpacks build --out creates a .nixpacks directory with the Dockerfile inside\n"
                + "  if [ -f \"$TARGET_DIR/.nixpacks/Dockerfile\" ]; then\n"
                + "    cp \"$TARGET_DIR/.nixpacks/Dockerfile\" \"$AUTO_DOCKERFILE\"\n"
                + "    # Post-process: ensure the app listens on PORT (default 80)\n"
                + "    # Nixpacks sets ENTRYPOINT [/bin/bash, -l, -c] which conflicts with CMD\n"
                + "    # Strip both ENTRYPOINT and CMD, reset entrypoint, use exec-form CMD\n"
                + "    grep -v '^CMD\\|^ENTRYPOINT' \"$AUTO_DOCKERFILE\" > \"$AUTO_DOCKERFILE.tmp\" || true\n"
                + "    mv \"$AUTO_DOCKERFILE.tmp\" \"$AUTO_DOCKERFILE\"\n"
                + "    echo 'ENV PORT=80' >> \"$AUTO_DOCKERFILE\"\n"
                + "    echo 'EXPOSE 80' >> \"$AUTO_DOCKERFILE\"\n"
                + "    echo 'ENTRYPOINT []' >> \"$AUTO_DOCKERFILE\"\n"
                + "    echo 'CMD [\"/bin/bash\", \"-lc\", \"npm run start -- --host 0.0.0.0 --port ${PORT:-80} || npm run dev -- --host 0.0.0.0 --port ${PORT:-80} || node server.js\"]' >> \"$AUTO_DOCKERFILE\"\n"
                + "    echo \"Successfully generated Dockerfile via Nixpacks.\"\n"
                + "  fi\n"
                + "fi\n"
                + "if [ ! -f \"$AUTO_DOCKERFILE\" ]; then\n"
                + "  echo \"Nixpacks did not produce a portable Dockerfile, using built-in fallback templates\"\n"
                + "  if [ -f \"$TARGET_DIR/pom.xml\" ]; then\n"
                + "    cat > \"$AUTO_DOCKERFILE\" <<'EOF'\n"
                + "FROM maven:3.9-eclipse-temurin-17 AS build\n"
                + "WORKDIR /app\n"
                + "COPY . .\n"
                + "RUN mvn -B -DskipTests package\n"
                + "\n"
                + "FROM eclipse-temurin:17-jre\n"
                + "WORKDIR /app\n"
                + "COPY --from=build /app/target/*.jar app.jar\n"
                + "EXPOSE 8080\n"
                + "ENTRYPOINT [\"java\",\"-jar\",\"/app/app.jar\"]\n"
                + "EOF\n"
                + "  elif [ -f \"$TARGET_DIR/package.json\" ]; then\n"
                + "    cat > \"$AUTO_DOCKERFILE\" <<'EOF'\n"
                + "FROM node:20-alpine\n"
                + "WORKDIR /app\n"
                + "COPY package*.json ./\n"
                + "RUN npm ci || npm install\n"
                + "COPY . .\n"
                + "RUN npm run build || true\n"
                + "ENV PORT=8080\n"
                + "EXPOSE 8080\n"
                + "CMD [\"sh\",\"-c\",\"npm run start -- --host 0.0.0.0 --port ${PORT} || npm run dev -- --host 0.0.0.0 --port ${PORT} || node server.js\"]\n"
                + "EOF\n"
                + "  elif [ -f \"$TARGET_DIR/requirements.txt\" ] || [ -f \"$TARGET_DIR/pyproject.toml\" ]; then\n"
                + "    cat > \"$AUTO_DOCKERFILE\" <<'EOF'\n"
                + "FROM python:3.12-slim\n"
                + "WORKDIR /app\n"
                + "COPY requirements.txt* ./\n"
                + "RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi\n"
                + "COPY . .\n"
                + "ENV PORT=8000\n"
                + "EXPOSE 8000\n"
                + "CMD [\"sh\",\"-c\",\"python main.py || python app.py\"]\n"
                + "EOF\n"
                + "  else\n"
                + "    cat > \"$AUTO_DOCKERFILE\" <<'EOF'\n"
                + "FROM alpine:3.20\n"
                + "WORKDIR /app\n"
                + "COPY . .\n"
                + "CMD [\"sh\",\"-c\",\"echo 'No runtime detected by Nixpacks fallback'; exit 1\"]\n"
                + "EOF\n"
                + "  fi\n"
                + "fi\n"
                + "if [ ! -f \"$AUTO_DOCKERFILE\" ]; then echo \"Failed to generate Dockerfile\"; exit 1; fi";
    }

    private boolean isAutoDockerfileMode(String dockerfilePath) {
        if (dockerfilePath == null) {
            return true;
        }

        String normalized = dockerfilePath.trim();
        if (normalized.isBlank()) {
            return true;
        }

        return normalized.equalsIgnoreCase("Dockerfile")
                || normalized.equalsIgnoreCase("auto")
                || normalized.equalsIgnoreCase("autodetect")
                || normalized.equalsIgnoreCase("auto-detect")
                || normalized.equalsIgnoreCase("manual");
    }

    private String escapeForDoubleQuotes(String input) {
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
