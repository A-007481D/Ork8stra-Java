package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.projectmanagement.Project;
import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.api.model.batch.v1.JobBuilder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class KanikoJobFactory {

    public Job createKanikoJob(Application application, Project project, String imageDestination, UUID buildId) {
        String sanitizedAppName = application.getName().toLowerCase().replaceAll("[^a-z0-9]", "");
        String jobName = "build-" + sanitizedAppName + "-" + UUID.randomUUID().toString().substring(0, 8);
        String gitUrl = application.getGitRepoUrl();
        String branch = application.getBuildBranch() != null ? application.getBuildBranch() : "main";

        // Handle GitHub URLs with /tree/branch/subpath
        String contextSubPath = application.getDockerfilePath() != null && application.getDockerfilePath().contains("/")
                ? application.getDockerfilePath().substring(0, application.getDockerfilePath().lastIndexOf('/'))
                : null;

        if (gitUrl.contains("/tree/")) {
            String[] parts = gitUrl.split("/tree/");
            gitUrl = parts[0]; // The repo root URL
            String branchAndPath = parts[1];
            if (branchAndPath.contains("/")) {
                branch = branchAndPath.substring(0, branchAndPath.indexOf("/"));
                String subPath = branchAndPath.substring(branchAndPath.indexOf("/") + 1);
                contextSubPath = contextSubPath == null ? subPath : subPath + "/" + contextSubPath;
            } else {
                branch = branchAndPath;
            }
        }

        // Local context for Kaniko after init container clones it
        String localContext = "/workspace";
        String dockerfilePath = (application.getDockerfilePath() != null && !application.getDockerfilePath().isBlank()
                ? application.getDockerfilePath()
                : "Dockerfile");

        List<String> args = new ArrayList<>();
        args.add("--context=dir://" + localContext);
        args.add("--dockerfile=" + dockerfilePath);
        if (contextSubPath != null) {
            args.add("--context-sub-path=" + contextSubPath);
        }
        args.add("--destination=" + imageDestination);
        args.add("--cache=true");
        args.add("--cache-ttl=24h");
        args.add("--log-format=text");
        args.add("--snapshot-mode=full");

        String gitCloneCommand = String.format("git clone -b %s %s .", branch, gitUrl);
        if (gitUrl.contains("/tree/")) {
             // If it was a tree URL, we already extracted root and branch, so we just clone the root
             gitCloneCommand = String.format("git clone -b %s %s .", branch, gitUrl);
        }

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
                .withBackoffLimit(0)
                .withNewTemplate()
                .withNewMetadata()
                .addToAnnotations("ork8stra.com/application-id", application.getId().toString())
                .endMetadata()
                .withNewSpec()
                .withRestartPolicy("Never")
                .addNewInitContainer()
                    .withName("git-clone")
                    .withImage("alpine/git")
                    .withCommand("sh", "-c", gitCloneCommand)
                    .withWorkingDir("/workspace")
                    .addNewVolumeMount()
                        .withName("workspace")
                        .withMountPath("/workspace")
                    .endVolumeMount()
                .endInitContainer()
                .addNewContainer()
                    .withName("kaniko")
                    .withImage("gcr.io/kaniko-project/executor:latest")
                    .withArgs(args)
                    .withWorkingDir("/workspace")
                    .addNewVolumeMount()
                        .withName("workspace")
                        .withMountPath("/workspace")
                    .endVolumeMount()
                .endContainer()
                .addNewVolume()
                    .withName("workspace")
                    .withNewEmptyDir()
                    .endEmptyDir()
                .endVolume()
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }
}
