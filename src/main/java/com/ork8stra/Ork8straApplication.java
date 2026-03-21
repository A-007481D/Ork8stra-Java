package com.ork8stra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Ork8straApplication {

    public static void main(String[] args) {
        SpringApplication.run(Ork8straApplication.class, args);
    }

}
