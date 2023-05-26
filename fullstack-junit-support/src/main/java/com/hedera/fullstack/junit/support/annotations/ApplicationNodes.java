package com.hedera.fullstack.junit.support.annotations;

import com.hedera.fullstack.junit.support.ApplicationProvisioner;

import java.lang.annotation.*;

@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface ApplicationNodes {
    int value();

    Class<ApplicationProvisioner> provisioner() default ApplicationProvisioner.class;
}
