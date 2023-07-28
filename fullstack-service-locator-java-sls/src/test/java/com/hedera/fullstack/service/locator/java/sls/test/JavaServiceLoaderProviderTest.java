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

package com.hedera.fullstack.service.locator.java.sls.test;

import static org.assertj.core.api.Assertions.assertThat;

import com.hedera.fullstack.service.locator.api.ServiceLocator;
import com.hedera.fullstack.service.locator.java.sls.JavaServiceLoaderProvider;
import com.hedera.fullstack.service.locator.test.fixtures.mock.CtorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Java Service Loader Provider")
class JavaServiceLoaderProviderTest {

    @Test
    @DisplayName("JSLP: Correct provider is loaded")
    void correctProviderIsLoaded() {
        final ServiceLocator<CtorService> locator = ServiceLocator.forType(CtorService.class);
        assertThat(locator).isNotNull().isInstanceOf(JavaServiceLoaderProvider.class);
    }
}
