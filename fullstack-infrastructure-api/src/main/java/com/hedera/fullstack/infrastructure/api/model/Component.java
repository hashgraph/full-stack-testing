package com.hedera.fullstack.infrastructure.api.model;

import com.hedera.fullstack.model.Topology;

// only individual classes will implement PodAware and ServiceAware
public interface Component  {

    // lifecycle
    // this should be mostly done by helm
    default void init() {}
    default void configure(Topology deploymentTopology) {}
    default void destroy() {}
}

