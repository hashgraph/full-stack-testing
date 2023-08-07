/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.hedera.fullstack.base.api.test.reflect;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Named.named;

import com.hedera.fullstack.base.api.reflect.ReflectionUtils;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

public class ReflectionUtilsTest {
    private record WrapperAsPrimitiveClassTestParameters(Class<?> wrapperClass, Class<?> primitiveClass) {}

    private record PrimitiveAsWrapperClassTestParameters(Class<?> primitiveClass, Class<?> wrapperClass) {}

    @ParameterizedTest(name = "Validate wrapper for {0}")
    @MethodSource("primitiveAndWrapperSupplier")
    @DisplayName("Test primitive as wrapper class")
    void testPrimitiveAsWrapperClass(PrimitiveAsWrapperClassTestParameters parameters) {
        Class<?> primitiveClass = parameters.primitiveClass();
        Class<?> wrapperClass = parameters.wrapperClass();
        Class<?> result = ReflectionUtils.primitiveAsWrapperClass(primitiveClass);
        assertThat(result).isEqualTo(wrapperClass);
    }

    static Stream<Argumenst> primitiveAndWrapperSupplier() {
        return Stream.of(
                arguments(named("void.class", void.class), named("Void.class", Void.class)),
                named(
                        "Validate wrapper for boolean.class",
                        new PrimitiveAsWrapperClassTestParameters(boolean.class, Boolean.class)),
                named(
                        "Validate wrapper for byte.class",
                        new PrimitiveAsWrapperClassTestParameters(byte.class, Byte.class)),
                named(
                        "Validate wrapper for char.class",
                        new PrimitiveAsWrapperClassTestParameters(char.class, Character.class)),
                named(
                        "Validate wrapper for short.class",
                        new PrimitiveAsWrapperClassTestParameters(short.class, Short.class)),
                named(
                        "Validate wrapper for int.class",
                        new PrimitiveAsWrapperClassTestParameters(int.class, Integer.class)),
                named(
                        "Validate wrapper for long.class",
                        new PrimitiveAsWrapperClassTestParameters(long.class, Long.class)),
                named(
                        "Validate wrapper for float.class",
                        new PrimitiveAsWrapperClassTestParameters(float.class, Float.class)),
                named(
                        "Validate wrapper for double.class",
                        new PrimitiveAsWrapperClassTestParameters(double.class, Double.class)),
                named(
                        "Validate wrapper for String.class",
                        new PrimitiveAsWrapperClassTestParameters(String.class, String.class)));
    }

    @ParameterizedTest(name = "Validate primitive for {1}")
    @MethodSource("primitiveAndWrapperSupplier")
    @DisplayName("Test wrapper as primitive class")
    void testWrapperAsPrimitiveClass(Class<?> primitiveClass, Class<?> wrapperClass) {
        Class<?> result = ReflectionUtils.wrapperAsPrimitiveClass(wrapperClass);
        assertThat(result).isEqualTo(primitiveClass);
    }

}
