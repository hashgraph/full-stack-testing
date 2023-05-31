package com.hedera.fullstack.helm.client.model;

import java.util.Objects;

/**
 * The response from the helm repo commands.
 *
 * @param name the name of the repository.
 * @param url  the url of the repository.
 */
public record Repository(
        String name,
        String url
) {

    /**
     * Constructs a new {@link Repository}.
     *
     * @param name the name of the repository.
     * @param url  the url of the repository.
     * @throws NullPointerException if any of the arguments are null.
     * @throws IllegalArgumentException if any of the arguments are blank.
     */
    public Repository {
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(url, "url must not be null");

        if (name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }

        if (url.isBlank()) {
            throw new IllegalArgumentException("url must not be blank");
        }
    }
}
