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
