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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hedera.fullstack.base.api.reflect.ClassConstructionException;
import com.hedera.fullstack.base.api.reflect.Construction;
import java.io.ByteArrayInputStream;
import java.io.ObjectOutputStream;
import java.io.OutputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ConstructionTest {

    @Test
    @DisplayName("Certify that we can construct a JVM provided classes")
    void constructJvmClass() {
        final Construction<ByteArrayInputStream> construction = Construction.of(ByteArrayInputStream.class);
        assertThat(construction).isNotNull();

        final ByteArrayInputStream instance1 = construction.newInstance((Object) new byte[100]);
        final ByteArrayInputStream instance2 = construction.newInstance((Object) new byte[100]);

        assertThat(instance1).isNotNull().isNotSameAs(instance2);
        assertThat(instance1.available()).isEqualTo(100);

        assertThat(instance2).isNotNull();
        assertThat(instance2.available()).isEqualTo(100);
    }

    @Test
    @DisplayName("Ensure Construction.of() throws exceptions correctly")
    void constructionOfThrowsExceptions() {
        assertThatThrownBy(() -> Construction.of(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("type must not be null");

        assertThatThrownBy(() -> Construction.of(int.class))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("type must not be a primitive");

        assertThatThrownBy(() -> Construction.of(int[].class))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("type must not be an array");

        assertThatThrownBy(() -> Construction.of(System.class))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("The class java.lang.System must have at least one accessible constructor");
    }

    @Test
    @DisplayName("Ensure Construction.newInstance() throws exceptions correctly")
    void newInstanceThrowsExceptions() {
        final Construction<ByteArrayInputStream> baisCtor = Construction.of(ByteArrayInputStream.class);
        assertThat(baisCtor).isNotNull();

        final byte[] nullBytes = null;

        assertThatThrownBy(baisCtor::newInstance)
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ByteArrayInputStream matching the specification: public ByteArrayInputStream()");

        assertThatThrownBy(() -> baisCtor.newInstance((Object) nullBytes))
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "Failed to instantiate java.io.ByteArrayInputStream because the constructor threw an exception");

        assertThatThrownBy(() -> baisCtor.newInstance((Object) new byte[100], (Object) new byte[100]))
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ByteArrayInputStream matching the specification: public ByteArrayInputStream(byte[], byte[])");

        final Construction<ObjectOutputStream> oosCtor = Construction.of(ObjectOutputStream.class);
        assertThat(oosCtor).isNotNull();

        final Object nullObject = null;

        assertThatThrownBy(oosCtor::newInstance)
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ObjectOutputStream matching the specification: public ObjectOutputStream()");

        assertThatThrownBy(() -> {
                    try (final OutputStream os = oosCtor.newInstance(nullObject)) {}
                })
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "Failed to instantiate java.io.ObjectOutputStream because the constructor threw an exception");
    }

    @Test
    @DisplayName("Ensure Construction.newInstanceStrict() throws exceptions correctly")
    void newInstanceStrictThrowsExceptions() {
        final Construction<ByteArrayInputStream> baisCtor = Construction.of(ByteArrayInputStream.class);
        assertThat(baisCtor).isNotNull();

        final byte[] nullBytes = null;

        assertThatThrownBy(baisCtor::newInstanceStrict)
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ByteArrayInputStream matching the specification: public ByteArrayInputStream()");

        assertThatThrownBy(() -> baisCtor.newInstanceStrict((Object) nullBytes))
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ByteArrayInputStream matching the specification: public ByteArrayInputStream(Void)");

        assertThatThrownBy(() -> baisCtor.newInstanceStrict((Object) new byte[100], (Object) new byte[100]))
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ByteArrayInputStream matching the specification: public ByteArrayInputStream(byte[], byte[])");

        final Construction<ObjectOutputStream> oosCtor = Construction.of(ObjectOutputStream.class);
        assertThat(oosCtor).isNotNull();

        final Object nullObject = null;

        assertThatThrownBy(oosCtor::newInstanceStrict)
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ObjectOutputStream matching the specification: public ObjectOutputStream()");

        assertThatThrownBy(() -> {
                    try (final OutputStream os = oosCtor.newInstanceStrict(nullObject)) {}
                })
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for java.io.ObjectOutputStream matching the specification: public ObjectOutputStream(Void)");
    }
}
