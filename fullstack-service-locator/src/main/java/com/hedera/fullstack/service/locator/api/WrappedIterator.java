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

package com.hedera.fullstack.service.locator.api;

import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.function.Function;

/**
 * A wrapper around an iterator that converts the values returned by the iterator to a new value using a function.
 *
 * @param <T> the type of the original iterator.
 * @param <R> the type of the values to be returned by this iterator.
 */
public class WrappedIterator<T, R> implements Iterator<R> {

    /**
     * The original iterator that is being wrapped.
     */
    private final Iterator<T> originalIterator;

    /**
     * A function used to convert the original iterator values to the new value.
     */
    private final Function<T, R> convertFn;

    /**
     * Creates a new instance of the {@link WrappedIterator} class by wrapping the given iterator and using the given
     * conversion function.
     *
     * @param originalIterator the original iterator to wrap.
     * @param convertFn the function used to convert the original iterator values to the new value.
     */
    public WrappedIterator(final Iterator<T> originalIterator, final Function<T, R> convertFn) {
        this.originalIterator = Objects.requireNonNull(originalIterator, "originalIterator must not be null");
        this.convertFn = Objects.requireNonNull(convertFn, "unwrapFn must not be null");
    }

    /**
     * Returns {@code true} if the iteration has more elements.
     * (In other words, returns {@code true} if {@link #next} would
     * return an element rather than throwing an exception.)
     *
     * @return {@code true} if the iteration has more elements
     */
    @Override
    public boolean hasNext() {
        return originalIterator.hasNext();
    }

    /**
     * Returns the next element in the iteration.
     *
     * @return the next element in the iteration
     * @throws NoSuchElementException if the iteration has no more elements
     */
    @Override
    public R next() {
        final T nextVal = originalIterator.next();
        return convertFn.apply(nextVal);
    }

    /**
     * Removes from the underlying collection the last element returned
     * by this iterator (optional operation).  This method can be called
     * only once per call to {@link #next}.
     * <p>
     * The behavior of an iterator is unspecified if the underlying collection
     * is modified while the iteration is in progress in any way other than by
     * calling this method, unless an overriding class has specified a
     * concurrent modification policy.
     * <p>
     * The behavior of an iterator is unspecified if this method is called
     * after a call to the {@link #forEachRemaining forEachRemaining} method.
     *
     * @throws UnsupportedOperationException if the {@code remove}
     *                                       operation is not supported by this iterator
     * @throws IllegalStateException         if the {@code next} method has not
     *                                       yet been called, or the {@code remove} method has already
     *                                       been called after the last call to the {@code next}
     *                                       method
     */
    @Override
    public void remove() {
        originalIterator.remove();
    }
}
