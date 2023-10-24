/*
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.hedera.fullstack.service.locator.test.mock;

import java.io.InputStream;

public class MockCtorService implements CtorService {

    private final String s;
    private final int i;
    private final InputStream is;

    public MockCtorService() {
        this(null, 0, null);
    }

    public MockCtorService(final String s) {
        this(s, 0, null);
    }

    public MockCtorService(final int i) {
        this(null, i, null);
    }

    public MockCtorService(String s, int i) {
        this(s, i, null);
    }

    public MockCtorService(InputStream is) {
        this(null, 0, is);
    }

    public MockCtorService(String s, InputStream is) {
        this(s, 0, is);
    }

    public MockCtorService(int i, InputStream is) {
        this(null, i, is);
    }

    public MockCtorService(String s, int i, InputStream is) {
        this.s = s;
        this.i = i;
        this.is = is;
    }

    @Override
    public String getStringValue() {
        return s;
    }

    @Override
    public int getIntValue() {
        return i;
    }

    @Override
    public InputStream getInputStreamValue() {
        return is;
    }
}
