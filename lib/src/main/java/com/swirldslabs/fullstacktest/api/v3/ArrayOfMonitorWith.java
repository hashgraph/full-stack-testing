package com.swirldslabs.fullstacktest.api.v3;

import java.lang.annotation.*;

@Target({ ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface ArrayOfMonitorWith {
    MonitorWith[] value();
}
