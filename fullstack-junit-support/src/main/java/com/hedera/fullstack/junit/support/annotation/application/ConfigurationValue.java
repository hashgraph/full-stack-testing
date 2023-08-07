package com.hedera.fullstack.junit.support.annotation.application;

import java.lang.annotation.*;

@Inherited
@Documented
@Repeatable(PlatformConfiguration.class)
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface ConfigurationValue {
    String name();

    String value();
}
