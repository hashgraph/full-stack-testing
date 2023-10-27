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

package com.hedera.fullstack.junit.support.annotations.application;

import com.hedera.fullstack.junit.support.annotations.resource.ResourceShape;
import java.lang.annotation.*;

/**
 * Defines multiple identical application nodes with a resource shape specification, and zero or more tags. This
 * annotation is mutually exclusive with the {@link NamedApplicationNode} annotation and must not be used in conjunction
 * with each other on the same element. When {@link ApplicationNodes}, {@link NamedApplicationNode}, or any combination
 * thereof is defined at the class level and at the test method level, then the annotations declared on the class will
 * be ignored and only the annotations declared on the test method will be used.
 *
 * @see NamedApplicationNode
 * @see NamedApplicationNodes
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface ApplicationNodes {
    /**
     * The number of identical application nodes to be created. This value must be greater than or equal to 1.
     *
     * @return the number of application nodes.
     */
    int value();

    /**
     * The description of the physical machine specification on which the application is deployed. Uses the defaults
     * as defined in {@link ResourceShape} if not explicitly specified.
     *
     * @return the resource shape specification.
     */
    ResourceShape shape() default @ResourceShape;

    /**
     * An optional array of tags to be applied to the application node. The default value is an empty array.
     *
     * @return an array of tags.
     */
    String[] tags() default {};
}
