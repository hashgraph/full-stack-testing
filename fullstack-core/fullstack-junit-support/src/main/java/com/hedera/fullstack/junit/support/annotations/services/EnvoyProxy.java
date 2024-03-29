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

package com.hedera.fullstack.junit.support.annotations.services;

import java.lang.annotation.*;

/**
 * Indicates that the annotated test class or test method requires one or more Envoy Proxy servers to be deployed and
 * running.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface EnvoyProxy {
    /**
     * The number of Envoy Proxy servers to deploy. Defaults to 1 if not specified. The value provided must be greater
     * than or equal to 1 and less than or equal to the total number of application nodes in the deployment.
     *
     * @return the number of Envoy Proxy servers to deploy.
     */
    int value() default 1;
}
