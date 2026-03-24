<template>
  <div class="admin-page">
    <h1>Редагувати випуск</h1>

    <form class="form" @submit.prevent="save">
      <div class="form-row">
        <label>Рік випуску*:</label>
        <input
          v-model.number="year"
          type="number"
          min="1955"
          max="2100"
          required
          readonly
        />
      </div>

      <div class="form-row">
        <label>Title (опис випуску):</label>
        <textarea
          v-model="title"
          rows="2"
          class="title-input"
          placeholder="наприклад: випуск (2016р.) студентів математичного факультету УжНУ"
        />
      </div>

      <div class="form-row">
        <label class="label-bold">Спеціальність</label>

        <div class="new-spec-section">
          <span>Форма навчання для нової спеціальності:</span>
          <select v-model="newSpecSection">
            <option value="">- Оберіть форму -</option>
            <option v-for="form in STUDY_FORMS" :key="form" :value="form">
              {{ form }}
            </option>
          </select>
        </div>

        <div class="spec-actions">
          <button type="button" class="btn small" @click="toggleSpecialtyList">
            Додати спеціальність
          </button>
        </div>

        <div v-if="showSpecialtyList" class="tags-list selector">
          <p class="hint">
            Натисни на спеціальність у списку нижче, щоб додати її до випуску з
            обраною формою навчання.
          </p>

          <button
            v-for="tag in specialtyTags"
            :key="tag"
            type="button"
            class="tag-item-button"
            @click="addExistingSpecialty(tag)"
          >
            «{{ tag }}»
          </button>
        </div>

        <div class="add-tag-row">
          <input
            v-model="newSpecialtyTag"
            placeholder="Нова спеціальність (перелік)…"
            @keyup.enter.prevent="addSpecialtyTag"
          />
          <button type="button" class="btn small" @click="addSpecialtyTag">
            Додати спеціальність
          </button>
        </div>

        <div v-if="selectedSpecs.length" class="selected-specs">
          <span class="selected-label">Вибрані:</span>

          <div
            v-for="(entry, idx) in selectedSpecs"
            :key="entry.id"
            class="selected-row"
          >
            <span>
              {{ idx + 1 }}. «{{ entry.specialty }}»
              <span v-if="entry.studyForm && entry.studyForm !== 'Немає'">
                ({{ entry.studyForm }})
              </span>
            </span>
            <button
              type="button"
              class="btn tiny danger"
              @click="removeSpecialtyEntry(entry.id)"
            >
              Видалити
            </button>
          </div>
        </div>

        <p class="hint">
          Обери одну або кілька спеціальностей цього випуску. Для кожної
          спеціальності нижче можна задати кілька фото випуску та список
          випускників.
        </p>
      </div>

      <div v-for="entry in selectedSpecs" :key="entry.id" class="spec-block">
        <h2 class="spec-title">«{{ entry.specialty }}»</h2>

        <div class="form-row">
          <label>Форма навчання (для всієї спеціальності):</label>
          <select v-model="entry.studyForm" @change="onStudyFormChange(entry)">
            <option disabled value="">— Оберіть форму —</option>
            <option v-for="form in STUDY_FORMS" :key="form" :value="form">
              {{ form }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label>Загальні фото випуску (файли):</label>
          <div class="file-row">
            <input
              type="file"
              accept="image/*"
              multiple
              @change="onSpecPhotosChange(entry.id, $event)"
            />
          </div>
        </div>

        <div v-if="hasAnyPhotos(entry.id)" class="image-preview photos-grid">
          <p>Фото спеціальності:</p>

          <div
            v-for="img in getGroup(entry.id).existingImages"
            :key="'ex-' + (img.id || img.url)"
            class="photo-item"
          >
            <img
              :src="img.url"
              :alt="img.caption || `Фото випуску ${year} – ${entry.specialty}`"
            />
            <button
              type="button"
              class="btn tiny danger"
              @click="removeExistingImage(entry.id, img)"
            >
              Видалити
            </button>
          </div>

          <div
            v-for="photo in getGroup(entry.id).newPhotos"
            :key="'new-' + photo.uid"
            class="photo-item"
          >
            <img
              :src="photo.preview"
              :alt="`Нове фото випуску ${entry.specialty}`"
            />
            <button
              type="button"
              class="btn tiny danger"
              @click="removeNewPhoto(entry.id, photo.uid)"
            >
              Прибрати
            </button>
          </div>
        </div>

        <div class="form-row">
          <h3>
            Випускники ({{ entry.specialty }},
            {{
              entry.studyForm && entry.studyForm !== "Немає"
                ? entry.studyForm
                : "форма не вибрана"
            }})
          </h3>

          <div
            v-for="(st, i) in getGroup(entry.id).students"
            :key="st.uid"
            class="student-row"
          >
            <div class="student-index">{{ i + 1 }}.</div>

            <div class="student-fields">
              <div class="student-line">
                <label>Прізвище І.П.*</label>
                <input
                  v-model="st.name"
                  placeholder="напр. Іванов І.І."
                  required
                />
              </div>

              <div class="student-line inline">
                <div class="col honors-col">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="st.honorsDegree" />
                    Диплом з відзнакою
                  </label>
                </div>

                <button
                  type="button"
                  class="btn small danger"
                  @click="removeStudent(entry.id, i)"
                >
                  Видалити
                </button>
              </div>
            </div>
          </div>

          <button type="button" class="btn small" @click="addStudent(entry.id)">
            Додати випускника
          </button>
        </div>
      </div>

      <div class="buttons">
        <button type="submit" class="btn primary" :disabled="saving">
          {{ saving ? "Збереження…" : "Зберегти випуск" }}
        </button>
        <button type="button" class="btn" @click="resetForm">
          Скасувати зміни
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">Зміни збережено</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const props = defineProps({
  graduate: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["saved"]);

