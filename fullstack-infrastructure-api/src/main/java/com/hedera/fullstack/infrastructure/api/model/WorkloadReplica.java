package com.hedera.fullstack.infrastructure.api.model;

import java.util.List;

// -- extends Indexable Trait
public class WorkloadReplica<T extends Workload> {
       public int index() {return 0;};
       public List<Component> getComponents() {return null;}
       public <C extends Component> Component getComponentByType(Class<C> componentType) {return null;}

}
