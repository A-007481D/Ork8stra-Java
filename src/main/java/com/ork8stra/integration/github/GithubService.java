package com.ork8stra.integration.github;

import com.ork8stra.api.dto.github.GithubBranchResponse;
import com.ork8stra.api.dto.github.GithubRepoResponse;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${oauth2.github.client-id}")
    private String clientId;

    @Value("${oauth2.github.client-secret}")
    private String clientSecret;

    public String generateAuthUrl() {
        return String.format(
                "https://github.com/login/oauth/authorize?client_id=%s&scope=repo%%20user",
                clientId);
    }

    @Transactional
    public void connectAccount(UUID userId, String code, String username) {
        log.info("Exchanging GitHub OAuth code for user {}", username);

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://github.com/login/oauth/access_token",
                request,
                Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String accessToken = (String) response.getBody().get("access_token");
            if (accessToken != null) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));
                user.setGithubUsername(username);
                user.setGithubAccessToken(accessToken);
                userRepository.save(user);
                log.info("Successfully connected GitHub account for user ID: {}", userId);
                return;
            }
        }
        throw new RuntimeException("Failed to exchange GitHub access token");
    }

    public com.ork8stra.api.dto.github.GithubUserProfile exchangeCodeForUserInfo(String code) {
        log.info("Exchanging GitHub OAuth code for user info");

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://github.com/login/oauth/access_token",
                request,
                Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String accessToken = (String) response.getBody().get("access_token");
            if (accessToken != null) {
                return fetchUserProfile(accessToken);
            }
        }
        throw new RuntimeException("Failed to exchange GitHub access token");
    }

    private com.ork8stra.api.dto.github.GithubUserProfile fetchUserProfile(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.valueOf("application/vnd.github.v3+json")));

        // 1. Get User Profile
        ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://api.github.com/user",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class);

        if (!userResponse.getStatusCode().is2xxSuccessful() || userResponse.getBody() == null) {
            throw new RuntimeException("Failed to fetch GitHub user profile");
        }

        Map<String, Object> userData = userResponse.getBody();
        String username = (String) userData.get("login");
        String id = String.valueOf(userData.get("id"));
        String email = (String) userData.get("email");

        // 2. If email is null in profile, fetch from /user/emails
        if (email == null) {
            ResponseEntity<List<Map<String, Object>>> emailsResponse = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    });

            if (emailsResponse.getStatusCode().is2xxSuccessful() && emailsResponse.getBody() != null) {
                for (Map<String, Object> emailObj : emailsResponse.getBody()) {
                    Boolean primary = (Boolean) emailObj.get("primary");
                    Boolean verified = (Boolean) emailObj.get("verified");
                    if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                        email = (String) emailObj.get("email");
                        break;
                    }
                }
            }
        }

        if (email == null) {
            throw new RuntimeException("Could not find a valid email for GitHub user");
        }

        return com.ork8stra.api.dto.github.GithubUserProfile.builder()
                .id(id)
                .username(username)
                .email(email)
                .build();
    }

    public boolean isConnected(UUID userId) {
        return userRepository.findById(userId)
                .map(u -> u.getGithubAccessToken() != null)
                .orElse(false);
    }

    public List<GithubRepoResponse> getUserRepositories(UUID userId) {
        String token = getAccessTokenSilent(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(List.of(MediaType.valueOf("application/vnd.github.v3+json")));

        ResponseEntity<List<GithubRepoResponse>> response = restTemplate.exchange(
                "https://api.github.com/user/repos?sort=updated",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {
                });

        return response.getBody();
    }

    public List<GithubBranchResponse> getRepositoryBranches(UUID userId, String owner, String repo) {
        String token = getAccessTokenSilent(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(List.of(MediaType.valueOf("application/vnd.github.v3+json")));

        ResponseEntity<List<GithubBranchResponse>> response = restTemplate.exchange(
                "https://api.github.com/repos/" + owner + "/" + repo + "/branches",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {
                });

        return response.getBody();
    }

    private String getAccessTokenSilent(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getGithubAccessToken)
                .orElseThrow(() -> new IllegalStateException("GitHub account not connected"));
    }
}
