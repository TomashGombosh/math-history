<template>
  <div class="layout-settings">
    <h1>Налаштування сторінки викладача</h1>

    <div class="layout-grid">
      <div class="settings-column">
        <section>
          <h2>Поля в шапці (під імʼям)</h2>
          <p class="hint">
            Перетягни, щоб змінити порядок. Око — показати / сховати.
          </p>

          <div
            class="row draggable"
            v-for="(field, index) in config.headerFields"
            :key="field.id"
            draggable="true"
            data-drag-row="1"
            data-type="header"
            :data-index="index"
            @dragstart="onDragStart('header', index)"
            @dragover.prevent
            @drop="onDrop('header', index)"
            @touchstart.passive="onTouchStart($event, 'header', index)"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          >
            <span class="drag-handle">↕</span>
            <span class="label">{{ field.label }}</span>

            <button
              type="button"
              class="icon-btn"
              @click="field.visible = !field.visible"
            >
              <span v-if="field.visible">👁️</span>
              <span v-else>🙈</span>
            </button>
          </div>
        </section>

        <section style="margin-top: 24px">
          <h2>Порядок і видимість розділів</h2>
          <p class="hint">
            Так само перетягни, щоб змінити порядок розділів. Око — показати /
            сховати розділ у всіх викладачів.
          </p>

          <div
            class="row draggable"
            v-for="(sec, index) in config.sections"
            :key="sec.id"
            draggable="true"
            data-drag-row="1"
            data-type="section"
            :data-index="index"
            @dragstart="onDragStart('section', index)"
            @dragover.prevent
            @drop="onDrop('section', index)"
            @touchstart.passive="onTouchStart($event, 'section', index)"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          >
            <span class="drag-handle">↕</span>
            <span class="label">{{ sec.title }}</span>

            <button
              type="button"
              class="icon-btn"
              @click="sec.visible = !sec.visible"
            >
              <span v-if="sec.visible">👁️</span>
              <span v-else>🙈</span>
            </button>
          </div>
        </section>

        <div class="actions">
          <button type="button" @click="save" :disabled="saving">
            {{ saving ? "Збереження..." : "Зберегти налаштування" }}
          </button>
          <button
            type="button"
            class="secondary"
            @click="cancel"
            :disabled="saving"
          >
            Скасувати
          </button>
        </div>
      </div>

      <div class="preview-column">
        <h2>Превʼю сторінки викладача</h2>
        <div class="teacher-page">
          <div class="header">
            <div class="photo">
              <div class="photo-skeleton">Фото</div>
            </div>
            <div class="info">
              <h1>Імʼя викладача</h1>
              <p v-for="field in previewHeaderFields" :key="field.id">
                {{ exampleHeaderValue(field.id) }}
              </p>
            </div>
          </div>

          <template v-for="sec in previewSections" :key="sec.id">
            <section v-if="sec.visible">
              <h3>{{ sec.title }}</h3>
              <p v-if="sec.id === 'shortInformation'">
                Коротка інформація про викладача...
              </p>
              <p v-else-if="sec.id === 'bio'">Біографія викладача...</p>
              <ol v-else-if="sec.id === 'publications'">
                <li>(2010) Приклад публікації...</li>
                <li>(2015) Ще одна публікація...</li>
              </ol>
            </section>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";

const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const headerFieldDefs = [
  { id: "title", label: "Title" },
  { id: "academicDegree", label: "Науковий ступінь" },
  { id: "position", label: "Посада" },
  { id: "faculty", label: "Факультет" },
];

const sectionDefs = [
  { id: "shortInformation", title: "Коротка інформація" },
  { id: "bio", title: "Біографія" },
  { id: "publications", title: "Публікації" },
];

const config = reactive({
  headerFields: [],
  sections: [],
});

const originalConfig = ref(null);
const saving = ref(false);

const dragState = ref({
  type: null,
  index: null,
});

const touchState = ref({
  active: false,
  type: null,
  fromIndex: null,
  overIndex: null,
});

function normalizeLayout(raw = {}) {
  const result = { headerFields: [], sections: [] };

  // headerFields
  if (Array.isArray(raw.headerFields)) {
    result.headerFields = raw.headerFields
      .filter((h) => h && h.id)
      .map((h, idx) => ({
        id: h.id,
        label:
          h.label || headerFieldDefs.find((d) => d.id === h.id)?.label || h.id,
        visible: h.visible !== undefined ? !!h.visible : true,
        order:
          typeof h.order === "number" && !Number.isNaN(h.order)
            ? h.order
            : idx + 1,
      }));
  } else if (raw.headerFields && typeof raw.headerFields === "object") {
    result.headerFields = headerFieldDefs.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible:
        raw.headerFields[def.id] !== undefined
          ? !!raw.headerFields[def.id]
          : true,
      order: idx + 1,
    }));
  } else {
    result.headerFields = headerFieldDefs.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible: true,
      order: idx + 1,
    }));
  }

  // sections
  if (Array.isArray(raw.sections)) {
    result.sections = raw.sections
      .filter((s) => s && s.id)
      .map((s, idx) => ({
        id: s.id,
        title: s.title || sectionDefs.find((d) => d.id === s.id)?.title || s.id,
        visible: s.visible !== undefined ? !!s.visible : true,
        order:
          typeof s.order === "number" && !Number.isNaN(s.order)
            ? s.order
            : idx + 1,
      }));
  } else {
    result.sections = sectionDefs.map((def, idx) => ({
      id: def.id,
      title: def.title,
      visible: true,
      order: idx + 1,
    }));
  }

  result.headerFields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  result.sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return result;
}

