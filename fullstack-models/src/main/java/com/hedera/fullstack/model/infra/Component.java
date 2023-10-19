package com.hedera.fullstack.model.infra;

public interface Component {
}
/*
Service -> Replica -> Component

What are we trying to do ?
We are trying to model the infrastructure of a Hedera network.
e.g.
MirrorNode
    - Importer
    - RestAPI
    - Database
    - Redis
    - Explorer
*/