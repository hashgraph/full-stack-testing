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

import com.hedera.fullstack.service.locator.api.ServiceLocator;
import com.hedera.fullstack.service.locator.test.mock.CtorService;
import com.hedera.fullstack.service.locator.test.mock.MockCtorService;
import com.hedera.fullstack.service.locator.test.mock.MockLocator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Service Locator")
class ServiceLocatorTest {

    @Test
    @DisplayName("MultiplePublicCtor: Provider is loaded correctly")
    void mpcProviderIsLoadedCorrectly() {
        final ServiceLocator<CtorService> locator = MockLocator.create();
        assertThat(locator).isNotNull();
        assertThat(locator.findFirst()).isPresent().hasValueSatisfying(s -> assertThat(s)
                .isInstanceOf(CtorService.class)
                .isInstanceOf(MockCtorService.class));
    }

    @Test
    @DisplayName("MultiplePublicCtor: Provider returns correct number of implementations")
    void mpcProviderReturnsCorrectNumberOfImplementations() {
        final ServiceLocator<CtorService> locator = MockLocator.create();
        assertThat(locator).isNotNull();
        assertThat(locator.stream().count()).isEqualTo(1);
    }

    @Test
    @DisplayName("MultiplePublicCtor: Provider returns valid supplier")
    void mpcProviderReturnsValidSupplier() {
        final ServiceLocator<CtorService> locator = MockLocator.create();
        assertThat(locator).isNotNull();
        assertThat(locator.findFirstSupplier()).isPresent().hasValueSatisfying(s -> assertThat(s)
                .isNotNull()
                .extracting(v -> v.newServiceInstance(512))
                .isNotNull()
                .extracting(CtorService::getIntValue)
                .isEqualTo(512));
    }

    @Test
    @DisplayName("MultiplePublicCtor: Provider has working parallel stream support")
    void mpcProviderHasWorkingParallelStreamSupport() {
        final ServiceLocator<CtorService> locator = MockLocator.create();
        assertThat(locator).isNotNull();
        assertThat(locator.parallelStream().count()).isEqualTo(1);
    }

    @Test
    @DisplayName("MultiplePublicCtor: Provider has working reload support")
    void mpcProviderHasWorkingReloadSupport() {
        final ServiceLocator<CtorService> locator = MockLocator.create();
        assertThat(locator).isNotNull();
        assertThat(locator.stream().count()).isEqualTo(1);
        locator.reload();
        assertThat(locator.stream().count()).isEqualTo(1);
    }
}
