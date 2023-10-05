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

plugins {
    id("java")
    id("org.gradlex.java-ecosystem-capabilities")
    id("org.gradlex.extra-java-module-info")
    id("org.gradlex.java-module-dependencies")
}

javaModuleDependencies {
    moduleNameToGA.put("com.hedera.fullstack.junit.support", "com.hedera.fullstack:fullstack-junit-support")
    moduleNameToGA.put("com.hedera.fullstack.test.toolkit", "com.hedera.fullstack:fullstack-test-toolkit")
}

extraJavaModuleInfo {
    knownModule("org.slf4j:slf4j-api", "org.slf4j")
    knownModule("org.slf4j:slf4j-nop", "org.slf4j.nop")
    knownModule("org.slf4j:slf4j-simple", "org.slf4j.simple")

    knownModule("org.assertj:assertj-core", "org.assertj.core")

    knownModule("com.fasterxml.jackson.core:jackson-core", "com.fasterxml.jackson.core")
    knownModule("com.fasterxml.jackson.core:jackson-databind", "com.fasterxml.jackson.databind")

    knownModule("com.jcovalent.junit:jcovalent-junit-logging","com.jcovalent.junit.logging")

    knownModule("net.bytebuddy:byte-buddy", "net.bytebuddy")
    knownModule("net.bytebuddy:byte-buddy-agent", "net.bytebuddy.agent")
    knownModule("org.objenesis:objenesis", "org.objenesis")

    knownModule("org.junit.jupiter:junit-jupiter-api", "org.junit.jupiter.api")

    knownModule("org.mockito:mockito-core", "org.mockito")
    knownModule("org.mockito:mockito-junit-jupiter", "org.mockito.junit.jupiter")

    automaticModule("org.mockito:mockito-inline", "org.mockito.inline")

    // FUTURE: find a better way than listing all the dependencies here
    // These are transitive dependencies for kubernetes fabric8 client

    automaticModule("io.fabric8:kubernetes-model-common","io.fabric8.kubernetes.model.common")
    automaticModule("io.fabric8:kubernetes-model-core","io.fabric8.kubernetes.model.core")
    automaticModule("io.fabric8:kubernetes-model-common","io.fabric8.kubernetes.model.common")
    automaticModule("io.fabric8:kubernetes-model-core","io.fabric8.kubernetes.model.core")
    automaticModule("io.fabric8:kubernetes-model-rbac","io.fabric8.kubernetes.model.rbac")
    automaticModule("io.fabric8:kubernetes-model-admissionregistration","io.fabric8.kubernetes.model.admissionregistration")
    automaticModule("io.fabric8:kubernetes-model-apps","io.fabric8.kubernetes.model.apps")
    automaticModule("io.fabric8:kubernetes-model-autoscaling","io.fabric8.kubernetes.model.autoscaling")
    automaticModule("io.fabric8:kubernetes-model-apiextensions","io.fabric8.kubernetes.model.apiextensions")
    automaticModule("io.fabric8:kubernetes-model-batch","io.fabric8.kubernetes.model.batch")
    automaticModule("io.fabric8:kubernetes-model-certificates","io.fabric8.kubernetes.model.certificates")
    automaticModule("io.fabric8:kubernetes-model-coordination","io.fabric8.kubernetes.model.coordination")
    automaticModule("io.fabric8:kubernetes-model-discovery","io.fabric8.kubernetes.model.discovery")
    automaticModule("io.fabric8:kubernetes-model-events","io.fabric8.kubernetes.model.events")
    automaticModule("io.fabric8:kubernetes-model-extensions","io.fabric8.kubernetes.model.extensions")
    automaticModule("io.fabric8:kubernetes-model-networking","io.fabric8.kubernetes.model.networking")
    automaticModule("io.fabric8:kubernetes-model-metrics","io.fabric8.kubernetes.model.metrics")
    automaticModule("io.fabric8:kubernetes-model-policy","io.fabric8.kubernetes.model.policy")
    automaticModule("io.fabric8:kubernetes-model-scheduling","io.fabric8.kubernetes.model.scheduling")
    automaticModule("io.fabric8:kubernetes-model-storageclass","io.fabric8.kubernetes.model.storageclass")
    automaticModule("io.fabric8:openshift-model-config","io.fabric8.openshift.model.config")
    automaticModule("io.fabric8:openshift-model","io.fabric8.openshift.model")
    automaticModule("io.fabric8:kubernetes-model","io.fabric8.kubernetes.model")
    automaticModule("io.fabric8:kubernetes-model-jsonschema2pojo","io.fabric8.kubernetes.model.jsonschema2pojo")
    automaticModule("io.fabric8:kubernetes-model-gatewayapi","io.fabric8.kubernetes.model.gatewayapi")
    automaticModule("io.fabric8:kubernetes-model-flowcontrol","io.fabric8.kubernetes.model.flowcontrol")
    automaticModule("io.fabric8:kubernetes-model-node","io.fabric8.kubernetes.model.node")
    automaticModule("io.fabric8:kubernetes-model-resource","io.fabric8.kubernetes.model.resource")
    automaticModule("io.fabric8:kubernetes-model-kustomize","io.fabric8.kubernetes.model.kustomize")
    automaticModule("io.fabric8:openshift-model-clusterautoscaling","io.fabric8.openshift.model.clusterautoscaling")
    automaticModule("io.fabric8:openshift-model-hive","io.fabric8.openshift.model.hive")
    automaticModule("io.fabric8:openshift-model-installer","io.fabric8.openshift.model.installer")
    automaticModule("io.fabric8:openshift-model-operator","io.fabric8.openshift.model.operator")
    automaticModule("io.fabric8:openshift-model-operatorhub","io.fabric8.openshift.model.operatorhub")
    automaticModule("io.fabric8:openshift-model-machine","io.fabric8.openshift.model.machine")
    automaticModule("io.fabric8:openshift-model-monitoring","io.fabric8.openshift.model.monitoring")
    automaticModule("io.fabric8:openshift-model-console","io.fabric8.openshift.model.console")
    automaticModule("io.fabric8:openshift-model-machineconfig","io.fabric8.openshift.model.machineconfig")
    automaticModule("io.fabric8:openshift-model-tuned","io.fabric8.openshift.model.tuned")
    automaticModule("io.fabric8:openshift-model-whereabouts","io.fabric8.openshift.model.whereabouts")
    automaticModule("io.fabric8:openshift-model-storageversionmigrator","io.fabric8.openshift.model.storageversionmigrator")
    automaticModule("io.fabric8:openshift-model-miscellaneous","io.fabric8.openshift.model.miscellaneous")
    automaticModule("io.fabric8:kubernetes-client-api","io.fabric8.kubernetes.client.api")
    automaticModule("io.fabric8:kubernetes-httpclient-okhttp","io.fabric8.kubernetes.httpclient.okhttp")
    automaticModule("io.fabric8:kubernetes-client","io.fabric8.kubernetes.client")
    automaticModule("io.fabric8:kubernetes-junit-jupiter","io.fabric8.kubernetes.junit.jupiter")
    automaticModule("io.fabric8:servicecatalog-model","io.fabric8.servicecatalog.model")
    automaticModule("io.fabric8:servicecatalog-client","io.fabric8.servicecatalog.client")
    automaticModule("io.fabric8:kubernetes-server-mock","io.fabric8.kubernetes.server.mock")
    automaticModule("io.fabric8:openshift-client-api","io.fabric8.openshift.client.api")
    automaticModule("io.fabric8:openshift-client","io.fabric8.openshift.client")
    automaticModule("io.fabric8:knative-model","io.fabric8.knative.model")
    automaticModule("io.fabric8:knative-client","io.fabric8.knative.client")
    automaticModule("io.fabric8:knative-examples","io.fabric8.knative.examples")
    automaticModule("io.fabric8:knative-tests","io.fabric8.knative.tests")
    automaticModule("io.fabric8:tekton-model-v1alpha1","io.fabric8.tekton.model.v1alpha1")
    automaticModule("io.fabric8:tekton-model-v1beta1","io.fabric8.tekton.model.v1beta1")
    automaticModule("io.fabric8:tekton-model-triggers-v1alpha1","io.fabric8.tekton.model.triggers.v1alpha1")
    automaticModule("io.fabric8:tekton-model-triggers-v1beta1","io.fabric8.tekton.model.triggers.v1beta1")
    automaticModule("io.fabric8:tekton-client","io.fabric8.tekton.client")
    automaticModule("io.fabric8:tekton-examples","io.fabric8.tekton.examples")
    automaticModule("io.fabric8:tekton-tests","io.fabric8.tekton.tests")
    automaticModule("io.fabric8:service-catalog-examples","io.fabric8.service.catalog.examples")
    automaticModule("io.fabric8:servicecatalog-tests","io.fabric8.servicecatalog.tests")
    automaticModule("io.fabric8:volumesnapshot-model","io.fabric8.volumesnapshot.model")
    automaticModule("io.fabric8:volumesnapshot-client","io.fabric8.volumesnapshot.client")
    automaticModule("io.fabric8:volumesnapshot-examples","io.fabric8.volumesnapshot.examples")
    automaticModule("io.fabric8:volumesnapshot-tests","io.fabric8.volumesnapshot.tests")
    automaticModule("io.fabric8:chaosmesh-model","io.fabric8.chaosmesh.model")
    automaticModule("io.fabric8:chaosmesh-client","io.fabric8.chaosmesh.client")
    automaticModule("io.fabric8:chaosmesh-examples","io.fabric8.chaosmesh.examples")
    automaticModule("io.fabric8:chaosmesh-tests","io.fabric8.chaosmesh.tests")
    automaticModule("io.fabric8:camel-k-model-v1","io.fabric8.camel.k.model.v1")
    automaticModule("io.fabric8:camel-k-model-v1alpha1","io.fabric8.camel.k.model.v1alpha1")
    automaticModule("io.fabric8:camel-k-client","io.fabric8.camel.k.client")
    automaticModule("io.fabric8:camel-k-tests","io.fabric8.camel.k.tests")
    automaticModule("io.fabric8:certmanager-model-v1alpha2","io.fabric8.certmanager.model.v1alpha2")
    automaticModule("io.fabric8:certmanager-model-v1alpha3","io.fabric8.certmanager.model.v1alpha3")
    automaticModule("io.fabric8:certmanager-model-v1beta1","io.fabric8.certmanager.model.v1beta1")
    automaticModule("io.fabric8:certmanager-model-v1","io.fabric8.certmanager.model.v1")
    automaticModule("io.fabric8:certmanager-client","io.fabric8.certmanager.client")
    automaticModule("io.fabric8:certmanager-examples","io.fabric8.certmanager.examples")
    automaticModule("io.fabric8:certmanager-tests","io.fabric8.certmanager.tests")
    automaticModule("io.fabric8:verticalpodautoscaler-model-v1","io.fabric8.verticalpodautoscaler.model.v1")
    automaticModule("io.fabric8:verticalpodautoscaler-client","io.fabric8.verticalpodautoscaler.client")
    automaticModule("io.fabric8:verticalpodautoscaler-examples","io.fabric8.verticalpodautoscaler.examples")
    automaticModule("io.fabric8:verticalpodautoscaler-tests","io.fabric8.verticalpodautoscaler.tests")
    automaticModule("io.fabric8:volcano-model-v1beta1","io.fabric8.volcano.model.v1beta1")
    automaticModule("io.fabric8:volcano-client","io.fabric8.volcano.client")
    automaticModule("io.fabric8:volcano-examples","io.fabric8.volcano.examples")
    automaticModule("io.fabric8:volcano-tests","io.fabric8.volcano.tests")
    automaticModule("io.fabric8:istio-model-v1alpha3","io.fabric8.istio.model.v1alpha3")
    automaticModule("io.fabric8:istio-model-v1beta1","io.fabric8.istio.model.v1beta1")
    automaticModule("io.fabric8:istio-client","io.fabric8.istio.client")
    automaticModule("io.fabric8:istio-examples","io.fabric8.istio.examples")
    automaticModule("io.fabric8:istio-tests","io.fabric8.istio.tests")
    automaticModule("io.fabric8:open-cluster-management-apps-model","io.fabric8.open.cluster.management.apps.model")
    automaticModule("io.fabric8:open-cluster-management-agent-model","io.fabric8.open.cluster.management.agent.model")
    automaticModule("io.fabric8:open-cluster-management-cluster-model","io.fabric8.open.cluster.management.cluster.model")
    automaticModule("io.fabric8:open-cluster-management-discovery-model","io.fabric8.open.cluster.management.discovery.model")
    automaticModule("io.fabric8:open-cluster-management-observability-model","io.fabric8.open.cluster.management.observability.model")
    automaticModule("io.fabric8:open-cluster-management-operator-model","io.fabric8.open.cluster.management.operator.model")
    automaticModule("io.fabric8:open-cluster-management-placementruleapps-model","io.fabric8.open.cluster.management.placementruleapps.model")
    automaticModule("io.fabric8:open-cluster-management-policy-model","io.fabric8.open.cluster.management.policy.model")
    automaticModule("io.fabric8:open-cluster-management-search-model","io.fabric8.open.cluster.management.search.model")
    automaticModule("io.fabric8:open-cluster-management-client","io.fabric8.open.cluster.management.client")
    automaticModule("io.fabric8:open-cluster-management-tests","io.fabric8.open.cluster.management.tests")
    automaticModule("io.fabric8:openclustermanagement-examples","io.fabric8.openclustermanagement.examples")
    automaticModule("io.fabric8:openshift-server-mock","io.fabric8.openshift.server.mock")
    automaticModule("io.fabric8:kubernetes-examples","io.fabric8.kubernetes.examples")
    automaticModule("io.fabric8.kubernetes:kubernetes-karaf","io.fabric8.kubernetes.kubernetes.karaf")
    automaticModule("io.fabric8.kubernetes:kubernetes-karaf-itests","io.fabric8.kubernetes.kubernetes.karaf.itests")
    automaticModule("io.fabric8:generator-annotations","io.fabric8.generator.annotations")
    automaticModule("io.fabric8:crd-generator-api","io.fabric8.crd.generator.api")
    automaticModule("io.fabric8:crd-generator-apt","io.fabric8.crd.generator.apt")
    automaticModule("io.fabric8:kubernetes-test","io.fabric8.kubernetes.test")
    automaticModule("io.fabric8:kubernetes-openshift-uberjar","io.fabric8.kubernetes.openshift.uberjar")
    automaticModule("io.fabric8:crd-generator-test","io.fabric8.crd.generator.test")
    automaticModule("io.fabric8:java-generator-core","io.fabric8.java.generator.core")
    automaticModule("io.fabric8:java-generator-cli","io.fabric8.java.generator.cli")
    automaticModule("io.fabric8:java-generator-maven-plugin","io.fabric8.java.generator.maven.plugin")
    automaticModule("io.fabric8:java-generator-integration-tests","io.fabric8.java.generator.integration.tests")
    automaticModule("io.fabric8:java-generator-benchmark","io.fabric8.java.generator.benchmark")
    automaticModule("io.fabric8:kubernetes-httpclient-vertx","io.fabric8.kubernetes.httpclient.vertx")
}
