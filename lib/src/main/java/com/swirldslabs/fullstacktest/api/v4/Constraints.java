package com.swirldslabs.fullstacktest.api.v4;

import java.lang.annotation.*;

@Target({ ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Constraints {
    Constraint[] value();
}
