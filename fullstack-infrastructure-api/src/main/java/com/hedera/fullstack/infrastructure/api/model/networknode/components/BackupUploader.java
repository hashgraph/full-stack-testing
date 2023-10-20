package com.hedera.fullstack.infrastructure.api.model.networknode.components;

import com.hedera.fullstack.infrastructure.api.model.Component;
import com.hedera.fullstack.infrastructure.api.model.traits.PodAware;

import java.util.Map;

public class BackupUploader implements Component {
    @Override
    public Map<String, String> labels() {
        return null;
    }
}
