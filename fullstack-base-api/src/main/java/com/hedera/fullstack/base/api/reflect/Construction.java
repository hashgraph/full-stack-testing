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

import static com.hedera.fullstack.base.api.reflect.ReflectionUtils.*;

import com.hedera.fullstack.base.api.collections.KeyValuePair;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;

/**
 * Reflection utilities for constructing instances of classes.
 *
 * @param <T> the type of the class from which to construct an instance.
 */
public final class Construction<T> {

    /**
     * The class which this construction helper represents.
     */
    private final Class<T> type;

    /**
     * A cached list of constructors for the class represented by this construction helper.
     */
    private final List<KeyValuePair<Constructor<T>, Class<?>[]>> constructors;

    /**
     * Instantiates a construction helper for the given class.
     *
     * @param type the class which this construction helper represents.
     */
    private Construction(final Class<T> type) {
        this.type = type;
        this.constructors = new LinkedList<>();
    }

    /**
     * Creates a new construction helper for the given class.
     *
     * @param type the class which this construction helper represents.
     * @param <T>  the type of the class from which to construct an instance.
     * @return a new construction helper for the given class.
     * @throws NullPointerException     if type is null.
     * @throws IllegalArgumentException if type is a primitive, an array, or contains no accessible constructors.
     */
    public static <T> Construction<T> of(final Class<T> type) {
        Objects.requireNonNull(type, "type must not be null");

        if (type.isPrimitive()) {
            throw new IllegalArgumentException("type must not be a primitive");
        }

        if (type.isArray()) {
            throw new IllegalArgumentException("type must not be an array");
        }

        final Construction<T> c = new Construction<>(type);
        c.initialize();

        return c;
    }

    /**
     * @return the type of the service implementation.
     */
    public Class<T> type() {
        return this.type;
    }

    /**
     * Determines the existence of a constructor which matches the given parameter types. This method is a corollary to
     * the {@link #newInstance(Object...)} method.
     *
     * @param args the arguments which would be passed to the constructor. In this case the argument values are used
     *             solely for finding a matching constructor.
     * @return {@code true} if a matching constructor was found; otherwise, {@code false}.
     * @see #newInstance(Object...)
     */
    public boolean hasConstructor(final Object... args) {
        return hasConstructorInternal(determineArgumentTypes(args), false);
    }

    /**
     * Determines the existence of a constructor which matches the given parameter types. This method is a corollary to
     * the {@link #newInstanceStrict(Object...)} method.
     *
     * @param args the arguments which would be passed to the constructor. In this case the argument values are used
     *             solely for finding a matching constructor.
     * @return {@code true} if a matching constructor was found; otherwise, {@code false}.
     * @see #newInstanceStrict(Object...)
     */
    public boolean hasConstructorStrict(final Object... args) {
        return hasConstructorInternal(determineArgumentTypes(args), true);
    }

    /**
     * Constructs a new instance of the class represented by this construction helper.
     *
     * @param args the arguments to pass to the constructor. If the constructor takes no arguments, no arguments need
     *             to be passed.
     * @return a new instance of the class represented by this construction helper.
     */
    public T newInstance(final Object... args) {
        return newInstanceInternal(args, false);
    }

    /**
     * Constructs a new instance of the class represented by this construction helper. This method variant uses strict
     * parameter type matching rules.
     *
     * @param args the arguments to pass to the constructor. If the constructor takes no arguments, no arguments need
     *             to be passed.
     * @return a new instance of the class represented by this construction helper.
     */
    public T newInstanceStrict(final Object... args) {
        return newInstanceInternal(args, true);
    }

