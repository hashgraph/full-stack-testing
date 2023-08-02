package com.hedera.fullstack.examples.monitors;

import com.hedera.fullstack.monitoring.api.CheckOutcome;
import com.hedera.fullstack.monitoring.api.Monitor;

public class InvalidStateSignatureMonitor implements Monitor {
    @Override
    public CheckOutcome check() {
        return CheckOutcome.SUCCESS;
    }
}
