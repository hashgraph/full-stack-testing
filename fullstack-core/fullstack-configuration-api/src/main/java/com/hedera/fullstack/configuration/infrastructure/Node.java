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
 * Describes configuration of a Node component inside the NetworkNode Workload
 * @param ram - The amount of ram in GB needed for the node
 * @param cpu - The amount of cpu in cores needed for the node
 * @param nodeID - The nodeID of the node
 * @param nodeAccountID - The nodeAccountID of the node
 */
public record Node(int ram, int cpu, int nodeID, int nodeAccountID) {}