onMounted(async () => {
  await loadConfig();
});

async function loadConfig() {
  const data = await $fetch("/api/layout", {
    headers: authHeaders.value,
  });

  const norm = normalizeLayout(data || {});

  config.headerFields.splice(
    0,
    config.headerFields.length,
    ...norm.headerFields
  );
  config.sections.splice(0, config.sections.length, ...norm.sections);

  originalConfig.value = JSON.parse(JSON.stringify(norm));
}

function onDragStart(type, index) {
  dragState.value = { type, index };
}

function onDrop(type, index) {
  const { type: dragType, index: fromIndex } = dragState.value;
  if (!dragType || dragType !== type || fromIndex === null) return;

  const arr = type === "header" ? config.headerFields : config.sections;
  if (fromIndex < 0 || fromIndex >= arr.length) return;
  if (index < 0 || index >= arr.length) return;

  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(index, 0, moved);

  arr.forEach((item, i) => (item.order = i + 1));

  dragState.value = { type: null, index: null };
}

function onTouchStart(event, type, index) {
  touchState.value = {
    active: true,
    type,
    fromIndex: index,
    overIndex: index,
  };
}

function onTouchMove(event) {
  if (!touchState.value.active) return;

  const touch = event.touches[0];
  if (!touch) return;

  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!el) return;

  const row = el.closest("[data-drag-row='1']");
  if (!row) return;

  const type = row.dataset.type;
  const index = Number(row.dataset.index);

  if (type === touchState.value.type) {
    touchState.value.overIndex = index;
  }
}

function onTouchEnd() {
  const info = touchState.value;
  if (!info.active) return;

  const { type, fromIndex, overIndex } = info;

  if (
    type &&
    fromIndex != null &&
    overIndex != null &&
    fromIndex !== overIndex
  ) {
    const arr = type === "header" ? config.headerFields : config.sections;

    if (
      fromIndex >= 0 &&
      fromIndex < arr.length &&
      overIndex >= 0 &&
      overIndex < arr.length
    ) {
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(overIndex, 0, moved);
      arr.forEach((item, i) => (item.order = i + 1));
    }
  }

  touchState.value = {
    active: false,
    type: null,
    fromIndex: null,
    overIndex: null,
  };
}

function cancel() {
  if (!originalConfig.value) return;
  const norm = normalizeLayout(originalConfig.value);

  config.headerFields.splice(
    0,
    config.headerFields.length,
    ...norm.headerFields
  );
  config.sections.splice(0, config.sections.length, ...norm.sections);
}

async function save() {
  saving.value = true;
  try {
    const payload = {
      headerFields: config.headerFields.map((f, idx) => ({
        ...f,
        order: idx + 1,
      })),
      sections: config.sections.map((s, idx) => ({
        ...s,
        order: idx + 1,
      })),
    };

    await $fetch("/api/layout", {
      method: "PUT",
      body: payload,
      headers: authHeaders.value,
    });

    originalConfig.value = JSON.parse(JSON.stringify(payload));
    alert("Налаштування збережено");
  } catch (e) {
    console.error(e);
    alert("Помилка при збереженні налаштувань");
  } finally {
    saving.value = false;
  }
}

const previewHeaderFields = computed(() =>
  config.headerFields.filter((f) => f.visible)
);

const previewSections = computed(() => config.sections);

function exampleHeaderValue(id) {
  if (id === "title") return "доцент, к. ф.-м. н.";
  if (id === "academicDegree") return "к. ф.-м. н.";
  if (id === "position") return "Доцент кафедри";
  if (id === "faculty") return "Математичний факультет";
  return "";
}
</script>

<style scoped>
.layout-settings {
  max-width: 1200px;
  margin: 0 auto;
}

.layout-grid {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.settings-column {
  flex: 1;
}

.preview-column {
  flex: 1;
}

.hint {
  font-size: 13px;
  color: #555;
  margin-bottom: 6px;
}

.row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
  padding: 4px 6px;
  border: 1px solid transparent;
}

.row.draggable {
  cursor: move;
}

.row.draggable:hover {
  border-color: #ddd;
  background: #fafafa;
}

.drag-handle {
  font-size: 14px;
  width: 16px;
}

.label {
  flex: 1;
}

.icon-btn {
  border: 1px solid #ccc;
  background: #f8f8f8;
  padding: 2px 6px;
  cursor: pointer;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.actions .secondary {
  background: #eee;
}

.teacher-page {
  border: 1px solid #ddd;
  padding: 12px;
}

.header {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.photo {
  width: 80px;
  height: 110px;
}

.photo-skeleton {
  width: 100%;
  height: 100%;
  background: #f3f3f3;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #777;
}

.info h1 {
  margin: 0 0 4px;
  font-size: 18px;
}

.info p {
  margin: 2px 0;
  font-size: 13px;
}

.teacher-page section {
  margin-bottom: 8px;
}

.teacher-page h3 {
  margin: 4px 0;
  font-size: 15px;
}

@media (max-width: 1024px) {
  .layout-settings {
    max-width: 100%;
    padding: 0 12px;
  }

  .layout-grid {
    flex-direction: column;
    gap: 24px;
  }

  .settings-column,
  .preview-column {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .layout-settings {
    padding: 0 10px;
  }

  .layout-grid {
    gap: 18px;
  }

  h1 {
    font-size: 22px;
    text-align: left;
  }

  .hint {
    font-size: 12px;
  }

  .row {
    padding: 4px 4px;
  }

  .teacher-page {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .photo {
    width: 70px;
    height: 90px;
  }

  .info h1 {
    font-size: 16px;
  }

  .info p {
    font-size: 12px;
  }
}
</style>

