package com.ork8stra.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ork8stra.api.dto.CreateApplicationRequest;
import com.ork8stra.applicationmanagement.Application;
import com.ork8stra.applicationmanagement.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.ork8stra.auth.security.RbacService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = {"ADMIN"})
public class ApplicationControllerTest {
    
    @org.springframework.boot.test.mock.mockito.MockBean(answer = org.mockito.Answers.RETURNS_DEEP_STUBS)
    private io.fabric8.kubernetes.client.KubernetesClient kubernetesClient;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApplicationService applicationService;

    @MockBean
    private RbacService rbacService;

    private UUID projectId;
    private Application application;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        application = new Application("test-app", projectId, "https://github.com/test", "main");
        application.setId(UUID.randomUUID());
        application.setEnvVars(Map.of("ENV", "PROD"));

        when(rbacService.hasProjectPermission(any(UUID.class), anyString())).thenReturn(true);
        when(rbacService.hasApplicationPermission(any(UUID.class), anyString())).thenReturn(true);
    }

    @Test
    @WithMockUser
    void testCreateApplication() throws Exception {
        CreateApplicationRequest request = CreateApplicationRequest.builder()
                .name("test-app")
                .gitRepoUrl("https://github.com/test")
                .buildBranch("main")
                .envVars(Map.of("ENV", "PROD"))
                .build();

        when(applicationService.createApplication(eq("test-app"), eq(projectId), eq("https://github.com/test"),
                eq("main"), any(), any(), any(), any()))
                .thenReturn(application);

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/apps")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("test-app"))
                .andExpect(jsonPath("$.gitRepoUrl").value("https://github.com/test"))
                .andExpect(jsonPath("$.projectId").value(projectId.toString()));
    }

    @Test
    @WithMockUser
    void testListApplicationsByProject() throws Exception {
        when(applicationService.getApplicationsByProject(projectId))
                .thenReturn(List.of(application));

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/apps"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("test-app"));
    }

    @Test
    @WithMockUser
    void testGetApplication() throws Exception {
        when(applicationService.getApplication(application.getId()))
                .thenReturn(application);

        mockMvc.perform(get("/api/v1/apps/" + application.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("test-app"));
    }
}
