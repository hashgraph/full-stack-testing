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

package com.hedera.fullstack.junit.support.annotations.flow;

import com.hedera.fullstack.readiness.api.ReadinessCheck;
import java.lang.annotation.*;

/**
 * Suppresses the specified readiness checks for the annotated method. The behavior of this annotation is to suppress the
 * readiness check, if present, regardless of the inheritance path from which the readiness check was applied.
 */
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
public @interface SuppressReadinessChecks {
    /**
     * An array of readiness checks to suppress.
     *
     * @return the array of readiness checks to be suppressed.
     */
    Class<? extends ReadinessCheck>[] value();

    //    String[] nodeLabels() default {};
    //
    //    int[] nodeIndices() default {};
}
