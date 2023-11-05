export class FullstackTestingError extends Error {
    /**
     * Create a custom error object
     *
     * error metadata will include the `cause`
     *
     * @param message error message
     * @param cause source error (if any)
     * @param meta additional metadata (if any)
     */
    constructor(message, cause = {}, meta = {}) {
        super(message);
        this.name = this.constructor.name

        this.meta = meta
        if (cause) {
            this.cause = cause
        }

        Error.captureStackTrace(this, this.constructor)
    }
}

export class ResourceNotFoundError extends FullstackTestingError {
    /**
     * Create a custom error for resource not found scenario
     *
     * error metadata will include `resource`
     *
     * @param message error message
     * @param resource name of the resource
     * @param cause source error (if any)
     */
    constructor(message, resource, cause = {}) {
        super(message, cause, {resource: resource});
    }
}

export class IllegalArgumentError extends FullstackTestingError {
    /**
     * Create a custom error for illegal argument scenario
     *
     * error metadata will include `value`
     *
     * @param message error message
     * @param value value of the invalid argument
     * @param cause source error (if any)
     */
    constructor(message, value, cause = {}) {
        super(message, cause, {value: value});
    }
}

export class DataValidationError extends FullstackTestingError {
    /**
     * Create a custom error for data validation error scenario
     *
     * error metadata will include `expected` and `found` values.
     *
     * @param message error message
     * @param expected expected value
     * @param found value found
     * @param cause source error (if any)
     */
    constructor(message, expected, found, cause = {}) {
        super(message, cause, {expected: expected, found: found});
    }
}
