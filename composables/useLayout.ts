import dagre from "@dagrejs/dagre";
import { Position, useVueFlow } from "@vue-flow/core";
import { ref } from "vue";

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `dagre` library to calculate the layout of the nodes and edges.
 */
export function useLayout() {
  const { findNode } = useVueFlow();

  const graph = ref(new dagre.graphlib.Graph());

  const previousDirection = ref("TB");

  // sourcery skip: avoid-function-declarations-in-blocks
  function layout(nodes: any, edges: any, direction: any) {
    // we create a new graph instance, in case some nodes/edges were removed, otherwise dagre would act as if they were still there
    const dagreGraph = new dagre.graphlib.Graph();

    graph.value = dagreGraph;

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === "LR";

    dagreGraph.setGraph({
      compound: true,
      edgesep: 50,
      nodesep: 100,
      rankdir: direction,
      ranksep: 150,
    });

    previousDirection.value = direction;

    for (const node of nodes) {
      // if you need width+height of nodes for your layout, you can use the dimensions property of the internal node (`GraphNode` type)
      const graphNode = findNode(node.id);

      dagreGraph.setNode(node.id, {
        height: graphNode?.dimensions.height || 50,
        width: graphNode?.dimensions.width || 150,
      });
    }

    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target);
    }

    dagre.layout(dagreGraph);

    // dagreGraph.nodes().forEach(function (v) {
    //   console.log("Node " + v + ": " + JSON.stringify(dagreGraph.node(v)));
    // });

    // set nodes with updated positions
    return nodes.map((node: any) => {
      const nodeWithPosition = dagreGraph.node(node.id);

      return {
        ...node,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
      };
    });
  }

  return { graph, layout, previousDirection };
}
