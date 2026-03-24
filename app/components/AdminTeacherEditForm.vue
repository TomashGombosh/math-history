<template>
  <div v-if="localTeacher.id" class="admin-page">
    <h1>Редагувати викладача</h1>

    <form class="form" @submit.prevent="save">
      <div class="form-row">
        <label>Ім'я:</label>
        <input v-model="localTeacher.name" required />
      </div>

      <div class="form-row">
        <label>Факультет:</label>
        <input v-model="localTeacher.faculty" />
      </div>

      <div class="form-row">
        <label>Посада:</label>
        <select v-model="positionSelect">
          <option value="">- Немає -</option>

          <option v-for="pos in positionOptions" :key="pos" :value="pos">
            {{ pos }}
          </option>

          <option value="__other__">Інше (вказати)</option>
        </select>
      </div>

      <div v-if="positionSelect === '__other__'" class="form-row">
        <label>Своя посада:</label>
        <input v-model="positionOther" placeholder="Напр. Завідувач кафедри" />
      </div>

      <div class="form-row">
        <label>Title (вчене звання/посада):</label>
        <input v-model="localTeacher.title" />
      </div>

      <p class="label-bold">Науковий ступінь</p>
      <div class="degrees">
        <label v-for="opt in degreeOptions" :key="opt" class="degree-item">
          <span class="degree-text">{{ opt }}</span>
          <input type="checkbox" :value="opt" v-model="degreesSelected" />
        </label>

        <div class="degree-item degree-item--other">
          <span>Інший (вказати)</span>
          <input
            type="checkbox"
            :checked="hasDegreeOther"
            @change="toggleDegreeOther"
          />

          <div v-if="hasDegreeOther" class="degree-other-input">
            <input v-model="degreeOther" placeholder="Напр. д. юр. н." />
          </div>
        </div>
      </div>

      <!-- Поточне фото (завжди показуємо, навіть дефолтне) -->
      <div class="form-row">
        <label>Поточне фото:</label>
        <img :src="previewImageSrc" alt="Поточне фото" class="current-photo" />
      </div>

      <div class="form-row">
        <label>Нове фото (файл):</label>
        <div class="file-row">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="onFileChange"
          />
          <button type="button" class="btn small" @click="clearImage">
            Прибрати фото
          </button>
        </div>
      </div>

      <div v-if="imagePreview" class="image-preview">
        <p>Попередній перегляд нового фото:</p>
        <img :src="imagePreview" alt="Нове фото" />
      </div>

      <!-- Тексти -->
      <div class="form-row description">
        <label>Коротка інформація:</label>
        <textarea v-model="localTeacher.shortInformation" rows="3" />
      </div>

      <div class="form-row description">
        <label>Біографія:</label>
        <textarea v-model="localTeacher.bio" rows="6" />
      </div>

      <!-- ПУБЛІКАЦІЇ -->
      <div class="form-row">
        <h3>Публікації</h3>

        <div
          class="pub-row"
          v-for="(pub, i) in localTeacher.publications"
          :key="i"
        >
          <div class="pub-year">
            <label>Рік:</label>
            <input v-model="pub.year" type="number" min="1900" max="2100" />
          </div>
          <div class="pub-text">
            <label>Опис:</label>
            <textarea v-model="pub.text" rows="2" />
          </div>
          <button
            type="button"
            class="btn small"
            @click="confirmRemovePublication(i)"
          >
            Видалити
          </button>
        </div>

        <button type="button" class="btn small" @click="addPublication">
          Додати публікацію
        </button>
      </div>

      <div class="buttons">
        <button type="submit" class="btn primary" :disabled="saving">
          {{ saving ? "Збереження…" : "Зберегти" }}
        </button>
        <button type="button" class="btn" @click="cancelChanges">
          Скасувати
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <hr class="divider" />

    <div class="teacher-page">
      <h3>Попередній перегляд сторінки викладача</h3>

      <div class="header">
        <div class="photo">
          <img
            :src="previewImageSrc"
            :alt="localTeacher.name || 'Фото викладача'"
          />
        </div>

        <div class="info">
          <h2>{{ localTeacher.name || "Ім'я викладача" }}</h2>

          <template v-for="field in sortedHeaderFields" :key="field.id">
            <p v-if="hasHeaderValue(field.id)">
              {{ getHeaderValue(field.id) }}
            </p>
          </template>
        </div>
      </div>

      <template v-for="sec in sortedSections" :key="sec.id">
        <section v-if="sec.visible && hasSectionContent(sec.id)">
          <h3>{{ sec.title }}</h3>

          <p v-if="sec.id === 'shortInformation'">
            {{ localTeacher.shortInformation }}
          </p>

          <p v-else-if="sec.id === 'bio'">
            {{ localTeacher.bio }}
          </p>

          <ol v-else-if="sec.id === 'publications'">
            <li v-for="pub in previewPublications" :key="pub.index">
              <span v-if="pub.year">({{ pub.year }}) </span>{{ pub.text }}
            </li>
          </ol>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed, onMounted } from "vue";
