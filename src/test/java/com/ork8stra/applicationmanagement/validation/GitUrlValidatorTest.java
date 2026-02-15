package com.ork8stra.applicationmanagement.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GitUrlValidatorTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<Void> httpResponse;

    @InjectMocks
    private GitUrlValidator validator;

    @BeforeEach
    void setUp() {

        try {
            when(httpResponse.statusCode()).thenReturn(200);
            when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                    .thenReturn(httpResponse);
        } catch (Exception ignored) {
        }
    }

    @Test
    void shouldAcceptValidGithubUrl() {
        assertTrue(validator.isValid("https://github.com/spring-projects/spring-boot.git"));
        assertTrue(validator.isValid("https://github.com/ork8stra/platform"));
    }

    @Test
    void shouldAcceptValidGitlabUrl() {
        assertTrue(validator.isValid("https://gitlab.com/some-user/awesome-repo.git"));
    }

    @Test
    void shouldRejectInvalidProtocols() {
        assertFalse(validator.isValid("ftp://github.com/user/repo"));
        assertFalse(validator.isValid("git@github.com:user/repo.git"));
        assertFalse(validator.isValid("file:///local/path/to/repo"));
    }

    @Test
    void shouldRejectMalformedUrls() {
        assertFalse(validator.isValid("https://github.com"));
        assertFalse(validator.isValid("https://-invalid-domain.com/repo.git"));
        assertFalse(validator.isValid("not-a-url"));
        assertFalse(validator.isValid(""));
        assertFalse(validator.isValid(null));
    }

    @Test
    void shouldRejectWhenReachableCheckFails() throws Exception {
        when(httpResponse.statusCode()).thenReturn(404);

        assertFalse(validator.isValid("https://github.com/this-user-does-not-exist/fake-repo.git"));
    }
}
