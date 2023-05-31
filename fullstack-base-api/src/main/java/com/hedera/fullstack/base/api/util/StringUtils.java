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

public final class StringUtils {

    /**
     * Constant value representing an empty string.
     */
    public static final String EMPTY = "";

    /**
     * Constant value representing an ASCII period.
     */
    public static final String PERIOD = ".";

    /**
     * Constant value representing an ASCII dash.
     */
    public static final String DASH = "-";

    /**
     * Constant value representing an ASCII plus sign.
     */
    public static final String PLUS = "+";

    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private StringUtils() {}

    /**
     * Compares two strings with null safe handling. If one of the strings is {@code null}, the other string is considered to be greater.
     * @param s1 the first string to compare.
     * @param s2 the second string to compare.
     * @return a negative integer, zero, or a positive integer as the first argument is less than, equal to, or greater than the second.
     */
    public static int compare(final String s1, final String s2) {
        if (s1 == null) {
            return s2 == null ? 0 : -1;
        } else if (s2 == null) {
            return 1;
        } else {
            return s1.compareTo(s2);
        }
    }

    /**
     * Checks if the given string is {@code null} and returns an empty string if it is null.
     * Otherwise, the original string is returned.
     *
     * @param s the string to check.
     * @return the original string if it is not {@code null}, otherwise {@link #EMPTY} is returned.
     */
    public static String nullToBlank(final String s) {
        return s == null ? EMPTY : s;
    }
}
