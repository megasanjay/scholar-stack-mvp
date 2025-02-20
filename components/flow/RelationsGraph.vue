<script lang="ts" setup>
import { ref } from "vue";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { VueFlow, useVueFlow, type Node, type Edge } from "@vue-flow/core";

const { addEdges, onConnect } = useVueFlow();

const { layout, previousDirection } = useLayout();

const props = defineProps<{
  relations: CatalogRelations;
  resources: ResourceType[];
}>();

const remappedRelations = [];

for (const relation of props.relations.internal) {
  remappedRelations.push({
    id: relation.id,
    internal: true,
    label: relation.type,
    source: relation.sourceId,
    target: relation.targetId,
  });
}

for (const relation of props.relations.external) {
  remappedRelations.push({
    id: relation.id,
    internal: false,
    label: relation.type,
    source: relation.sourceId,
    target: `${relation.targetType}:${relation.target}`,
  });
}

const nodes = ref<Node[]>([]);

nodes.value = props.resources.map((resource) => {
  return {
    id: resource.id,
    data: {
      label: resource.title,
    },
    position: { x: 0, y: 0 },
    type: "custom",
  };
});

for (const relation of remappedRelations) {
  // check if relation.source is in nodes
  // const sourceNode = nodes.value.find(
  //   (node: any) => node.id === relation.source,
  // );

  // console.log(relation.source, sourceNode);

  // if (!sourceNode) {
  //   nodes.value.push({
  //     id: relation.source,
  //     data: {
  //       label: relation.internal
  //         ? props.resources.find(
  //             (resource: any) => resource.id === relation.source,
  //           )?.title
  //         : relation.source,
  //     },
  //     position: { x: 0, y: 0 },
  //     type: "custom",
  //   });
  // }

  // check if relation.target is in nodes
  const targetNode = nodes.value.find(
    (node: any) => node.id === relation.target,
  );

  if (!targetNode) {
    nodes.value.push({
      id: relation.target,
      data: {
        label: relation.internal
          ? props.resources.find(
              (resource: any) => resource.id === relation.target,
            )?.title
          : relation.target,
      },
      position: { x: 0, y: 0 },
      type: "custom",
    });
  }
}

const edges = ref<Edge[]>([]);

for (const relation of remappedRelations) {
  edges.value.push({
    id: relation.id,
    animated: true,
    label: relation.label,
    source: relation.source,
    target: relation.target,
  });
}

if (nodes.value.length > 0) {
  nodes.value = layout(nodes.value, edges.value, previousDirection.value);
}
// edges.value = shuffle(nodes.value);

// const nodes = ref<Node[]>([
//   // Ensure each node has a unique, descriptive label for screen readers
//   { id: "1", label: "Start Node", position: { x: 250, y: 5 }, type: "input" },
//   {
//     id: "2",
//     label: "Intermediate Node",
//     position: { x: 100, y: 100 },
//     type: "output",
//   },
//   { id: "3", label: "End Node", position: { x: 400, y: 100 }, type: "custom" },
// ]);

// const edges = ref<Edge[]>([
//   // Use descriptive labels for edges where possible
//   {
//     id: "e1-2",
//     label: "Start to Intermediate",
//     source: "1",
//     target: "2",
//     type: "custom",
//   },
//   {
//     id: "e1-3",
//     animated: true,
//     label: "Start to End",
//     source: "1",
//     target: "3",
//   },
// ]);

onConnect((params) => {
  addEdges([params]);
});
</script>

<template>
  <ClientOnly>
    <div>
      <div
        v-if="nodes.length > 0"
        style="height: 100vh"
        role="application"
        aria-label="Relations Graph"
      >
        <!-- <pre>{{ resources }}</pre> -->

        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          fit-view-on-init
          aria-roledescription="interactive node graph"
        >
          <Background pattern-color="#aaa" :gap="15" />

          <MiniMap />

          <Controls />

          <template #node-custom="nodeProps">
            <!-- Ensure custom nodes are accessible -->
            <FlowCustomNode
              v-bind="{
                ...nodeProps,
                label: nodeProps.data.label || '', // Provide a default empty string for label if undefined
              }"
            />
          </template>

          <template #edge-custom="edgeProps">
            <!-- Ensure custom edges are accessible -->
            <FlowCustomEdge v-bind="edgeProps" />
          </template>
        </VueFlow>
      </div>

      <div v-else>No relations found</div>
    </div>
  </ClientOnly>
</template>
