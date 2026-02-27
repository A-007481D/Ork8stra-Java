package com.ork8stra.auth.controller;

import com.ork8stra.auth.dto.LoginRequest;
import com.ork8stra.auth.dto.RegisterRequest;
import com.ork8stra.auth.dto.TokenResponse;
import com.ork8stra.auth.service.AuthService;
import com.ork8stra.integration.github.GithubService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Authentication controller for user registration and login.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final GithubService githubService;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        TokenResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is running");
    }

    @GetMapping("/github/url")
    public ResponseEntity<Map<String, String>> getGithubAuthUrl() {
        String url = githubService.generateAuthUrl() + "&prompt=consent"; // force prompt for tests
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/github/login")
    public ResponseEntity<TokenResponse> loginWithGithub(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        TokenResponse response = authService.loginWithGithub(code);
        return ResponseEntity.ok(response);
    }
}
