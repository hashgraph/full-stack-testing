package com.hedera.fullstack.infrastructure.api.providers;

import com.hedera.fullstack.helm.client.HelmClient;
import com.hedera.fullstack.helm.client.model.Chart;
import com.hedera.fullstack.helm.client.model.install.InstallChartOptions;
import com.hedera.fullstack.infrastructure.api.model.INSTALL_TYPE;
import com.hedera.fullstack.infrastructure.api.InfrastructureManager;
import com.hedera.fullstack.infrastructure.api.NetworkDeployment;
import com.hedera.fullstack.infrastructure.api.model.Topology;
import com.hedera.fullstack.resource.generator.api.ResourceUtils;

import java.util.List;

public class K8sInfrastructureManager implements InfrastructureManager {
    ResourceUtils resources;
    HelmClient helmClient;


    @Override
    public NetworkDeployment createNetworkDeployment(Topology hederaNetwork, INSTALL_TYPE installType) {
        //TODO: only test implementation
        Chart chart = null;
        String valuesFilePath = null;

        InstallChartOptions options = InstallChartOptions.builder()
                                      .values(valuesFilePath).build();
        helmClient.installChart("v1", chart, options);
        return null;
    }

    @Override
    public List<NetworkDeployment> getNetworkDeployments() {
        return null;
    }

    @Override
    public NetworkDeployment getNetworkDeployments(String id) {
        return null;
    }

    @Override
    public void deleteNetworkDeployments(String id) {

    }
}
