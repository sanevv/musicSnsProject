package com.github.musicsnsproject.common.exceptions;

import lombok.Getter;

@Getter
public class DuplicateKeyException extends MakeRuntimeException{

    protected DuplicateKeyException(MakeRuntimeException.ExceptionBuilder<?, ?> exceptionBuilder) {
        super(exceptionBuilder);
    }
    public static ExceptionBuilder of() {
        return new ExceptionBuilder();
    }

    public static class ExceptionBuilder extends MakeRuntimeException.ExceptionBuilder<ExceptionBuilder, DuplicateKeyException> {

        public ExceptionBuilder() {
            super(DuplicateKeyException.class);
        }

        @Override
        protected ExceptionBuilder self() {
            return this;
        }
    }
}
