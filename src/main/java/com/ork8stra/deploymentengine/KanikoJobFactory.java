package com.ork8stra.deploymentengine;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.projectmanagement.Project;
import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.api.model.batch.v1.JobBuilder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class KanikoJobFactory {

    public Job createKanikoJob(Application application, Project project, String imageDestination, UUID buildId) {
        String jobName = "build-" + application.getName() + "-" + UUID.randomUUID().toString().substring(0, 8);
        String gitUrl = application.getGitRepoUrl();

        return new JobBuilder()
                .withNewMetadata()
                .withName(jobName)
                .withNamespace(project.getK8sNamespace())
                .addToLabels("app", application.getName())
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
                .withArgs(
                        "--context=git://" + gitUrl.replace("https://", ""),
                        "--destination=" + imageDestination,
                        "--cache=true")
                .endContainer()
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();
    }
}
