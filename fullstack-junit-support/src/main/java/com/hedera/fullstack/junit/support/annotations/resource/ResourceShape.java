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

package com.hedera.fullstack.junit.support.annotations.resource;

import com.hedera.fullstack.base.api.units.StorageUnits;
import com.hedera.fullstack.junit.support.annotations.application.ApplicationNodes;
import com.hedera.fullstack.junit.support.annotations.application.NamedApplicationNode;
import java.lang.annotation.*;

/**
 * Describes the resource limits (CPU, Memory, Disk) for a physical machine, K8S pod, or container. This annotation
 * must be used as a parameter of another annotation, such as {@link ApplicationNodes} or {@link NamedApplicationNode}.
 */
@Inherited
@Documented
@Target({})
@Retention(RetentionPolicy.RUNTIME)
public @interface ResourceShape {
    /**
     * Defines the maximum allowable CPU cores in milli-cores. The milli-cores units are identical to the units used by
     * Kubernetes. For example, 1000 milli-cores is equivalent to 1 CPU core or hyper-thread. The default value is 2 CPU
     * cores/hyper-threads.
     *
     * @return the maximum allowable CPU cores in milli-cores.
     */
    float cpuInMillis() default 2000f;

    /**
     * The maximum memory to be allocated scaled according to the units specified by the {@link #memoryUnits()} property.
     * The default value is 16 GB.
     *
     * @return the maximum memory to be allocated.
     */
    long memorySize() default 16L;

    /**
     * The units for the {@link #memorySize()} property. The default value is {@link StorageUnits#GIGABYTES}.
     *
     * @return the units for the {@link #memorySize()} property.
     */
    StorageUnits memoryUnits() default StorageUnits.GIGABYTES;

    /**
     * The maximum disk size to be allocated scaled according to the units specified by the {@link #diskUnits()} property.
     * The default value is 32 GB.
     *
     * @return the maximum disk size to be allocated.
     */
    long diskSize() default 32L;

    /**
     * The units for the {@link #diskSize()} property. The default value is {@link StorageUnits#GIGABYTES}.
     *
     * @return the units for the {@link #diskSize()} property.
     */
    StorageUnits diskUnits() default StorageUnits.GIGABYTES;
}
