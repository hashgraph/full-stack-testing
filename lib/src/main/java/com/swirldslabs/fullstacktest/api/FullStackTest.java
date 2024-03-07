package com.swirldslabs.fullstacktest.api;

import org.apiguardian.api.API;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.*;

import static org.apiguardian.api.API.Status.STABLE;

/**
 * main hook into FST
 *
 * maybe use withEnv, withValidator, withMonitor instead since env is once, and the others are zero or more.
 * maybe rename validator and monitor?
 * also validators are easy to handle in @after methods
 * maybe add annotation for @during for code that runs during the test, then it would be optional to use @monitor annotation.
 */

@Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith({ FullStackTestExtension.class })
@Inherited
@Documented
@API(status = STABLE, since = "1.0")
public @interface FullStackTest {
    /**
     * environment
     */
    Class<? extends Environment> environment() default Environment.class;

    /**
     * monitors
     */
    Class<? extends Monitor>[] monitors() default {};

    /**
     * validators
     */
    Class<? extends Validator>[] validators() default {};
}
