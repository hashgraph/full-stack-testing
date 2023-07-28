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

package com.hedera.fullstack.service.locator.test.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hedera.fullstack.base.api.reflect.ClassConstructionException;
import com.hedera.fullstack.service.locator.api.ServiceSupplier;
import com.hedera.fullstack.service.locator.test.mock.CtorService;
import com.hedera.fullstack.service.locator.test.mock.MultiplePublicCtorService;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Service Supplier")
class ServiceSupplierTest {

    @Test
    @DisplayName("MultiplePublicCtor: Basic Supplier Instantiation")
    void mpcBasicInstantiation() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);

        assertThat(supplier).isNotNull().extracting(ServiceSupplier::type).isSameAs(MultiplePublicCtorService.class);

        assertThatThrownBy(() -> new ServiceSupplier<>(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("type must not be null");
    }

    @Test
    @DisplayName("MultiplePublicCtor: Constructor Not Found")
    void mpcConstructorNotFound() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final OutputStream outputStreamValue = new ByteArrayOutputStream();

        assertThatThrownBy(() -> supplier.newServiceInstance(outputStreamValue))
                .isInstanceOf(ClassConstructionException.class)
                .hasMessageContaining(
                        "No public constructor found for com.hedera.fullstack.service.locator.test.mock.MultiplePublicCtorService");
    }

    @Test
    @DisplayName("MultiplePublicCtor: Zero Argument Constructor")
    void mpcZeroArgumentConstructor() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final CtorService zeroArgSvc = supplier.get();

        assertThat(zeroArgSvc).isNotNull();
        assertThat(zeroArgSvc.getStringValue()).isNull();
        assertThat(zeroArgSvc.getIntValue()).isZero();
        assertThat(zeroArgSvc.getInputStreamValue()).isNull();
    }

    @Test
    @DisplayName("MultiplePublicCtor: String Argument Constructor")
    void mpcStringArgumentConstructor() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final String stringValue = "Hello World!";
        final MultiplePublicCtorService stringArgSvc = supplier.cast(stringValue);

        assertThat(stringArgSvc).isNotNull();
        assertThat(stringArgSvc.getStringValue()).isEqualTo(stringValue);
        assertThat(stringArgSvc.getIntValue()).isZero();
        assertThat(stringArgSvc.getInputStreamValue()).isNull();
    }

    @Test
    @DisplayName("MultiplePublicCtor: Int Argument Constructor")
    void mpcIntArgumentConstructor() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final int intValue = 42;
        final CtorService intArgSvc = supplier.newServiceInstance(intValue);

        assertThat(intArgSvc).isNotNull();
        assertThat(intArgSvc.getStringValue()).isNull();
        assertThat(intArgSvc.getIntValue()).isEqualTo(intValue);
        assertThat(intArgSvc.getInputStreamValue()).isNull();
    }

    @Test
    @DisplayName("MultiplePublicCtor: InputStream Argument Constructor")
    void mpcInputStreamArgumentConstructor() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final ByteArrayInputStream inputStream = new ByteArrayInputStream(new byte[0]);
        final CtorService outputStreamArgSvc = supplier.newServiceInstance(inputStream);

        assertThat(outputStreamArgSvc).isNotNull();
        assertThat(outputStreamArgSvc.getStringValue()).isNull();
        assertThat(outputStreamArgSvc.getIntValue()).isZero();
        assertThat(outputStreamArgSvc.getInputStreamValue()).isSameAs(inputStream);
    }

    @Test
    @DisplayName("MultiplePublicCtor: String and Int Argument Constructor")
    void mpcStringAndIntArgumentConstructor() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final String stringValue = "Hello World!";
        final int intValue = 42;
        final CtorService stringAndIntArgSvc = supplier.newServiceInstance(stringValue, intValue);

        assertThat(stringAndIntArgSvc).isNotNull();
        assertThat(stringAndIntArgSvc.getStringValue()).isEqualTo(stringValue);
        assertThat(stringAndIntArgSvc.getIntValue()).isEqualTo(intValue);
        assertThat(stringAndIntArgSvc.getInputStreamValue()).isNull();
    }

    @Test
    @DisplayName("MultiplePublicCtor: String, Int, and InputStream Argument Constructor")
    void mpcStringIntAndInputStreamArgumentConstructor() {
        final ServiceSupplier<CtorService> supplier = new ServiceSupplier<>(MultiplePublicCtorService.class);
        final String stringValue = "Hello World!";
        final int intValue = 42;
        final InputStream inputStream = new ByteArrayInputStream(new byte[0]);
        final CtorService stringIntAndInputStreamArgSvc =
                supplier.newServiceInstance(stringValue, intValue, inputStream);

        assertThat(stringIntAndInputStreamArgSvc).isNotNull();
        assertThat(stringIntAndInputStreamArgSvc.getStringValue()).isEqualTo(stringValue);
        assertThat(stringIntAndInputStreamArgSvc.getIntValue()).isEqualTo(intValue);
        assertThat(stringIntAndInputStreamArgSvc.getInputStreamValue()).isSameAs(inputStream);
    }
}