const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const STUDY_FORMS = [
  "Немає",
  "Денна",
  "Заочна",
  "Дистанційна",
  "Вечірнє відділення",
  "Заочне відділення",
  "Заочники",
];

const year = ref(new Date().getFullYear());
const title = ref("");

/* ---------- спеціальності ---------- */

const specialtyTags = ref([]);
const selectedSpecs = ref([]);
const newSpecialtyTag = ref("");
const newSpecSection = ref("");
const showSpecialtyList = ref(false);

let specIdCounter = 1;

function toggleSpecialtyList() {
  showSpecialtyList.value = !showSpecialtyList.value;
}

function combinationExists(specialty, studyForm, exceptId = null) {
  return selectedSpecs.value.some(
    (e) =>
      e.specialty === specialty &&
      e.studyForm === studyForm &&
      (exceptId == null || e.id !== exceptId)
  );
}

function createSpecEntry(specialty, studyForm) {
  return {
    id: specIdCounter++,
    specialty,
    studyForm,
    _prevStudyForm: studyForm,
  };
}

function addExistingSpecialty(tag) {
  const specialty = String(tag || "").trim();
  if (!specialty) return;

  const studyForm = newSpecSection.value.trim();
  if (!studyForm) {
    alert("Спочатку оберіть форму навчання для нової спеціальності.");
    return;
  }

  if (combinationExists(specialty, studyForm)) {
    alert(
      `«${specialty}» з формою навчання «${studyForm}» уже додана до списку.`
    );
    return;
  }

  if (!specialtyTags.value.includes(specialty)) {
    specialtyTags.value.push(specialty);
  }

  selectedSpecs.value.push(createSpecEntry(specialty, studyForm));
}

function addSpecialtyTag() {
  const specialty = newSpecialtyTag.value.trim();
  if (!specialty) return;

  const studyForm = newSpecSection.value.trim();
  if (!studyForm) {
    alert("Спочатку оберіть форму навчання для нової спеціальності.");
    return;
  }

  if (combinationExists(specialty, studyForm)) {
    alert(
      `«${specialty}» з формою навчання «${studyForm}» уже додана до списку.`
    );
    newSpecialtyTag.value = "";
    return;
  }

  if (!specialtyTags.value.includes(specialty)) {
    specialtyTags.value.push(specialty);
  }

  selectedSpecs.value.push(createSpecEntry(specialty, studyForm));
  newSpecialtyTag.value = "";
}

