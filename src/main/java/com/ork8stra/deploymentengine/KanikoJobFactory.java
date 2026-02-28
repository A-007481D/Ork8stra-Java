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

        // Kaniko git context format: git://github.com/owner/repo#refs/heads/branch
        // Strip https:// prefix, kaniko adds it internally for git:// scheme
        String gitContext = "git://" + gitUrl.replace("https://", "") + "#refs/heads/" + branch;

        // Resolve dockerfile path — default to "Dockerfile" if not set
        String dockerfilePath = application.getDockerfilePath() != null && !application.getDockerfilePath().isBlank()
                ? application.getDockerfilePath()
                : "Dockerfile";

        // If Dockerfile is in a subdirectory (e.g. "app/Dockerfile"), set --context-sub-path
        // so that COPY commands in the Dockerfile resolve relative to that subdirectory
        String contextSubPath = null;
        if (dockerfilePath.contains("/")) {
            contextSubPath = dockerfilePath.substring(0, dockerfilePath.lastIndexOf('/'));
        }

        List<String> args = new ArrayList<>();
        args.add("--context=" + gitContext);
        args.add("--dockerfile=" + dockerfilePath);
        if (contextSubPath != null) {
            args.add("--context-sub-path=" + contextSubPath);
        }
        args.add("--destination=" + imageDestination);
        args.add("--cache=true");
        args.add("--cache-ttl=24h");
        args.add("--log-format=text");

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
                .addNewContainer()
                .withName("kaniko")
                .withImage("gcr.io/kaniko-project/executor:latest")
                .withArgs(args)
                .endContainer()
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }
}
