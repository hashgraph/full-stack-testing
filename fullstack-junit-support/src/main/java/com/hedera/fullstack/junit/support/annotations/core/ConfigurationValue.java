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

package com.hedera.fullstack.junit.support.annotations.core;

import java.lang.annotation.*;

/**
 * Represents a generic configuration value which comprises a key and value pair. This annotation may only be used
 * in conjunction with other annotations and may not be directly applied to test classes or methods.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({})
public @interface ConfigurationValue {
    /**
     * The key or name of the configuration value. Depending on the context, the key format may vary.
     *
     * @return the key or name of the configuration value.
     */
    String name();

    /**
     * The value of the specified configuration key/name. Depending on the context, the value format may vary.
     *
     * @return the value of the specified configuration key/name.
     */
    String value();
}