function removeSpecialtyEntry(id) {
  const idx = selectedSpecs.value.findIndex((e) => e.id === id);
  if (idx === -1) return;

  const entry = selectedSpecs.value[idx];
  const ok = window.confirm(
    `Видалити спеціальність «${entry.specialty}» (${entry.studyForm}) разом з усіма її випускниками та фото?`
  );
  if (!ok) return;

  selectedSpecs.value.splice(idx, 1);

  const g = specialtyGroups.value[id];
  if (g && Array.isArray(g.newPhotos)) {
    for (const p of g.newPhotos) {
      if (p.preview) URL.revokeObjectURL(p.preview);
    }
  }
  delete specialtyGroups.value[id];
}

function onStudyFormChange(entry) {
  const newForm = entry.studyForm;

  if (!newForm) {
    entry.studyForm = entry._prevStudyForm;
    return;
  }

  if (combinationExists(entry.specialty, newForm, entry.id)) {
    alert(
      `Для спеціальності «${entry.specialty}» вже існує випуск з формою навчання «${newForm}».`
    );
    entry.studyForm = entry._prevStudyForm;
    return;
  }

  entry._prevStudyForm = newForm;
}

const specialtyGroups = ref({});

let uidCounter = 1;
let photoUidCounter = 1;

function createEmptyStudent() {
  return {
    uid: uidCounter++,
    name: "",
    honorsDegree: false,
  };
}

function getGroup(entryId) {
  const groups = specialtyGroups.value;
  if (!groups[entryId]) {
    groups[entryId] = {
      existingImages: [],
      newPhotos: [],
      students: [createEmptyStudent()],
    };
  }
  return groups[entryId];
}

function initFromGraduate(g) {
  if (!g) return;

  year.value = Number(g.year) || new Date().getFullYear();
  title.value = g.title || "";

  const students = Array.isArray(g.students) ? g.students : [];
  const images = Array.isArray(g.images) ? g.images : [];

  const imagesBySpec = {};
  for (const img of images) {
    if (!img || !img.specialty) continue;
    if (!imagesBySpec[img.specialty]) imagesBySpec[img.specialty] = [];
    imagesBySpec[img.specialty].push(img);
  }

  const entryByKey = new Map();
  const newGroups = {};

  specIdCounter = 1;
  uidCounter = 1;
  const entries = [];

  for (const s of students) {
    const specialty = s.specialty || "Математика";
    const studyFormRaw = s.section || "";
    const studyForm = studyFormRaw.trim() || "Немає";

    const key = `${specialty}__${studyForm}`;

    let entry = entryByKey.get(key);
    if (!entry) {
      entry = createSpecEntry(specialty, studyForm);
      entryByKey.set(key, entry);
      entries.push(entry);

      const imgs = imagesBySpec[specialty] || [];

      newGroups[entry.id] = {
        existingImages: imgs.map((img) => ({
          id: img.id ?? null,
          url: img.url,
          caption: img.caption ?? null,
        })),
        newPhotos: [],
        students: [],
      };
    }

    newGroups[entry.id].students.push({
      uid: uidCounter++,
      name: s.name || "",
      honorsDegree:
        s.honorsDegree === true ||
        s.honorsDegree === "true" ||
        s.isBold === true ||
        s.isBold === "true",
    });
  }

  if (!entries.length) {
    const defEntry = createSpecEntry("Математика", "Немає");
    entries.push(defEntry);
    newGroups[defEntry.id] = {
      existingImages: [],
      newPhotos: [],
      students: [createEmptyStudent()],
    };
  }

  selectedSpecs.value = entries;
  specialtyGroups.value = newGroups;

  for (const e of entries) {
    if (!specialtyTags.value.includes(e.specialty)) {
      specialtyTags.value.push(e.specialty);
    }
  }

  success.value = false;
  error.value = "";
}

