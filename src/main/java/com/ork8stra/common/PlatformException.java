package com.ork8stra.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class PlatformException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public PlatformException(String message) {
        this(message, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR");
    }

    public PlatformException(String message, HttpStatus status) {
        this(message, status, status.name());
    }

    public PlatformException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public PlatformException(String message, Throwable cause) {
        super(message, cause);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
        this.errorCode = "INTERNAL_ERROR";
    }
}