import { useRouter } from "#app";

const DEFAULT_AVATAR = "/profile-icon.webp";

const router = useRouter();
const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const props = defineProps({
  teacher: {
    type: Object,
    default: null,
  },
});

const localTeacher = reactive({
  id: null,
  name: "",
  faculty: "",
  position: "",
  title: "",
  academicDegree: "",
  shortInformation: "",
  bio: "",
  imageUrl: "",
  publications: [],
});

const originalTeacher = ref(null);

const positionSelect = ref("");
const positionOther = ref("");

const defaultPositions = [
  "Асистент",
  "Викладач",
  "Старший викладач",
  "Доцент кафедри",
  "Доцент",
  "Професор кафедри",
  "Професор",
];

const positionOptions = ref([...defaultPositions]);

const computedPosition = computed(() => {
  if (positionSelect.value === "__other__") {
    return positionOther.value.trim();
  }
  return positionSelect.value || "";
});

const defaultDegreeOptions = [
  "д. екон. н.",
  "д. техн. н.",
  "д. ф.-м. н.",
  "к. екон. н.",
  "к. пед. н.",
  "к. техн. н.",
  "к. ф.-м. н.",
];

const degreeOptions = ref([...defaultDegreeOptions]);

const degreesSelected = ref([]);
const degreeOther = ref("");
const _degreeOtherChecked = ref(false);

const hasDegreeOther = computed(
  () => degreeOther.value.trim().length > 0 || _degreeOtherChecked.value
);

function toggleDegreeOther(e) {
  _degreeOtherChecked.value = e.target.checked;
  if (!e.target.checked) degreeOther.value = "";
}

const academicDegreeDisplay = computed(() => {
  const list = [...degreesSelected.value];
  if (degreeOther.value.trim()) list.push(degreeOther.value.trim());
  return list.join(", ");
});

function mergeUnique(base, extra) {
  const set = new Set(base);
  for (const v of extra || []) {
    const val = (v || "").toString().trim();
    if (val) set.add(val);
  }
  return Array.from(set);
}

/** важливо: прапорець, що фото прибрали */
const imageCleared = ref(false);

