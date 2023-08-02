package com.hedera.fullstack.base.api.collections;

/**
 * A simple pair of related or unrelated values. The values may be of the same type or different types. Both values may
 * be {@code null}.
 *
 * @param <L>   type of the left value.
 * @param <R>   type of the right value.
 * @param left  the left value.
 * @param right the right value.
 */
public record Pair<L, R>(L left, R right) {

    /**
     * Creates a new {@code Pair} with the given left and right values.
     *
     * @param <L>   type of the left value.
     * @param <R>   type of the right value.
     * @param left  the left value.
     * @param right the right value.
     * @return a new {@code Pair} with the given left and right values.
     */
    public static <L, R> Pair<L, R> of(final L left, final R right) {
        return new Pair<>(left, right);
    }
}
