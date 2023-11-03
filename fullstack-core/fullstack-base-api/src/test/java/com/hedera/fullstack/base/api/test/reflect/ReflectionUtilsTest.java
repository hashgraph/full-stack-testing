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
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.hedera.fullstack.base.api.reflect.ReflectionUtils;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

public class ReflectionUtilsTest {
    static Stream<Arguments> primitiveAndWrapperSupplier() {
        return Stream.of(
                arguments(named("void.class", void.class), named("Void.class", Void.class)),
                arguments(named("boolean.class", boolean.class), named("Boolean.class", Boolean.class)),
                arguments(named("byte.class", byte.class), named("Byte.class", Byte.class)),
                arguments(named("char.class", char.class), named("Character.class", Character.class)),
                arguments(named("short.class", short.class), named("Short.class", Short.class)),
                arguments(named("int.class", int.class), named("Integer.class", Integer.class)),
                arguments(named("long.class", long.class), named("Long.class", Long.class)),
                arguments(named("float.class", float.class), named("Float.class", Float.class)),
                arguments(named("double.class", double.class), named("Double.class", Double.class)),
                arguments(named("String.class", String.class), named("String.class", String.class)));
    }

    @ParameterizedTest(name = "Validate wrapper for {0}")
    @MethodSource("primitiveAndWrapperSupplier")
    @DisplayName("Test primitive as wrapper class")
    void testPrimitiveAsWrapperClass(Class<?> primitiveClass, Class<?> wrapperClass) {
        Class<?> result = ReflectionUtils.primitiveAsWrapperClass(primitiveClass);
        assertThat(result).isEqualTo(wrapperClass);
    }

    @ParameterizedTest(name = "Validate primitive for {1}")
    @MethodSource("primitiveAndWrapperSupplier")
    @DisplayName("Test wrapper as primitive class")
    void testWrapperAsPrimitiveClass(Class<?> primitiveClass, Class<?> wrapperClass) {
        Class<?> result = ReflectionUtils.wrapperAsPrimitiveClass(wrapperClass);
        assertThat(result).isEqualTo(primitiveClass);
    }
}
