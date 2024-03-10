package com.swirldslabs.fullstacktest.api.v4;

import com.swirldslabs.fullstacktest.api.v3.TestMonitorExtension;
import org.apiguardian.api.API;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.*;

import static org.apiguardian.api.API.Status.STABLE;

/**
 * {@code @Constraint} is used to verify requirements.
 * */
@Target({ ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({ TestMonitorExtension.class })
@Repeatable(Constraints.class)
@Inherited
@Documented
@API(status = STABLE, since = "1.0")
public @interface Constraint {
    Class<? extends ConstraintVerifier>[] value();
}
