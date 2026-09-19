import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * NetworkGraph
 * Drop-in force-directed graph for the Network tab.
 *
 * Usage:
 *   import NetworkGraph from "./NetworkGraph";
 *   import networkData from "./sampleNetworkData.json";
 *   <NetworkGraph data={networkData} height={520} />
 *
 * Expected data shape:
 * {
 *   nodes: [{ id, cell, betweenness, degree, isCoordinator }],
 *   links: [{ source, target }]
 * }
 */

const CELL_COLORS = {
  Alpha: "#378ADD",
  Bravo: "#1D9E75",
  Charlie: "#BA7517",
  Delta: "#D4537E",
};
const COORDINATOR_COLOR = "#E24B4A";

export default function NetworkGraph({ data, height = 480 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes?.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height);

    svg.selectAll("*").remove();

    const nodes = data.nodes.map((d) => ({ ...d }));
    const links = data.links.map((d) => ({ ...d }));

    const radiusScale = d3
      .scaleSqrt()
      .domain(d3.extent(nodes, (d) => d.betweenness || 0.01))
      .range([7, 22]);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(90)
          .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => radiusScale(d.betweenness || 0.01) + 6));

    const link = svg
      .append("g")
      .attr("stroke", "#3a3f4b")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.2);

    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab")
      .call(drag(simulation));

    node
      .append("circle")
      .attr("r", (d) => radiusScale(d.betweenness || 0.01))
      .attr("fill", (d) => (d.isCoordinator ? COORDINATOR_COLOR : CELL_COLORS[d.cell] || "#8a8f9c"))
      .attr("stroke", "#0d0f14")
      .attr("stroke-width", 1.5);

    node
      .append("text")
      .text((d) => d.id)
      .attr("x", 0)
      .attr("y", (d) => radiusScale(d.betweenness || 0.01) + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#c7cbd4")
      .attr("font-size", "10px")
      .attr("font-family", "sans-serif");

    node.append("title").text(
      (d) =>
        `${d.id}\nCell: ${d.cell}\nBetweenness: ${d.betweenness}\nDegree: ${d.degree}${
          d.isCoordinator ? "\n⚠ Flagged: Hidden Coordinator" : ""
        }`
    );

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    function drag(sim) {
      function dragstarted(event, d) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event, d) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    return () => simulation.stop();
  }, [data, height]);

  return (
    <div ref={containerRef} style={{ width: "100%", background: "#0d0f14", borderRadius: 10 }}>
      <svg ref={svgRef} />
    </div>
  );
}
