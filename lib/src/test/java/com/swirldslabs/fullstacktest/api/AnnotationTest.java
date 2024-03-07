package com.swirldslabs.fullstacktest.api;

import org.apiguardian.api.API;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.*;

import static org.apiguardian.api.API.Status.STABLE;

public class AnnotationTest {

    @Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
    @Retention(RetentionPolicy.RUNTIME)
    @ExtendWith({ FullStackTestExtension.class })
    @Inherited
    @Documented
    @API(status = STABLE, since = "1.0")
    @Repeatable(FSTs.class)
    public @interface FST {
        String[] value();
    }

    @Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
    @Retention(RetentionPolicy.RUNTIME)
    @Inherited
    @Documented
    public @interface FSTs {
        FST[] value();
    }

    @FST("a")
    interface A {}

    @FST("b")
    static class B implements A {

        @FST("c")
        public void c() {}
    }

    @Test
    void test() {
        int i = 1;
    }
}
