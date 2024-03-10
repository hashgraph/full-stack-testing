package com.swirldslabs.fullstacktest.api.v4;

import java.lang.annotation.*;

/**
 * {@code @Constraints} may be used as a container for multiple {@code @Constraint} annotations.
 * */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Constraints {
    Constraint[] value();
}
