package com.ork8stra.auth;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {



    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) throws Exception {
        log.info("DataInitializer: Skipping global administrative check for security hardening.");
        // Admin promotion should be handled via explicit invitation or administrative API
    }
}
