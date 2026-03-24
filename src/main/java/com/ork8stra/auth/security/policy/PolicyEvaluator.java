package com.ork8stra.auth.security.policy;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

import static com.ork8stra.auth.security.policy.IAMPolicyModels.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PolicyEvaluator {

    private final ObjectMapper objectMapper;
    private final java.util.Map<String, PolicyDocument> policyCache = new java.util.concurrent.ConcurrentHashMap<>();

    public boolean isAllowed(List<String> policyDocuments, String action, String resource) {
        boolean allowed = false;

        for (String docJson : policyDocuments) {
            if (docJson == null || docJson.isBlank()) continue;

            try {
                PolicyDocument doc = policyCache.computeIfAbsent(docJson, json -> {
                    try {
                        return objectMapper.readValue(json, PolicyDocument.class);
                    } catch (Exception e) {
                        log.error("Failed to parse policy document JSON: {}", e.getMessage());
                        return null;
                    }
                });

                if (doc == null) continue;
                
                for (PolicyStatement statement : doc.getStatement()) {
                    if (matches(statement, action, resource)) {
                        if ("Deny".equalsIgnoreCase(statement.getEffect())) {
                            return false; // Explicit deny wins
                        }
                        if ("Allow".equalsIgnoreCase(statement.getEffect())) {
                            allowed = true;
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error evaluating policy: {}", e.getMessage());
            }
        }

        return allowed;
    }

    private boolean matches(PolicyStatement statement, String action, String resource) {
        return matchesAny(statement.getAction(), action) && matchesAny(statement.getResource(), resource);
    }

    private boolean matchesAny(List<String> patterns, String value) {
        if (patterns == null || value == null) return false;
        
        for (String pattern : patterns) {
            if ("*".equals(pattern)) return true;
            
            // Simple wildcard matching (e.g., project:*)
            String regex = pattern.replace(".", "\\.")
                                  .replace("*", ".*");
            if (Pattern.matches(regex, value)) {
                return true;
            }
        }
        return false;
    }
}
