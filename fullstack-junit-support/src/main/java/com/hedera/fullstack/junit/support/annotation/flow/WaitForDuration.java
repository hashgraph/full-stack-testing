package com.hedera.fullstack.junit.support.annotation.flow;

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;

@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface WaitForDuration {
    int value();

    TimeUnit unit() default TimeUnit.SECONDS;
}
