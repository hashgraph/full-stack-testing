package com.hedera.fullstack.junit.support.annotations.application;

import java.lang.annotation.*;

@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface PlatformConfiguration {
    ConfigurationValue[] value();

    Class<?> defaultsOverride() default Void.class;
}
