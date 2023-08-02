package com.hedera.fullstack.examples.validators;

import com.hedera.fullstack.validator.api.ValidationContext;
import com.hedera.fullstack.validator.api.ValidationResult;
import com.hedera.fullstack.validator.api.Validator;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Future;

public class NodeStatisticHealthValidator implements Validator {

    @Override
    public Future<ValidationResult> validate(ValidationContext context) {
        return CompletableFuture.completedFuture(null);
    }
}
