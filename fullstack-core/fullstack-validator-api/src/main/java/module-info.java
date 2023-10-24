import com.hedera.fullstack.validator.api.Validator;

module com.hedera.fullstack.validator.api {
    exports com.hedera.fullstack.validator.api;
    exports com.hedera.fullstack.validator.api.annotations;

    requires com.hedera.fullstack.test.toolkit;

    uses Validator;
}
