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

package com.hedera.fullstack.base.api.reflect;

import java.util.Objects;

/**
 * A useful set of shared reflection utilities.
 */
public final class ReflectionUtils {

    /**
     * Private constructor to prevent instantiation.
     */
    private ReflectionUtils() {}

    /**
     * Converts the given object instances to an array of their respective classes.
     *
     * @param args the varargs to convert to an array of classes.
     * @return the classes of the given varargs or an empty array if the given varargs is null or empty.
     */
    public static Class<?>[] determineArgumentTypes(final Object... args) {
        if (args == null || args.length == 0) {
            return new Class<?>[0];
        }

        final Class<?>[] parameterTypes = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) {
            parameterTypes[i] = (args[i] == null) ? Void.class : args[i].getClass();
        }

        return parameterTypes;
    }

    /**
     * Formats the array of types as a human-readable string. This method normalizes the parameter types to their
     * simple name and comma separates them as they would appear in a method signature.
     *
     * @param types the parameter types to format.
     * @return the types as a human-readable string.
     */
    public static String formatTypeArray(final Class<?>... types) {
        final StringBuilder builder = new StringBuilder();

        for (int i = 0; i < types.length; i++) {
            builder.append((types[i] == null) ? "null" : types[i].getSimpleName());
            if (i < types.length - 1) {
                builder.append(", ");
            }
        }

        return builder.toString();
    }

    /**
     * Determines the primitive class for the given wrapper class. If the given type is not a wrapper class, the
     * original class is returned.
     *
     * @param type the wrapper class to be mapped to a primitive class.
     * @return the primitive class for the given parameter type or the original class if the type is not a
     * wrapper class.
     */
    public static Class<?> wrapperAsPrimitiveClass(final Class<?> type) {
        if (type == Void.class) {
            return Void.TYPE;
        } else if (type == Boolean.class) {
            return Boolean.TYPE;
        } else if (type == Byte.class) {
            return Byte.TYPE;
        } else if (type == Character.class) {
            return Character.TYPE;
        } else if (type == Short.class) {
            return Short.TYPE;
        } else if (type == Integer.class) {
            return Integer.TYPE;
        } else if (type == Long.class) {
            return Long.TYPE;
        } else if (type == Float.class) {
            return Float.TYPE;
        } else if (type == Double.class) {
            return Double.TYPE;
        }

        return type;
    }

    /**
     * Determines the wrapper class for the given primitive type. If the given type is not a primitive, the
     * original type is returned.
     *
     * @param type the parameter type to be mapped to a wrapper class.
     * @return the wrapper class for the given parameter type or the original class if the type is not a
     * wrapper class.
     */
    public static Class<?> primitiveAsWrapperClass(final Class<?> type) {
        // shortcut the comparison if the type is not a primitive
        if (type != null && !type.isPrimitive()) {
            return type;
        }

        if (type == Void.TYPE) {
            return Void.class;
        } else if (type == Boolean.TYPE) {
            return Boolean.class;
        } else if (type == Byte.TYPE) {
            return Byte.class;
        } else if (type == Character.TYPE) {
            return Character.class;
        } else if (type == Short.TYPE) {
            return Short.class;
        } else if (type == Integer.TYPE) {
            return Integer.class;
        } else if (type == Long.TYPE) {
            return Long.class;
        } else if (type == Float.TYPE) {
            return Float.class;
        } else if (type == Double.TYPE) {
            return Double.class;
        }

        return type;
    }

    /**
     * Determines whether the given {@code type} parameter is the same as or a superclass or superinterface of the
     * {@code otherType} parameter. If the {@code strict} parameter is {@code true}, only primitive coercion is used
     * and the class types must match exactly.
     *
     * <p>
     *     When not using strict mode, the following rules apply:
     *     <ul>
     *         <li>The {@code type} and {@code otherType} parameters are checked for direct equality.</li>
     *         <li>If the {@code type} or {@code otherType} parameters are a primitive type, the both are converted to
     *         the associated wrapper types and then compared for equality.</li>
     *         <li>If the {@code otherType} parameter is equal to {@link Void#getClass()} then it is assumed a
     *         {@code null} value was passed for the parameter and comparison will solely based on whether the {@code type}
     *         parameter is a primitive value.</li>
     *         <li>The {@code type} parameter is checked to see if it is a superclass or superinterface of the
     *         {@code otherType} parameter.</li>
     *     </ul>
     *
     * @param type      the type to check for equality, superclass of, or superinterface of the {@code otherType}
     *                  parameter.
     * @param otherType the type to check for equality, subclass of, or sub-interface of the {@code type} parameter.
     * @param strict    if {@code true} then the types must match exactly (except for primitive coercion).
     * @return {@code true} if the {@code type} parameter is the same as or a superclass or superinterface of the
     * {@code otherType} parameter.
     */
    public static boolean isMatchingType(final Class<?> type, final Class<?> otherType, final boolean strict) {
        Objects.requireNonNull(type, "type must not be null");
        Objects.requireNonNull(otherType, "otherType must not be null");

        if (type == otherType) {
            return true;
        }

        if (otherType != Void.class && (type.isPrimitive() || otherType.isPrimitive())) {
            return primitiveAsWrapperClass(type) == primitiveAsWrapperClass(otherType);
        }

        if (strict) {
            return false;
        }

        if (otherType == Void.class) {
            return !type.isPrimitive();
        }

        return type.isAssignableFrom(otherType);
    }

    /**
     * Compares the two arrays of types for equality. If the {@code strict} parameter is {@code true}, only primitive
     * coercion is used and the class types must match exactly. Otherwise, the same rules defined by
     * {@link #isMatchingType(Class, Class, boolean)} apply.
     *
     * @param types      the array of types to check for equality, superclass of, or superinterface of the
     *                   {@code otherTypes} array.
     * @param otherTypes the array of types to check for equality, subclass of, or sub-interface of the {@code types}
     *                   array.
     * @param strict     if {@code true} then the types must match exactly (except for primitive coercion).
     * @return {@code true} if the {@code types} array is the same as or a superclass or superinterface of the
     * {@code otherTypes} array.
     */
    public static boolean isMatchingTypeArray(
            final Class<?>[] types, final Class<?>[] otherTypes, final boolean strict) {
        Objects.requireNonNull(types, "types must not be null");
        Objects.requireNonNull(otherTypes, "otherTypes must not be null");

        if (types.length != otherTypes.length) {
            return false;
        }

        for (int i = 0; i < types.length; i++) {
            if (!isMatchingType(types[i], otherTypes[i], strict)) {
                return false;
            }
        }

        return true;
    }
}
