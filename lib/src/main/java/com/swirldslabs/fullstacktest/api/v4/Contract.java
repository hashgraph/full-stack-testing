package com.swirldslabs.fullstacktest.api.v4;

public @interface Contract {
    Class<? extends Validator>[] value();
}
