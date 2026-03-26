package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.auth.security.JwtTokenProvider;
import com.ork8stra.buildengine.Build;
import com.ork8stra.buildengine.BuildLogService;
import com.ork8stra.buildengine.BuildService;
import com.ork8stra.buildengine.BuildStatus;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import com.ork8stra.deploymentengine.Deployment;
import com.ork8stra.deploymentengine.DeploymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BuildController.class)
class BuildControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private ApplicationService applicationService;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private BuildService buildService;

    @MockitoBean
    private BuildLogService buildLogService;

    @MockitoBean
    private DeploymentService deploymentService;

    @Test
    @WithMockUser
    void shouldTriggerBuildSuccessfully() throws Exception {
        UUID appId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();

        Application mockApp = new Application("frontend-app", projectId, "https://github.com/user/repo.git", "main");
        mockApp.setId(appId);

        Project mockProject = new Project("test-project", UUID.randomUUID());
        mockProject.setId(projectId);

        Build mockBuild = new Build(appId, "HEAD");
        mockBuild.setStatus(BuildStatus.RUNNING);
        mockBuild.setJobName("build-frontend-app-abc123");

        when(applicationService.getApplication(appId)).thenReturn(mockApp);
        when(projectService.getProjectById(projectId)).thenReturn(mockProject);
        
        Deployment mockDeployment = new Deployment(appId, "HEAD");
        when(deploymentService.triggerBuildDeployment(eq(mockApp), eq(mockProject), any(String.class), any(UUID.class))).thenReturn(mockDeployment);
        
        when(buildService.triggerBuild(eq(mockApp), eq(mockProject), any(String.class), any(UUID.class))).thenReturn(mockBuild);

        mockMvc.perform(post("/api/v1/apps/" + appId + "/build").with(csrf()))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.jobName").value("build-frontend-app-abc123"));

        verify(buildService).triggerBuild(eq(mockApp), eq(mockProject), any(String.class), any(UUID.class));
    }

    @Test
    @WithMockUser
    void shouldListBuildsForApplication() throws Exception {
        UUID appId = UUID.randomUUID();

        Build mockBuild = new Build(appId, "HEAD");
        mockBuild.setStatus(BuildStatus.SUCCESS);
        mockBuild.setImageTag("ttl.sh/ork8stra-test:1h");

        when(buildService.getBuildsForApplication(appId)).thenReturn(List.of(mockBuild));

        mockMvc.perform(get("/api/v1/apps/" + appId + "/build"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SUCCESS"));
    }

    @Test
    @WithMockUser
    void shouldGetSingleBuild() throws Exception {
        UUID appId = UUID.randomUUID();

        Build mockBuild = new Build(appId, "HEAD");
        mockBuild.setStatus(BuildStatus.FAILED);

        when(buildService.getBuild(mockBuild.getId())).thenReturn(mockBuild);

        mockMvc.perform(get("/api/v1/apps/" + appId + "/build/" + mockBuild.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));
    }
}
