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

package com.hedera.fullstack.configuration.infrastructure;

/**
 * Defines the type of installation of a node
 */
public enum InstallType {
    /**
     * The node is installed using Node Management Tool (NMT) and uses a released artifact
     */
    NMT,
    /**
     * The node is installed by directly copying the build artifact to the node without the use of NMT.
     * Though the build artifact can be a both a released artifact or a built locally on a development machine,
     * this is typically used by developers for adhoc build testing.
     */
    DIRECT_INSTALL
}