function initFromTeacher(t) {
  if (!t) {
    localTeacher.id = null;
    return;
  }

  Object.assign(localTeacher, {
    id: t.id ?? null,
    name: t.name ?? "",
    faculty: t.faculty ?? "",
    position: t.position ?? "",
    title: t.title ?? "",
    academicDegree: t.academicDegree ?? "",
    shortInformation: t.shortInformation ?? "",
    bio: t.bio ?? "",
    imageUrl: t.imageUrl ?? "",
    publications: Array.isArray(t.publications) ? [...t.publications] : [],
  });

  imageCleared.value = false;

  const knownPositions = defaultPositions;
  if (!t.position) {
    positionSelect.value = "";
    positionOther.value = "";
  } else if (knownPositions.includes(t.position)) {
    positionSelect.value = t.position;
    positionOther.value = "";
  } else {
    positionSelect.value = "__other__";
    positionOther.value = t.position;
  }

  degreesSelected.value = [];
  degreeOther.value = "";
  _degreeOtherChecked.value = false;

  const parts = (t.academicDegree || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const otherParts = [];
  for (const p of parts) {
    if (degreeOptions.value.includes(p)) degreesSelected.value.push(p);
    else otherParts.push(p);
  }
  if (otherParts.length) {
    degreeOther.value = otherParts.join(", ");
    _degreeOtherChecked.value = true;
  }

  originalTeacher.value = JSON.parse(
    JSON.stringify({
      ...localTeacher,
      positionSelect: positionSelect.value,
      positionOther: positionOther.value,
      degreesSelected: degreesSelected.value,
      degreeOther: degreeOther.value,
      _degreeOtherChecked: _degreeOtherChecked.value,
    })
  );
}

watch(
  () => props.teacher,
  (val) => initFromTeacher(val),
  { immediate: true }
);

function addPublication() {
  const index = localTeacher.publications.length + 1;
  localTeacher.publications.push({ index, year: "", text: "" });
}

function confirmRemovePublication(i) {
  const pub = localTeacher.publications[i];
  const preview = pub?.text ? pub.text.slice(0, 50) + "..." : "";
  if (
    !window.confirm(
      preview
        ? `Видалити публікацію:\n"${preview}"?`
        : "Видалити цю публікацію?"
    )
  )
    return;

  localTeacher.publications.splice(i, 1);
  localTeacher.publications.forEach((p, idx) => (p.index = idx + 1));
}

const previewPublications = computed(() =>
  localTeacher.publications
    .filter((p) => p.text && p.text.trim())
    .map((p, idx) => ({
      index: idx + 1,
      year: p.year ? Number(p.year) : null,
      text: p.text.trim(),
    }))
);

const imageFile = ref(null);
const imagePreview = ref(null);
const fileInput = ref(null);

function clearPreview() {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  imagePreview.value = null;
}

function onFileChange(e) {
  const file = e.target.files[0];
  imageFile.value = file || null;
  imageCleared.value = false; // якщо вибрали нове — уже не cleared

  clearPreview();
  if (file) imagePreview.value = URL.createObjectURL(file);
}

function clearImage() {
  imageFile.value = null;
  clearPreview();
  if (fileInput.value) fileInput.value.value = "";

  localTeacher.imageUrl = "";
  imageCleared.value = true; // важливо: хочемо відправити imageUrl=""
}

const previewImageSrc = computed(() => {
  if (imagePreview.value) return imagePreview.value;
  if (!imageCleared.value && localTeacher.imageUrl)
    return localTeacher.imageUrl;
  return DEFAULT_AVATAR;
});

async function uploadImageIfNeeded() {
  // якщо натиснули "Прибрати фото" — мусимо відправити "" щоб бек видалив старе
  if (!imageFile.value) {
    if (imageCleared.value) return "";
    return localTeacher.imageUrl ? localTeacher.imageUrl : null;
  }

  const formData = new FormData();
  formData.append("image", imageFile.value);

  const res = await $fetch("/api/upload-image?scope=teacher", {
    method: "POST",
    body: formData,
    headers: authHeaders.value,
  });

  return res.imageUrl;
}

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

function normalizeLayout(raw = {}) {
  const result = { headerFields: [], sections: [] };

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
  } else {
    result.headerFields = headerFieldDefs.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible: true,
      order: idx + 1,
    }));
  }

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

const layout = ref(normalizeLayout({}));

onMounted(async () => {
  try {
    const data = await $fetch("/api/layout");
    layout.value = normalizeLayout(data || {});
  } catch (e) {
    console.error("Не вдалося завантажити layout", e);
  }
});

onMounted(async () => {
  try {
    const meta = await $fetch("/api/teachers/meta", {
      headers: authHeaders.value,
    });

    if (meta) {
      positionOptions.value = mergeUnique(defaultPositions, meta.positions);
      degreeOptions.value = mergeUnique(defaultDegreeOptions, meta.degrees);

      if (localTeacher.position) {
        positionOptions.value = mergeUnique(positionOptions.value, [
          localTeacher.position,
        ]);
      }
    }
  } catch (e) {
    console.error("Не вдалося завантажити список посад/ступенів", e);
  }
});

const sortedHeaderFields = computed(() =>
  (layout.value.headerFields || []).filter((f) => f.visible)
);
const sortedSections = computed(() =>
  (layout.value.sections || []).filter((s) => !!s)
);

function hasHeaderValue(id) {
  if (id === "title") return !!localTeacher.title;
  if (id === "academicDegree") return !!academicDegreeDisplay.value;
  if (id === "position") return !!computedPosition.value;
  if (id === "faculty") return !!localTeacher.faculty;
  return false;
}

