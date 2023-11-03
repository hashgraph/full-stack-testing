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
 * Defines a single application node with a name, resource shape specification, and zero or more tags. This annotation
 * is mutually exclusive with the {@link ApplicationNodes} annotation and must not be used in conjunction
 * with each other on the same element. When {@link ApplicationNodes}, {@link NamedApplicationNode}, or any combination
 * thereof is defined at the class level and at the test method level, then the annotations declared on the class will
 * be ignored and only the annotations declared on the test method will be used.
 *
 * @see ApplicationNodes
 * @see NamedApplicationNodes
 */
@Inherited
@Documented
@Repeatable(NamedApplicationNodes.class)
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface NamedApplicationNode {
    /**
     * The user specific name or identifier of the application node. This name must be unique within the scope of the
     * test suite and test method. If this annotation is declared on a test method, then the name must be unique within
     * the scope of the test method. If this annotation is declared on a test class, then the name must be unique within
     * the scope of the test class.
     * <p>The user provided name must conform to the DNS label specification as defined in RFC 1035 (summarized below):
     * <ul>
     *     <li>Must be between 1 and 63 characters in length.</li>
     *     <li>Must start with a letter or number.</li>
     *     <li>Must end with a letter or number.</li>
     *     <li>Must contain only letters, numbers, or hyphens.</li>
     *     <li>Must not contain two consecutive hyphens.</li>
     *     <li>Must not contain a hyphen as the first or last character.</li>
     *     <li>Must be treated as case insensitive.</li>
     * </ul>
     *
     * @return the name of the application node.
     */
    String value();

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
