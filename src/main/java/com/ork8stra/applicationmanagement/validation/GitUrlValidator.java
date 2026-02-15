package com.ork8stra.applicationmanagement.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Pattern;

@Slf4j
@Component
public class GitUrlValidator {

    private static final Pattern URL_PATTERN = Pattern
            .compile("^(https?://)([\\w.-]+)(:[0-9]+)?(/[\\w.-]+){2,}(\\.git)?/?$");

    private HttpClient httpClient;

    public GitUrlValidator() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    void setHttpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public boolean isValid(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }

        if (!URL_PATTERN.matcher(url).matches()) {
            log.warn("Git URL validation failed regex match: {}", url);
            return false;
        }

        return isReachable(url);
    }

    private boolean isReachable(String url) {
        try {

            String checkUrl = url.endsWith(".git") ? url.substring(0, url.length() - 4) : url;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(checkUrl))
                    .timeout(Duration.ofSeconds(5))
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            int statusCode = response.statusCode();

            if (statusCode == 200 || statusCode == 429 || statusCode == 403) {
                return true;
            }

            log.warn("Git URL {} returned HTTP status: {}", url, statusCode);
            return false;

        } catch (Exception e) {
            log.warn("Git URL {} reachability check failed: {}", url, e.getMessage());
            return false;
        }
    }
}