function getHeaderValue(id) {
  if (id === "title") return localTeacher.title;
  if (id === "academicDegree") return academicDegreeDisplay.value;
  if (id === "position") return computedPosition.value;
  if (id === "faculty") return localTeacher.faculty;
  return "";
}

function hasSectionContent(id) {
  if (id === "shortInformation") return !!localTeacher.shortInformation;
  if (id === "bio") return !!localTeacher.bio;
  if (id === "publications") return previewPublications.value.length > 0;
  return false;
}

const saving = ref(false);
const error = ref("");

function cancelChanges() {
  if (!originalTeacher.value) return;
  const t = originalTeacher.value;

  initFromTeacher({
    id: t.id,
    name: t.name,
    faculty: t.faculty,
    position: t.position,
    title: t.title,
    academicDegree: t.academicDegree,
    shortInformation: t.shortInformation,
    bio: t.bio,
    imageUrl: t.imageUrl,
    publications: t.publications,
  });

  imageFile.value = null;
  clearPreview();
  if (fileInput.value) fileInput.value.value = "";

  error.value = "";
}

async function save() {
  error.value = "";

  for (const p of localTeacher.publications) {
    if (p.text && p.text.trim() && (!p.year || isNaN(p.year))) {
      alert(
        'Для кожної публікації з текстом потрібно вказати рік.\nПеревір поле "Публікації".'
      );
      return;
    }
  }

  const imageUrl = await uploadImageIfNeeded();

  const payload = {
    name: localTeacher.name,
    faculty: localTeacher.faculty,
    position: computedPosition.value,
    title: localTeacher.title,
    academicDegree: academicDegreeDisplay.value,
    shortInformation: localTeacher.shortInformation,
    bio: localTeacher.bio,
    imageUrl, // "" -> видалити, null -> не чіпати, "/images/..." -> залишити/оновити
    publications: previewPublications.value,
  };

  saving.value = true;
  try {
    await $fetch(`/api/teachers/${localTeacher.id}`, {
      method: "PUT",
      body: payload,
      headers: authHeaders.value,
    });

    await router.push("/admin/teachers");
  } catch (e) {
    console.error(e);
    error.value =
      (e?.data && e.data.statusMessage) || "Помилка при збереженні викладача";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px;
  background: #ffffff;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.form-row input,
.form-row textarea,
.form-row select {
  width: 100%;
  padding: 8px 10px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #999;
  background: #fdfdfd;
}

.description textarea {
  height: 260px;
}

.label-bold {
  font-weight: 600;
  margin-top: 6px;
}

.file-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.current-photo {
  max-width: 150px;
  max-height: 200px;
  object-fit: cover;
  border: 1px solid #ccc;
}

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid #bbb;
  padding: 6px 12px;
  background: #f3f3f3;
  cursor: pointer;
  font-size: 14px;
}

.btn.primary {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
}

.btn.small {
  padding: 4px 8px;
  font-size: 12px;
}

.error {
  margin-top: 4px;
  color: #d32f2f;
}

.pub-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-direction: column;
}

.pub-year input {
  width: 90px;
}

.pub-text {
  flex: 1;
}

textarea {
  width: 100%;
}

.image-preview {
  margin: 10px 0;
}

.image-preview img {
  max-width: 150px;
  max-height: 200px;
  object-fit: cover;
  border: 1px solid #ccc;
}

.degrees {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 4px 0 8px;
}

.degree-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.degree-item input[type="checkbox"] {
  margin-left: 8px;
}

.degree-item--other {
  flex-wrap: wrap;
}

.degree-item--other .degree-other-input {
  margin-top: 4px;
  width: 100%;
}

.degree-other-input {
  border: 1px solid;
}

.divider {
  margin: 24px 0 16px;
}

.teacher-page {
  max-width: 900px;
  margin: 16px auto 24px;
}

.header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.photo {
  width: 160px;
  height: 210px;
  flex-shrink: 0;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #ccc;
}

.info h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.info p {
  margin: 2px 0;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 16px 12px;
  }

  .description textarea {
    height: 220px;
  }

  .header {
    flex-direction: column;
    gap: 12px;
  }

  .photo {
    width: 140px;
    height: 190px;
  }

  .teacher-page {
    margin: 16px 0 24px;
  }
}
</style>