    /**
     * Initializes the constructor cache.
     *
     * @throws IllegalArgumentException if the underlying class contains no accessible constructors.
     */
    @SuppressWarnings("unchecked")
    private void initialize() {
        final Constructor<?>[] ctors = type.getDeclaredConstructors();

        for (final Constructor<?> c : ctors) {
            if (Modifier.isPublic(c.getModifiers())) {
                constructors.add(KeyValuePair.of((Constructor<T>) c, c.getParameterTypes()));
            }
        }

        if (constructors.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format("The class %s must have at least one accessible constructor", type.getName()));
        }
    }

    /**
     * Attempts to locate a constructor which matches the given parameter types. If {@code strict} matching is enabled,
     * the parameter types must match exactly. Otherwise, the parameter types must be assignable from the given
     * argument type.
     *
     * @param parameterTypes the parameter types of the constructor to locate.
     * @param strict        whether to use strict parameter type matching rules.
     * @return {@code true} if a matching constructor was found; otherwise, {@code false}.
     */
    private boolean hasConstructorInternal(final Class<?>[] parameterTypes, final boolean strict) {
        try {
            final Constructor<T> constructor = findConstructor(parameterTypes, strict);
            return constructor != null;
        } catch (final IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Constructs a new instance of the class represented by this construction helper.
     *
     * @param args   the arguments to pass to the constructor. If the constructor takes no arguments, then an empty
     *               array or {@code null} must be passed.
     * @param strict whether to use strict parameter type matching rules.
     * @return a new instance of the wrapped class.
     */
    private T newInstanceInternal(final Object[] args, final boolean strict) {
        final Class<?>[] parameterTypes = determineArgumentTypes(args);
        final Constructor<T> constructor;

        try {
            constructor = findConstructor(parameterTypes, strict);
        } catch (final IllegalArgumentException e) {
            throw new ClassConstructionException(e.getMessage(), e);
        }

        return instantiate(constructor, args);
    }

    /**
     * Locates a constructor for the class with the given parameter types. If {@code strict} matching is enabled, the
     * parameter types must match exactly. Otherwise, the parameter types must be assignable from the given parameter
     * instance.
     *
     * @param parameterTypes the parameter types of the constructor to locate.
     * @param strict         whether to use strict parameter type matching rules.
     * @return the constructor for the class with the given parameter types.
     */
    private Constructor<T> findConstructor(final Class<?>[] parameterTypes, final boolean strict) {
        for (final KeyValuePair<Constructor<T>, Class<?>[]> pair : constructors) {
            final Class<?>[] cpt = pair.value();
            if (isMatchingTypeArray(cpt, parameterTypes, strict)) {
                return pair.key();
            }
        }

        throw new IllegalArgumentException(String.format(
                "No public constructor found for %s matching the specification: public %s(%s)",
                type.getName(), type.getSimpleName(), formatTypeArray(parameterTypes)));
    }

    /**
     * Creates a new instance of the class represented by this construction helper using the given constructor.
     *
     * @param constructor the constructor to be invoked.
     * @param args        the arguments to pass to the constructor. If the constructor takes no arguments, then an empty
     *                    array or {@code null} must be passed.
     * @return a new instance of the class represented by this construction helper.
     */
    private T instantiate(final Constructor<T> constructor, final Object[] args) {
        try {
            return constructor.newInstance(args == null ? new Object[0] : args);
        } catch (final IllegalArgumentException e) {
            throw new ClassConstructionException(
                    String.format(
                            "Failed to instantiate %s with the arguments: %s",
                            type.getName(), Arrays.deepToString(args)),
                    e);
        } catch (final InstantiationException e) {
            throw new ClassConstructionException(
                    String.format(
                            "Cannot instantiate an instance of %s because it is an abstract class", type.getName()),
                    e);
        } catch (final IllegalAccessException e) {
            throw new ClassConstructionException(
                    String.format(
                            "Cannot instantiate an instance of %s because the class or the requested constructor is not accessible",
                            type.getName()),
                    e);
        } catch (final ExceptionInInitializerError | InvocationTargetException e) {
            throw new ClassConstructionException(
                    String.format(
                            "Failed to instantiate %s because the constructor threw an exception", type.getName()),
                    e);
        }
    }
}
