<script lang="ts" setup>
import { ref } from "vue";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { VueFlow, useVueFlow, type Node, type Edge } from "@vue-flow/core";

const { addEdges, onConnect } = useVueFlow();

const nodes = ref<Node[]>([
  { id: "1", label: "Node 1", position: { x: 250, y: 5 }, type: "input" },
  { id: "2", label: "Node 2", position: { x: 100, y: 100 }, type: "output" },
  { id: "3", label: "Node 3", position: { x: 400, y: 100 }, type: "custom" },
]);

const edges = ref<Edge[]>([
  { id: "e1-2", source: "1", target: "2", type: "custom" },
  { id: "e1-3", animated: true, source: "1", target: "3" },
]);

onConnect((params) => {
  addEdges([params]);
});
</script>

<template>
  <div style="height: 50vh">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      fit-view-on-init
      class="vue-flow-basic-example"
      :default-zoom="1.5"
      :min-zoom="0.2"
      :max-zoom="4"
    >
      <Background pattern-color="#aaa" :gap="8" />

      <MiniMap />

      <Controls />

      <template #node-custom="nodeProps">
        <FlowCustomNode v-bind="nodeProps" />
      </template>

      <template #edge-custom="edgeProps">
        <FlowCustomEdge v-bind="edgeProps" />
      </template>
    </VueFlow>
  </div>
</template>
