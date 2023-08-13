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

import java.lang.annotation.*;

/**
 * Configures the Platform application to be executed by a test. This annotation may be applied to a test class or
 * test method. If applied to a test class, the configuration will be applied to all test methods in the class. If
 * applied to a test method, the configuration will be applied to only that test method. If applied to both a test
 * class and a test method, the configuration applied to the test method will override the configuration applied to
 * the test class.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface PlatformApplication {
    /**
     * Specifies the name of the Platform application jar file. The default value is {@code HederaNode.jar}. Only the
     * name of the JAR file should be specified, not the path. The JAR file must be located in the {@code data/apps}
     * directory of the Platform deployment.
     *
     * <p>
     * This value is used to form the {@code <jar-name>} portion of {@code app, <jar-name>, <parameters>} specification
     * for the Platform SDK {@code config.txt} definition.
     *
     * @return the name of the Platform application jar file.
     */
    String fileName() default "HederaNode.jar";

    /**
     * Specifies the parameters to be passed to the Platform application. The default value is an empty array. The
     * parameters are passed to the Platform application in the order specified. The values must not contain any commas.
     *
     * <p>
     * This value is used to form the {@code <parameters>} portion of {@code app, <jar-name>, <parameters>} specification
     * for the Platform SDK {@code config.txt} definition.
     *
     * @return the parameters to be passed to the Platform application.
     */
    String[] parameters() default {};
}
