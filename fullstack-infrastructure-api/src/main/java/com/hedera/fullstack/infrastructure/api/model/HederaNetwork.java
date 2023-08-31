package com.hedera.fullstack.infrastructure.api.model;


/**
 Represents a hedera network consisting of pod
**/
public interface HederaNetwork {

     String getId();
     String getName();
     Topology getTopology();

}

