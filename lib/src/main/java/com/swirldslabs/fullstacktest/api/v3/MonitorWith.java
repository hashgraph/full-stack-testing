package com.swirldslabs.fullstacktest.api.v3;

import org.apiguardian.api.API;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.*;

import static org.apiguardian.api.API.Status.STABLE;

@Target({ ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({ TestMonitorExtension.class })
@Repeatable(ArrayOfMonitorWith.class)
@Inherited
@Documented
@API(status = STABLE, since = "1.0")
public @interface MonitorWith {
    Class<? extends Monitor>[] value();
}
