package com.hedera.fullstack.infrastructure.api.model.traits;

import com.hedera.fullstack.infrastructure.api.model.Endpoint;

import java.util.List;

public interface ServiceAware {
    List<Endpoint> getEndpoints();
}
