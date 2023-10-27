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

package com.hedera.fullstack.base.api.util;

import static java.util.concurrent.TimeUnit.MILLISECONDS;

/**
 * Standard utility methods for dealing with threads.
 */
public final class ThreadUtils {

    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private ThreadUtils() {}

    /**
     * Creates a new thread that will run perpetually until interrupted. This is a daemon thread which has not been started.
     *
     * @return the new thread.
     */
    public static Thread newPerpetualThread() {
        final Thread thread = new Thread(() -> {
            while (true) {
                try {
                    MILLISECONDS.sleep(Long.MAX_VALUE);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        thread.setName("perpetual-thread");
        thread.setDaemon(true);
        return thread;
    }
}
