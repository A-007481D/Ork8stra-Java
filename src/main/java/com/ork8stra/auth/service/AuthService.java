package com.ork8stra.auth.service;

import com.ork8stra.auth.dto.LoginRequest;
import com.ork8stra.auth.dto.RegisterRequest;
import com.ork8stra.auth.dto.TokenResponse;
import com.ork8stra.auth.security.JwtTokenProvider;
import com.ork8stra.api.dto.github.GithubUserProfile;
import com.ork8stra.integration.github.GithubService;
import com.ork8stra.user.PlatformRole;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

/**
 * Authentication service handling user registration and login.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final GithubService githubService;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(Set.of(PlatformRole.USER))
                .enabled(true)
                .build();

        userRepository.save(user);
        log.info("User registered: {}", user.getUsername());

        String rolesString = String.join(",", user.getRoles().stream()
                .map(Enum::name)
                .toList());
        String token = jwtTokenProvider.generateToken(user.getUsername(), rolesString);

        return TokenResponse.of(token, jwtExpirationMs, user.getUsername());
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()));

        String token = jwtTokenProvider.generateToken(authentication);

        log.info("User logged in: {}", request.getUsername());
        return TokenResponse.of(token, jwtExpirationMs, request.getUsername());
    }

    @Transactional
    public TokenResponse loginWithGithub(String code) {
        GithubUserProfile profile = githubService.exchangeCodeForUserInfo(code);

        User user = userRepository.findByEmailIgnoreCase(profile.getEmail())
                .orElseGet(() -> {
                    String username = profile.getUsername();
                    if (userRepository.existsByUsernameIgnoreCase(username)) {
                        username = username + "_" + UUID.randomUUID().toString().substring(0, 5);
                    }

                    User newUser = User.builder()
                            .username(username)
                            .email(profile.getEmail())
                            .githubUsername(profile.getUsername())
                            .githubAccessToken(null)
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .roles(Set.of(PlatformRole.USER))
                            .enabled(true)
                            .build();

                    return userRepository.save(newUser);
                });

        if (user.getGithubUsername() == null) {
            user.setGithubUsername(profile.getUsername());
            userRepository.save(user);
        }

        String rolesString = String.join(",", user.getRoles().stream()
                .map(Enum::name)
                .toList());
        String token = jwtTokenProvider.generateToken(user.getUsername(), rolesString);

        log.info("User logged in via GitHub: {}", user.getUsername());
        return TokenResponse.of(token, jwtExpirationMs, user.getUsername());
    }
}
