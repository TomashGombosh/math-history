<template>
  <div v-if="totalPages > 1" class="pagination">
    <!-- Попередня -->
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      @click="goTo(currentPage - 1)"
    >
      «
    </button>

    <!-- Сторінки + крапки -->
    <button
      v-for="item in items"
      :key="item.key"
      class="page-btn"
      :class="{
        active: item.type === 'page' && item.number === currentPage,
        ellipsis: item.type === 'ellipsis',
      }"
      :disabled="item.type === 'ellipsis'"
      @click="item.type === 'page' && goTo(item.number)"
    >
      <span v-if="item.type === 'page'">{{ item.number }}</span>
      <span v-else>…</span>
    </button>

    <!-- Наступна -->
    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      @click="goTo(currentPage + 1)"
    >
      »
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["change"]);

/**
 * Логіка "короткої" пагінації:
 * 1 2 3 … 10, або 1 … 4 5 6 … 10, і т.п.
 */
const items = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const result = [];

  const addPage = (n) => {
    result.push({ type: "page", number: n, key: `p-${n}` });
  };

  const addDots = (id) => {
    result.push({ type: "ellipsis", key: `e-${id}` });
  };

  // Якщо сторінок мало — показуємо всі
  if (total <= 7) {
    for (let n = 1; n <= total; n++) addPage(n);
    return result;
  }

  // Завжди показуємо першу
  addPage(1);

  const left = current - 1;
  const right = current + 1;

  // Крапки зліва, якщо до поточної далеко
  if (left > 2) addDots("left");

  // Сторінки навколо поточної (межі 2..total-1)
  const start = Math.max(2, left);
  const end = Math.min(total - 1, right);
  for (let n = start; n <= end; n++) addPage(n);

  // Крапки справа, якщо до останньої далеко
  if (right < total - 1) addDots("right");

  // Завжди показуємо останню
  addPage(total);

  return result;
});

function goTo(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return;
  emit("change", page);
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #777;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.page-btn.active {
  background: #4287ff;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  border: 1px solid #ccc;
  background: #f8f8f8;
  color: #999;
  cursor: default;
  pointer-events: none;
}

@media (max-width: 480px) {
  .page-btn {
    padding: 3px 8px;
    font-size: 12px;
  }
}
</style>
