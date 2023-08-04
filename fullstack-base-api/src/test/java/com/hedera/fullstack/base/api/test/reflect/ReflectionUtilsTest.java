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

    @ParameterizedTest
    @MethodSource
    @DisplayName("Test wrapper as primitive class")
    void testWrapperAsPrimitiveClass(WrapperAsPrimitiveClassTestParameters parameters) {
        Class<?> wrapperClass = parameters.wrapperClass();
        Class<?> primitiveClass = parameters.primitiveClass();
        Class<?> result = ReflectionUtils.wrapperAsPrimitiveClass(wrapperClass);
        assertThat(result).isEqualTo(primitiveClass);
    }

    static Stream<Named<WrapperAsPrimitiveClassTestParameters>> testWrapperAsPrimitiveClass() {
        return Stream.of(
                named(
                        "Validate primitive for Void.class",
                        new WrapperAsPrimitiveClassTestParameters(Void.class, void.class)),
                named(
                        "Validate primitive for Boolean.class",
                        new WrapperAsPrimitiveClassTestParameters(Boolean.class, boolean.class)),
                named(
                        "Validate primitive for Byte.class",
                        new WrapperAsPrimitiveClassTestParameters(Byte.class, byte.class)),
                named(
                        "Validate primitive for Character.class",
                        new WrapperAsPrimitiveClassTestParameters(Character.class, char.class)),
                named(
                        "Validate primitive for Short.class",
                        new WrapperAsPrimitiveClassTestParameters(Short.class, short.class)),
                named(
                        "Validate primitive for Integer.class",
                        new WrapperAsPrimitiveClassTestParameters(Integer.class, int.class)),
                named(
                        "Validate primitive for Long.class",
                        new WrapperAsPrimitiveClassTestParameters(Long.class, long.class)),
                named(
                        "Validate primitive for Float.class",
                        new WrapperAsPrimitiveClassTestParameters(Float.class, float.class)),
                named(
                        "Validate primitive for Double.class",
                        new WrapperAsPrimitiveClassTestParameters(Double.class, double.class)));
    }
}
