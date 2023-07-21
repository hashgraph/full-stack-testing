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

package com.hedera.fullstack.servicelocator.api;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.Objects;

/**
 * Base class for implementations of the service supplier pattern. The service supplier pattern is designed to decouple
 * the service detection logic from the instantiation of the actual service. This allows for the service detection logic
 * to be implemented with a zero argument constructor in compliance with the Java ServiceLoader specification while
 * allowing actual service instances to be instantiated with a constructor that takes zero or more arguments.
 *
 * @param <T> the type of the service supplied by this ServiceSupplier.
 */
public abstract class ServiceSupplier<T> {

    /**
     * The type of the service.
     */
    private final Class<T> serviceClass;

    /**
     * Constructs a new ServiceSupplier for the given service implementation.
     *
     * @param serviceClass the type of the service supplied by this ServiceSupplier.
     * @throws NullPointerException if serviceClass is null.
     */
    protected ServiceSupplier(final Class<T> serviceClass) {
        this.serviceClass = Objects.requireNonNull(serviceClass, "serviceClass must not be null");
    }

    /**
     * @return the type of the service supplied by this ServiceSupplier.
     */
    public Class<T> getServiceClass() {
        return serviceClass;
    }

    /**
     * Constructs a new instance of the service declared by this ServiceSupplier.
     *
     * @param args the arguments to pass to the service constructor.
     * @return a new instance of the service declared by this ServiceSupplier.
     * @throws ServiceConstructionException if the service cannot be constructed or instantiated.
     */
    public T newServiceInstance(final Object... args) {
        final Constructor<T> constructor;
        try {
            constructor = findConstructor(args);
        } catch (final IllegalArgumentException e) {
            throw new ServiceConstructionException(e.getMessage(), e);
        }

        try {
            return constructor.newInstance(args);
        } catch (final IllegalArgumentException e) {
            throw new ServiceConstructionException(
                    String.format(
                            "Failed to instantiate %s with the arguments: %s",
                            serviceClass.getName(), Arrays.deepToString(args)),
                    e);
        } catch (final InstantiationException e) {
            throw new ServiceConstructionException(
                    String.format(
                            "Cannot instantiate an instance of %s because it is an abstract class",
                            serviceClass.getName()),
                    e);
        } catch (final IllegalAccessException e) {
            throw new ServiceConstructionException(
                    String.format(
                            "Cannot instantiate an instance of %s because the class or the requested constructor is not accessible",
                            serviceClass.getName()),
                    e);
        } catch (final ExceptionInInitializerError | InvocationTargetException e) {
            throw new ServiceConstructionException(
                    String.format(
                            "Failed to instantiate %s because the constructor threw an exception",
                            serviceClass.getName()),
                    e);
        }
    }

    /**
     * Determines the primitive type for the given parameter type.
     *
     * @param parameterType the parameter type to be mapped to a primitive type.
     * @return the primitive type for the given parameter type.
     */
    private Class<?> castWrapperToPrimitive(final Class<?> parameterType) {
        if (parameterType == Void.class) {
            return Void.TYPE;
        } else if (parameterType == Boolean.class) {
            return Boolean.TYPE;
        } else if (parameterType == Byte.class) {
            return Byte.TYPE;
        } else if (parameterType == Character.class) {
            return Character.TYPE;
        } else if (parameterType == Short.class) {
            return Short.TYPE;
        } else if (parameterType == Integer.class) {
            return Integer.TYPE;
        } else if (parameterType == Long.class) {
            return Long.TYPE;
        } else if (parameterType == Float.class) {
            return Float.TYPE;
        } else if (parameterType == Double.class) {
            return Double.TYPE;
        } else {
            return parameterType;
        }
    }

    /**
     * Determines the parameter types for the given arguments.
     *
     * @param args the arguments to pass to the service constructor.
     * @return the parameter types for the given arguments.
     */
    private Class<?>[] determineParameterTypes(final Object... args) {
        if (args == null || args.length == 0) {
            return new Class<?>[0];
        }

        final Class<?>[] parameterTypes = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) {
            parameterTypes[i] = castWrapperToPrimitive(args[i].getClass());
        }

        return parameterTypes;
    }

    /**
     * Finds the constructor matching the given arguments.
     *
     * @param args the arguments to pass to the service constructor.
     * @return the constructor matching the given arguments.
     * @throws IllegalArgumentException if no constructor matching the given arguments is found.
     */
    private Constructor<T> findConstructor(final Object... args) {
        final Class<?>[] parameterTypes = determineParameterTypes(args);

        try {
            return serviceClass.getConstructor(parameterTypes);
        } catch (final NoSuchMethodException e) {
            throw new IllegalArgumentException(
                    String.format(
                            "No public constructor found for %s matching the specification: public %s(%s) ",
                            serviceClass.getName(), serviceClass.getSimpleName(), formatParameterTypes(parameterTypes)),
                    e);
        }
    }

    /**
     * Formats the parameter types as a human-readable string. This method normalizes the parameter types to their
     * simple name and comma separates them as they would appear in a method signature.
     *
     * @param parameterTypes the parameter types to format.
     * @return the parameter types as a human-readable string.
     */
    private String formatParameterTypes(final Class<?>[] parameterTypes) {
        final StringBuilder builder = new StringBuilder();

        for (int i = 0; i < parameterTypes.length; i++) {
            builder.append(parameterTypes[i].getSimpleName());
            if (i < parameterTypes.length - 1) {
                builder.append(", ");
            }
        }

        return builder.toString();
    }
}
