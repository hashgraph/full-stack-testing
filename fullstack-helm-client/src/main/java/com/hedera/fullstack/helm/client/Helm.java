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

package com.hedera.fullstack.helm.client;

import com.hedera.fullstack.helm.client.builder.HelmClientBuilderImpl;

/**
 * The factory for creating {@link HelmClient} instances.
 */
public abstract class Helm {

    public static HelmClientBuilder builder() {
        return new HelmClientBuilderImpl();
    }

    public static HelmClient defaultClient() {
        return builder().build();
    }
}
