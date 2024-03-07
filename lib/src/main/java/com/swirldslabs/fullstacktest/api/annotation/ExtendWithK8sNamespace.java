package com.swirldslabs.fullstacktest.api.annotation;

import com.swirldslabs.fullstacktest.api.extension.K8sNamespaceExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Deprecated
@Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({ K8sNamespaceExtension.class })
public @interface ExtendWithK8sNamespace {
}
