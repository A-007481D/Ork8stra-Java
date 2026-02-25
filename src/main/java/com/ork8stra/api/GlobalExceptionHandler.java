package com.ork8stra.api;

import com.ork8stra.api.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex, HttpServletRequest request) {
                log.warn("Bad request on '{}': {}", request.getRequestURI(), ex.getMessage());
                return ResponseEntity.badRequest().body(ErrorResponse.builder()
                                .status(400)
                                .error("Bad Request")
                                .message(ex.getMessage())
                                .path(request.getRequestURI())
                                .build());
        }

        @ExceptionHandler(NoSuchElementException.class)
        public ResponseEntity<ErrorResponse> handleNotFound(NoSuchElementException ex, HttpServletRequest request) {
                log.warn("Resource not found on '{}': {}", request.getRequestURI(), ex.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse.builder()
                                .status(404)
                                .error("Not Found")
                                .message(ex.getMessage())
                                .path(request.getRequestURI())
                                .build());
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                        HttpServletRequest request) {
                String errors = ex.getBindingResult().getFieldErrors().stream()
                                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                                .collect(Collectors.joining(", "));

                log.warn("Validation failed on '{}': {}", request.getRequestURI(), errors);
                return ResponseEntity.badRequest().body(ErrorResponse.builder()
                                .status(400)
                                .error("Validation Failed")
                                .message(errors)
                                .path(request.getRequestURI())
                                .build());
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ErrorResponse> handleConflict(IllegalStateException ex, HttpServletRequest request) {
                log.warn("Conflict on '{}': {}", request.getRequestURI(), ex.getMessage());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse.builder()
                                .status(409)
                                .error("Conflict")
                                .message(ex.getMessage())
                                .path(request.getRequestURI())
                                .build());
        }

        @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
        public ResponseEntity<ErrorResponse> handleBadCredentials(
                        org.springframework.security.authentication.BadCredentialsException ex,
                        HttpServletRequest request) {
                log.warn("Bad credentials on '{}': {}", request.getRequestURI(), ex.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErrorResponse.builder()
                                .status(401)
                                .error("Unauthorized")
                                .message("Invalid username or password")
                                .path(request.getRequestURI())
                                .build());
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
                log.error("Unhandled exception on '{}'", request.getRequestURI(), ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ErrorResponse.builder()
                                .status(500)
                                .error("Internal Server Error")
                                .message("An unexpected error occurred")
                                .path(request.getRequestURI())
                                .build());
        }
}
