package com.ork8stra.applicationmanagement;

import com.ork8stra.applicationmanagement.validation.GitUrlValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final GitUrlValidator gitUrlValidator;

    @Transactional
    public Application createApplication(String name, UUID projectId, String gitRepoUrl, String buildBranch,
            Map<String, String> envVars) {

        if (!gitUrlValidator.isValid(gitRepoUrl)) {
            throw new IllegalArgumentException("Invalid or unreachable Git repository URL: " + gitRepoUrl);
        }

        Application app = new Application(name, projectId, gitRepoUrl, buildBranch);
        if (envVars != null) {
            app.setEnvVars(envVars);
        }
        return applicationRepository.save(app);
    }

    public List<Application> getApplicationsByProject(UUID projectId) {
        return applicationRepository.findByProjectId(projectId);
    }

    public Application getApplication(UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));
    }
}
