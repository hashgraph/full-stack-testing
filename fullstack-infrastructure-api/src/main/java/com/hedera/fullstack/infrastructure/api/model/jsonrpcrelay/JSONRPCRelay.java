package com.hedera.fullstack.infrastructure.api.model.jsonrpcrelay;

import com.hedera.fullstack.infrastructure.api.model.Component;

import java.util.Map;

public class JSONRPCRelay implements Component {
    @Override
    public Map<String, String> labels() {
        return Map.of();
    }
}
