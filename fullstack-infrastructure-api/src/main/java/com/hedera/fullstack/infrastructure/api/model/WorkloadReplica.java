package com.hedera.fullstack.infrastructure.api.model;

import java.util.List;

public class WorkloadReplica<T extends Workload> {

       List<Component> components;
       // global index in the NetworkDeployment
       int index;

       public int index() {return index;};

       public WorkloadReplica(List<Component> components, int index) {
              this.components = components;
              this.index = index;
       }

       public void addComponent(Component component) {
              components.add(component);
       }

       public List<Component> getComponents() {
                return components;
       }

       @SuppressWarnings("unchecked") // safe since we filter out the componentType of type C
       public <C extends Component> C getComponentByType(Class<C> componentType) {
              return (C) components.stream().filter(componentType::isInstance).findFirst().get();
       }
}
