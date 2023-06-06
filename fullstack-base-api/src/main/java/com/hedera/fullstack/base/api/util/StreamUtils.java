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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public final class StreamUtils {
    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private StreamUtils() {}

    /**
     * Converts an input stream to a string.
     * @param inputStream the input stream to convert.
     * @return the string representation of the input stream.
     */
    public static String streamToString(final InputStream inputStream) {
        InputStreamReader inputStreamReader = new InputStreamReader(inputStream);
        BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
        String lineRead;
        StringBuffer sb = new StringBuffer();
        try {
            while ((lineRead = bufferedReader.readLine()) != null) {
                sb.append(lineRead);
            }
        } catch (IOException e) {
            sb.append("... interrupted by: " + e.getMessage());
        }

        return sb.toString();
    }
}
