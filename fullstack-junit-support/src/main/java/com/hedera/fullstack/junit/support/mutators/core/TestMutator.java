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

package com.hedera.fullstack.junit.support.mutators.core;

import com.hedera.fullstack.monitoring.api.Monitor;
import com.hedera.fullstack.readiness.api.ReadinessCheck;
import com.hedera.fullstack.test.toolkit.api.model.infrastructure.NodeSoftwarePodNode;
import com.hedera.fullstack.validator.api.Validator;

public interface TestMutator {

    CheckMutator<Validator, TestMutator> validators();

    CheckMutator<Validator, TestMutator> validators(NodeSoftwarePodNode node);

    CheckMutator<Monitor, TestMutator> monitors();

    CheckMutator<Monitor, TestMutator> monitors(NodeSoftwarePodNode node);

    CheckMutator<ReadinessCheck, TestMutator> readinessChecks();

    CheckMutator<ReadinessCheck, TestMutator> readinessChecks(NodeSoftwarePodNode node);
}
