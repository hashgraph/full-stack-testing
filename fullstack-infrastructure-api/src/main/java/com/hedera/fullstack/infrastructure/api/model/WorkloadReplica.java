package com.hedera.fullstack.infrastructure.api.model;

import java.util.List;

// -- extends Indexable Trait
public class WorkloadReplica<T extends Workload, C extends Component> {

       public int index() {return 0;};
       public List<C> getComponents() {return null;}
       public C getComponentByType(Class<C> componentByTypeC) {return null;}

}
