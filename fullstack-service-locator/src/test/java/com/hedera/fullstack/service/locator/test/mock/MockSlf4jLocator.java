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

package com.hedera.fullstack.service.locator.test.mock;

import com.hedera.fullstack.service.locator.api.ArtifactLoader;
import com.hedera.fullstack.service.locator.api.ServiceLocator;
import java.util.ServiceLoader;
import org.slf4j.spi.SLF4JServiceProvider;

public class MockSlf4jLocator extends ServiceLocator<SLF4JServiceProvider> {
    private MockSlf4jLocator(ServiceLoader<SLF4JServiceProvider> serviceLoader) {
        super(serviceLoader);
    }

    public static ServiceLocator<SLF4JServiceProvider> create() {
        return new MockSlf4jLocator(ServiceLoader.load(SLF4JServiceProvider.class));
    }

    public static ServiceLocator<SLF4JServiceProvider> create(final ArtifactLoader loader) {
        return new MockSlf4jLocator(ServiceLoader.load(loader.moduleLayer(), SLF4JServiceProvider.class));
    }
}
