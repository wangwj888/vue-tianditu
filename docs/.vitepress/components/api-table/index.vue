<template>
  <div v-if="entry" class="api-table">
    <template v-if="showProps && entry.props.length">
      <h4>属性</h4>
      <table>
        <thead>
          <tr>
            <th>属性</th>
            <th>类型</th>
            <th>默认值</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in entry.props" :key="item.name">
            <td>
              <code>{{ item.name }}</code>
            </td>
            <td>
              <code>{{ item.type }}</code>
            </td>
            <td>
              <code v-if="item.default !== '—' && item.default !== '必填'">{{ clean(item.default) }}</code>
              <span v-else>{{ item.default }}</span>
            </td>
            <td>{{ item.description || "—" }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-if="showEvents && entry.events.length">
      <h4>事件</h4>
      <table>
        <thead>
          <tr>
            <th>事件</th>
            <th>参数</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in entry.events" :key="item.name">
            <td>
              <code>{{ item.name }}</code>
            </td>
            <td>
              <code>{{ item.params }}</code>
            </td>
            <td>{{ item.description || "—" }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <p class="api-table__note">本表由组件源码中的 <code>PROPS</code> / <code>EVENTS</code> 自动生成。</p>
  </div>
  <p v-else class="api-table__error">未找到 {{ component }} 的 API 定义。</p>
</template>

<script setup lang="ts">
import { computed } from "vue";
import api from "../../generated/api.json";

interface ApiProperty {
  name: string;
  type: string;
  default: string;
  description: string;
}
interface ApiEvent {
  name: string;
  params: string;
  description: string;
}
interface ApiEntry {
  source: string;
  props: ApiProperty[];
  events: ApiEvent[];
}

const props = defineProps<{
  component: string;
  kind?: "props" | "events";
}>();

const entry = computed(() => (api as Record<string, ApiEntry | undefined>)[props.component]);
const showProps = computed(() => props.kind !== "events");
const showEvents = computed(() => props.kind !== "props");

function clean(value: string) {
  return value.replaceAll("`", "");
}
</script>

<script lang="ts">
export default { name: "ApiTable" };
</script>

<style scoped>
.api-table h4 {
  margin: 16px 0 8px;
  font-size: 15px;
}
.api-table table {
  display: table;
  width: 100%;
}
.api-table code {
  white-space: pre-wrap;
  word-break: break-word;
}
.api-table__note {
  margin: 6px 0 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
}
.api-table__error {
  color: var(--vp-c-danger-1, #c62828);
}
</style>
