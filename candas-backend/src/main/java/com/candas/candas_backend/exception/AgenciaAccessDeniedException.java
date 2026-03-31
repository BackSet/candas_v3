package com.candas.candas_backend.exception;

public class AgenciaAccessDeniedException extends RuntimeException {
    public AgenciaAccessDeniedException(String message) {
        super(message);
    }
}
