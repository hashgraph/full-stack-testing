package com.hedera.fullstack.examples.readiness;

import com.hedera.fullstack.readiness.api.ReadinessCheck;

public class NodeActiveReadinessCheck implements ReadinessCheck {

    @Override
    public boolean ready() {
        return true;
    }
}
