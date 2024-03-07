package com.swirldslabs.fullstacktest.api.annotation;

import com.swirldslabs.fullstacktest.api.extension.FullStackTestExtension;
import org.apiguardian.api.API;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.*;

import static org.apiguardian.api.API.Status.STABLE;

/**
 * main hook into FST
 */

@Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({ FullStackTestExtension.class })
@Inherited
@Documented
@API(status = STABLE, since = "1.0")
public @interface FullStackTest {
}
