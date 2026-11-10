<template>
  <div class="demo-toolbar">
    <button type="button" @click="updateData">更新数据</button>
    <button type="button" @click="toggleVisible">显示/隐藏</button>
    <label>层级 <input v-model.number="zIndex" type="number" /></label>
    <span>{{ points.length }} 个图形</span>
  </div>
  <div class="svg-overlay-demo-map">
    <tdt-map :center="center" :zoom="11">
      <tdt-svg-overlay ref="svgRef" :visible="visible" :z-index="zIndex" @init="draw" @redraw="draw" />
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { SvgOverlayContext, SvgOverlayExposed } from "../../../../packages";

const SVG_NS = "http://www.w3.org/2000/svg";
const center = [113.280637, 23.125178] as [number, number];
const svgRef = ref<SvgOverlayExposed>();
const visible = ref(true);
const zIndex = ref(5);
let generation = 0;

function createPoints() {
  return Array.from({ length: 240 }, (_, index) => {
    const angle = index * 0.35 + generation * 0.4;
    const radius = 0.02 + ((index * 37) % 100) / 3200;
    return {
      lnglat: [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius * 0.7] as [number, number],
      value: ((index * 17 + generation * 29) % 100) + 1
    };
  });
}
const points = ref(createPoints());

function draw(context: SvgOverlayContext) {
  const layer = document.createElementNS(SVG_NS, "g");
  points.value.forEach(item => {
    const point = context.lngLatToPoint(item.lnglat);
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(point.x));
    circle.setAttribute("cy", String(point.y));
    circle.setAttribute("r", String(3 + item.value / 40));
    circle.setAttribute("fill", item.value > 70 ? "#ef4444" : item.value > 40 ? "#f59e0b" : "rgba(22, 119, 255, .65)");
    circle.setAttribute("stroke", "white");
    circle.setAttribute("stroke-width", "1");
    layer.appendChild(circle);
  });
  context.root.replaceChildren(layer);
}

function updateData() {
  generation++;
  points.value = createPoints();
  svgRef.value?.redraw();
}
function toggleVisible() {
  visible.value = !visible.value;
}
</script>

<script lang="ts">
export default { name: "DemoSvgOverlay" };
</script>

<style scoped>
.svg-overlay-demo-map {
  width: 100%;
  height: 380px;
}
</style>
