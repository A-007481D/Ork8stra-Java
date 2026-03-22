package com.ork8stra.auth;

import com.ork8stra.user.PlatformRole;
import com.ork8stra.user.User;
import com.ork8stra.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // Ensure the developer user is a global ADMIN
        String developerUsername = "A-007481D_f7a78";
        
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(developerUsername);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.isAdmin()) {
                log.info("Promoting user {} to global ADMIN", developerUsername);
                user.getRoles().add(PlatformRole.ADMIN);
                userRepository.save(user);
            }
        } else {
            log.warn("Developer user {} not found during data initialization", developerUsername);
        }
    }
}
