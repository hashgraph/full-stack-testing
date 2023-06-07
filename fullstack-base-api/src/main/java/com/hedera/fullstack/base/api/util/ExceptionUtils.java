package com.hedera.fullstack.base.api.util;

/**
 * Standard utility methods for dealing with exceptions.
 */
public class ExceptionUtils {

    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private ExceptionUtils() {
    }

    /**
     * Suppresses all exceptions throw by the given method.
     *
     * @param fn the method for which all exceptions should be suppressed.
     */
    @SuppressWarnings("java:S1181")
    public static void suppressExceptions(final Runnable fn) {
        try {
            fn.run();
        } catch (final Throwable ignored) {
            // ignore
        }
    }
}
