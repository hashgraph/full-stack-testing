package com.hedera.fullstack.infrastructure.api.model.traits;

import java.util.Map;

public interface Labeled {
    Map<String,String> labels();
}
