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

package com.hedera.fullstack.helm.client.test.proxy.request.chart;

import static org.junit.jupiter.api.Assertions.*;

import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.proxy.request.chart.ChartInstallRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ChartInstallRequestTest {
    @Test
    @DisplayName("Test ChartInstallRequest Chart constructor")
    void testChartInstallRequestChartConstructor() {
        Chart chart = new Chart("apache", "bitnami/apache");
        ChartInstallRequest chartInstallRequest = new ChartInstallRequest("apache", chart);
        assertEquals(chart, chartInstallRequest.chart());
        assertNull(chartInstallRequest.options());
    }
}
