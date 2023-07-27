package com.hedera.fullstack.servicelocator.api.test.mock;

import java.io.InputStream;

public interface CtorService {
    String getStringValue();

    int getIntValue();

    InputStream getInputStreamValue();
}