onMounted(async () => {
  try {
    const tags = await $fetch("/api/graduates/specialties");
    if (Array.isArray(tags)) {
      specialtyTags.value = tags;
    }
  } catch (e) {
    console.error("Не вдалося завантажити список спеціальностей", e);
  }

  initFromGraduate(props.graduate);
});

watch(
  () => props.graduate,
  (val) => {
    if (val) initFromGraduate(val);
  }
);

function onSpecPhotosChange(entryId, e) {
  const target = e.target;
  const files = target && target.files ? Array.from(target.files) : [];
  if (!files.length) return;

  const g = getGroup(entryId);

  for (const file of files) {
    const uid = photoUidCounter++;
    const preview = URL.createObjectURL(file);
    g.newPhotos.push({ uid, file, preview });
  }

  target.value = "";
}

function removeNewPhoto(entryId, uid) {
  const g = getGroup(entryId);
  const idx = g.newPhotos.findIndex((p) => p.uid === uid);
  if (idx === -1) return;
  const [photo] = g.newPhotos.splice(idx, 1);
  if (photo.preview) URL.revokeObjectURL(photo.preview);
}

function removeExistingImage(entryId, img) {
  const g = getGroup(entryId);
  g.existingImages = g.existingImages.filter(
    (x) =>
      x !== img &&
      !(img.id && x.id === img.id) &&
      !(img.url && x.url === img.url && !img.id && !x.id)
  );
}

function hasAnyPhotos(entryId) {
  const g = getGroup(entryId);
  const ex = Array.isArray(g.existingImages) ? g.existingImages.length : 0;
  const nw = Array.isArray(g.newPhotos) ? g.newPhotos.length : 0;
  return ex + nw > 0;
}

async function uploadSpecialtyPhotos() {
  const result = [];

  for (const entry of selectedSpecs.value) {
    const g = getGroup(entry.id);

    // залишені існуючі
    if (Array.isArray(g.existingImages)) {
      for (const img of g.existingImages) {
        if (!img.url) continue;
        result.push({
          id: img.id ?? Date.now() + Math.random(),
          specialty: entry.specialty,
          url: img.url,
          caption: img.caption ?? null,
        });
      }
    }

    if (Array.isArray(g.newPhotos)) {
      for (const photo of g.newPhotos) {
        if (!photo.file) continue;

        const formData = new FormData();
        formData.append("image", photo.file);

        const res = await $fetch("/api/upload-image?scope=graduate", {
          method: "POST",
          body: formData,
          headers: authHeaders.value,
        });

        result.push({
          id: Date.now() + Math.random(),
          specialty: entry.specialty,
          url: res.imageUrl,
          caption: null,
        });
      }
    }
  }

  return result;
}

function addStudent(entryId) {
  const g = getGroup(entryId);
  g.students.push(createEmptyStudent());
}

function removeStudent(entryId, index) {
  const g = getGroup(entryId);

  if (g.students.length === 1) {
    g.students[0].name = "";
    g.students[0].honorsDegree = false;
    return;
  }

  g.students.splice(index, 1);
}

const saving = ref(false);
const error = ref("");
const success = ref(false);

function resetForm() {
  initFromGraduate(props.graduate);
}

