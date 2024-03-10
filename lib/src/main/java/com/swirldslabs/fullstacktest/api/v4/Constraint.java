package com.swirldslabs.fullstacktest.api.v4;

import org.apiguardian.api.API;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.*;

import static org.apiguardian.api.API.Status.STABLE;

/**
 * {@code @Constraint} annotation associates constraint verifiers with test classes and methods.
 * */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({ConstraintExtension.class})
@Repeatable(Constraints.class)
@Inherited
@Documented
@API(status = STABLE, since = "1.0")
public @interface Constraint {
    Class<? extends ConstraintVerifier>[] value();
}
