package com.hedera.fullstack.infrastructure.api.model.mirrornodeexplorer.component;

import com.hedera.fullstack.infrastructure.api.model.Component;

import java.util.Map;

public class Explorer implements Component {
    @Override
    public Map<String, String> labels() {
        return Map.of();
    }
}
