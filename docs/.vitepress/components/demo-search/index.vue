<template>
  <div>
    <div class="settings">
      <label>关键字 <input v-model="keyword" /></label>
      <label
        >每页
        <select v-model.number="capacity">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select></label
      >
      <span>当前第 {{ page }} 页</span>
    </div>
    <div class="mapDiv">
      <tdt-map :center="[113.280637, 23.125178]" :zoom="11">
        <tdt-control>
          <tdt-search
            v-model:keyword="keyword"
            v-model:page="page"
            :page-capacity="capacity"
            :admin-code="156440100"
            :route-btn="{ driving: true, transit: true, walking: false }"
            @search-error="onError"
          >
            <template #result-item="{ poi, index }"
              ><strong>{{ index + 1 }}. {{ poi.name }}</strong>
              <p>{{ poi.address }}</p></template
            >
            <template #loading="{ keyword: value }">正在查询“{{ value }}”…</template>
            <template #empty="{ keyword: value }">没有找到“{{ value }}”，请换个词。</template>
          </tdt-search>
        </tdt-control>
      </tdt-map>
    </div>
    <p v-if="message" role="alert">{{ message }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
const keyword = ref("公园");
const page = ref(1);
const capacity = ref(10);
const message = ref("");
function onError(error: Error) {
  message.value = error.message;
}
</script>
<script lang="ts">
export default { name: "DemoSearch" };
</script>
<style scoped>
.mapDiv {
  width: 100%;
  height: 600px;
}
.settings {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.settings input {
  border: 1px solid #bbb;
  padding: 4px;
}
</style>
