package com.hedera.fullstack.infrastructure.api.model.mirrornode.components;

import com.hedera.fullstack.infrastructure.api.model.Component;

import java.util.Map;

public class Grpc implements Component {
    @Override
    public Map<String, String> labels() {
        return Map.of();
    }
}
