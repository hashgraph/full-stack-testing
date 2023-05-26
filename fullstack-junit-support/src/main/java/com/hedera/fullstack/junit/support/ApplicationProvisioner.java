package com.hedera.fullstack.junit.support;

public interface ApplicationProvisioner {

    void beforeApplicationConfigured(int index, Object node, Object config);

}
