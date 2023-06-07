package com.hedera.fullstack.helm.client.test.proxy.request.chart;

import static org.junit.jupiter.api.Assertions.*;

import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.proxy.request.chart.ChartInstallRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ChartInstallRequestTest {
    @Test
    @DisplayName("Test ChartInstallRequest Chart constructor")
    public void testChartInstallRequestChartConstructor() {
        Chart chart = new Chart("apache", "bitnami/apache");
        ChartInstallRequest chartInstallRequest = new ChartInstallRequest(chart);
        assertEquals(chart, chartInstallRequest.chart());
        assertNull(chartInstallRequest.options());
    }
}