async function save() {
  error.value = "";
  success.value = false;

  if (!year.value) {
    error.value = "Потрібно вказати рік випуску";
    return;
  }

  const yearNum = Number(year.value);
  if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    error.value = "Некоректний рік випуску";
    return;
  }

  if (!selectedSpecs.value.length) {
    error.value = "Потрібно вибрати хоча б одну спеціальність";
    return;
  }

  if (selectedSpecs.value.some((e) => !e.studyForm)) {
    error.value = "Для кожної спеціальності потрібно вибрати форму навчання.";
    return;
  }

  const preparedStudents = [];
  let globalId = 1;

  for (const entry of selectedSpecs.value) {
    const g = getGroup(entry.id);
    let localIndex = 1;

    for (const s of g.students) {
      if (!s.name || !s.name.trim()) continue;

      preparedStudents.push({
        id: globalId++,
        index: localIndex++,
        name: s.name.trim(),
        specialty: entry.specialty,
        section: entry.studyForm,
        year: yearNum,
        honorsDegree: !!s.honorsDegree,
      });
    }
  }

  if (!preparedStudents.length) {
    error.value = "Потрібно додати хоча б одного випускника";
    return;
  }

  saving.value = true;

  try {
    const images = await uploadSpecialtyPhotos();

    const payload = {
      year: yearNum,
      title: title.value.trim(),
      images,
      students: preparedStudents,
    };

    await $fetch(`/api/graduates/${props.graduate.year}`, {
      method: "PUT",
      body: payload,
      headers: authHeaders.value,
    });

    success.value = true;
    emit("saved", yearNum);
  } catch (e) {
    console.error(e);

    const status = e?.statusCode || e?.data?.statusCode;
    const msgFromServer =
      e?.data?.statusMessage || e?.statusMessage || e?.message;

    if (status === 409) {
      error.value =
        msgFromServer || "Випуск з таким роком уже існує (конфлікт)";
    } else {
      error.value = msgFromServer || "Помилка при збереженні випуску";
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  background: #ffffff;
}

.form {
  max-width: 1000px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.title-input {
  min-height: 48px;
  resize: vertical;
}

.label-bold {
  font-weight: 600;
}

.file-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.new-spec-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.new-spec-section select {
  max-width: 260px;
}

.spec-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
}

.tags-list.selector {
  margin-bottom: 8px;
}

.tag-item-button {
  border: none;
  background: transparent;
  padding: 2px 0;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.tag-item-button:hover {
  text-decoration: underline;
}

.add-tag-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.add-tag-row input {
  flex: 1;
}

.selected-specs {
  margin-top: 8px;
  font-size: 13px;
}

.selected-label {
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.selected-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.spec-block {
  margin: 18px 0;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid #cfd8dc;
  background: #f5f9ff;
}

.spec-title {
  margin-top: 0;
  margin-bottom: 8px;
}

.image-preview {
  margin: 10px 0;
}

.photos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-item img {
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
  border: 1px solid #ccc;
}

.student-row {
  display: flex;
  gap: 8px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #fafafa;
}

.student-index {
  width: 24px;
  padding-top: 4px;
}

.student-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.student-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-line.inline {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
}

.honors-col {
  flex: 0 0 220px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
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

.btn.tiny {
  padding: 2px 6px;
  font-size: 11px;
}

.btn.danger {
  background: #fbe4e4;
  border-color: #e57373;
}

.error {
  margin-top: 4px;
  color: #d32f2f;
}

.success {
  margin-top: 4px;
  color: #2e7d32;
}

@media (max-width: 1024px) {
  .admin-page {
    padding: 24px 20px;
  }

  .form {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .admin-page {
    padding: 20px 12px;
  }

  .form-row {
    margin-bottom: 12px;
  }

  .new-spec-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .new-spec-section select {
    max-width: 100%;
  }

  .add-tag-row {
    flex-direction: column;
    align-items: stretch;
  }

  .selected-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .spec-block {
    padding: 10px 10px;
  }

  .photos-grid {
    gap: 8px;
  }

  .photo-item img {
    max-width: 160px;
    max-height: 160px;
  }

  .student-row {
    flex-direction: column;
  }

  .student-index {
    width: auto;
    padding-top: 0;
    font-weight: 600;
  }

  .student-line.inline {
    flex-direction: column;
    align-items: flex-start;
  }

  .honors-col {
    flex: 1 1 auto;
  }

  .buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .buttons .btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .admin-page {
    padding: 16px 8px;
  }

  .btn {
    font-size: 13px;
    padding: 6px 10px;
  }
}
</style>
