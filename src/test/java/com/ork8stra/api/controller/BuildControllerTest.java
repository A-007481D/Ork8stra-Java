package com.ork8stra.api.controller;

import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import com.ork8stra.auth.security.JwtTokenProvider;
import com.ork8stra.deploymentengine.DeploymentService;
import com.ork8stra.projectmanagement.Project;
import com.ork8stra.projectmanagement.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

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

        when(applicationService.getApplication(appId)).thenReturn(mockApp);
        when(projectService.getProjectById(projectId)).thenReturn(mockProject);

        mockMvc.perform(post("/api/v1/apps/" + appId + "/build").with(csrf()))
                .andExpect(status().isAccepted())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Build engine job started")));

        verify(deploymentService).triggerBuild(eq(mockApp), eq(mockProject), any(String.class));
    }
}
