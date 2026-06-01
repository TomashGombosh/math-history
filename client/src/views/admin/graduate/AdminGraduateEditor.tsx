import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../lib/api";
import type { GraduateCohortImage } from "../../../lib/apiTypes";
import { uploadImageWithPresign } from "../../../lib/uploadPresigned";
import { apiGet, apiPostAuthed, apiPutAuthed } from "../../../services/api";
import { STUDY_FORMS } from "../../../admin/graduateConstants";
import type { GraduateCohortRow } from "../../../admin/graduateMerge";
import { ROUTES } from "../../../router/paths";
import "../AdminPages.css";

type Mode = "create" | "edit";

type SpecEntry = {
  id: number;
  specialty: string;
  studyForm: string;
  _prevStudyForm: string;
};

type ExistingImage = { id?: number | null; url: string; caption?: string | null };
type NewPhoto = { uid: number; file: File; preview: string };
type StudentRow = { uid: number; name: string; honorsDegree: boolean };

type GroupState = {
  existingImages: ExistingImage[];
  newPhotos: NewPhoto[];
  students: StudentRow[];
};

type Props = {
  mode: Mode;
  /** Edit: merged cohort view */
  graduate?: GraduateCohortRow | null;
};

let specIdCounter = 1;
let uidCounter = 1;
let photoUidCounter = 1;

export function AdminGraduateEditor({ mode, graduate }: Props) {
  const navigate = useNavigate();

  const [specialtyTags, setSpecialtyTags] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<SpecEntry[]>([]);
  const [specialtyGroups, setSpecialtyGroups] = useState<Record<number, GroupState>>({});
  const [newSpecSection, setNewSpecSection] = useState("");
  const [newSpecialtyTag, setNewSpecialtyTag] = useState("");
  const [showSpecialtyList, setShowSpecialtyList] = useState(false);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [title, setTitle] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const tags = await apiGet<string[]>("api/graduates/specialties");
        if (!cancelled && Array.isArray(tags)) setSpecialtyTags(tags);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function combinationExists(specialty: string, studyForm: string, exceptId: number | null): boolean {
    return selectedSpecs.some(
      (e) => e.specialty === specialty && e.studyForm === studyForm && (exceptId == null || e.id !== exceptId)
    );
  }

  function createSpecEntry(specialty: string, studyForm: string): SpecEntry {
    return {
      id: specIdCounter++,
      specialty,
      studyForm,
      _prevStudyForm: studyForm,
    };
  }

  function updateGroup(entryId: number, fn: (g: GroupState) => GroupState) {
    setSpecialtyGroups((prev) => {
      const cur = prev[entryId] ?? {
        existingImages: [],
        newPhotos: [],
        students: [{ uid: uidCounter++, name: "", honorsDegree: false }],
      };
      return { ...prev, [entryId]: fn(cur) };
    });
  }

  function ensureGroup(entryId: number) {
    setSpecialtyGroups((prev) => {
      if (prev[entryId]) return prev;
      return {
        ...prev,
        [entryId]: {
          existingImages: [],
          newPhotos: [],
          students: [{ uid: uidCounter++, name: "", honorsDegree: false }],
        },
      };
    });
  }

  function addExistingSpecialty(tag: string) {
    const specialty = String(tag || "").trim();
    if (!specialty) return;
    const studyForm = newSpecSection.trim();
    if (!studyForm) {
      window.alert("Спочатку оберіть форму навчання для нової спеціальності.");
      return;
    }
    if (combinationExists(specialty, studyForm, null)) {
      window.alert(`«${specialty}» з формою навчання «${studyForm}» уже додана до списку.`);
      return;
    }
    setSpecialtyTags((prev) => (prev.includes(specialty) ? prev : [...prev, specialty]));
    const entry = createSpecEntry(specialty, studyForm);
    setSelectedSpecs((prev) => [...prev, entry]);
    ensureGroup(entry.id);
  }

  function addSpecialtyTag() {
    const specialty = newSpecialtyTag.trim();
    if (!specialty) return;
    const studyForm = newSpecSection.trim();
    if (!studyForm) {
      window.alert("Спочатку оберіть форму навчання для нової спеціальності.");
      return;
    }
    if (combinationExists(specialty, studyForm, null)) {
      window.alert(`«${specialty}» з формою навчання «${studyForm}» уже додана до списку.`);
      setNewSpecialtyTag("");
      return;
    }
    setSpecialtyTags((prev) => (prev.includes(specialty) ? prev : [...prev, specialty]));
    const entry = createSpecEntry(specialty, studyForm);
    setSelectedSpecs((prev) => [...prev, entry]);
    setNewSpecialtyTag("");
    ensureGroup(entry.id);
  }

  function removeSpecialtyEntry(id: number) {
    const entry = selectedSpecs.find((e) => e.id === id);
    if (!entry) return;
    if (
      !window.confirm(
        `Видалити спеціальність «${entry.specialty}» (${entry.studyForm}) разом з усіма її випускниками та фото?`
      )
    ) {
      return;
    }
    setSelectedSpecs((prev) => prev.filter((e) => e.id !== id));
    setSpecialtyGroups((prev) => {
      const g = prev[id];
      const next = { ...prev };
      delete next[id];
      if (g?.newPhotos) {
        for (const p of g.newPhotos) {
          if (p.preview) URL.revokeObjectURL(p.preview);
        }
      }
      return next;
    });
  }

  function onStudyFormChange(entry: SpecEntry, newForm: string) {
    if (!newForm) {
      setSelectedSpecs((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, studyForm: entry._prevStudyForm } : e))
      );
      return;
    }
    if (combinationExists(entry.specialty, newForm, entry.id)) {
      window.alert(`Для спеціальності «${entry.specialty}» вже існує випуск з формою навчання «${newForm}».`);
      setSelectedSpecs((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, studyForm: entry._prevStudyForm } : e))
      );
      return;
    }
    setSelectedSpecs((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, studyForm: newForm, _prevStudyForm: newForm } : e))
    );
  }

  const initFromGraduate = useCallback((g: GraduateCohortRow) => {
    specIdCounter = 1;
    uidCounter = 1;
    photoUidCounter = 1;

    setYear(Number(g.year) || new Date().getFullYear());
    setTitle(String(g.title ?? ""));

    const students = Array.isArray(g.students) ? g.students : [];
    const images = Array.isArray(g.images) ? g.images : [];

    const imagesBySpec: Record<string, GraduateCohortImage[]> = {};
    for (const img of images) {
      const row = img as GraduateCohortImage;
      const sp = row.specialty;
      if (!sp) continue;
      if (!imagesBySpec[sp]) imagesBySpec[sp] = [];
      imagesBySpec[sp].push(row);
    }

    const entryByKey = new Map<string, SpecEntry>();
    const newGroups: Record<number, GroupState> = {};
    const entries: SpecEntry[] = [];

    for (const st of students) {
      const row = st as Record<string, unknown>;
      const specialty = String(row.specialty || "Математика");
      const studyFormRaw = String(row.section || "");
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
            url: String(img.url ?? ""),
            caption: img.caption ?? null,
          })),
          newPhotos: [],
          students: [],
        };
      }

      const gstate = newGroups[entry.id];
      gstate.students.push({
        uid: uidCounter++,
        name: String(row.name ?? ""),
        honorsDegree:
          row.honorsDegree === true ||
          row.honorsDegree === "true" ||
          row.isBold === true ||
          row.isBold === "true",
      });
    }

    if (!entries.length) {
      const defEntry = createSpecEntry("Математика", "Немає");
      entries.push(defEntry);
      newGroups[defEntry.id] = {
        existingImages: [],
        newPhotos: [],
        students: [{ uid: uidCounter++, name: "", honorsDegree: false }],
      };
    }

    setSelectedSpecs(entries);
    setSpecialtyGroups(newGroups);
    setSpecialtyTags((prev) => {
      const set = new Set(prev);
      for (const e of entries) set.add(e.specialty);
      return Array.from(set);
    });
    setSuccess(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (mode === "edit" && graduate) {
      initFromGraduate(graduate);
    }
  }, [mode, graduate, initFromGraduate]);

  function onSpecPhotosChange(entryId: number, e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    updateGroup(entryId, (g) => {
      const nextPhotos = [...g.newPhotos];
      for (const file of files) {
        const uid = photoUidCounter++;
        nextPhotos.push({ uid, file, preview: URL.createObjectURL(file) });
      }
      return { ...g, newPhotos: nextPhotos };
    });
    e.target.value = "";
  }

  function removeNewPhoto(entryId: number, uid: number) {
    updateGroup(entryId, (g) => {
      const idx = g.newPhotos.findIndex((p) => p.uid === uid);
      if (idx === -1) return g;
      const [p] = g.newPhotos.splice(idx, 1);
      if (p.preview) URL.revokeObjectURL(p.preview);
      return { ...g, newPhotos: [...g.newPhotos] };
    });
  }

  function removeExistingImage(entryId: number, img: ExistingImage) {
    updateGroup(entryId, (g) => ({
      ...g,
      existingImages: g.existingImages.filter(
        (x) =>
          x !== img &&
          !(img.id != null && x.id === img.id) &&
          !(img.url && x.url === img.url && img.id == null && x.id == null)
      ),
    }));
  }

  function addStudent(entryId: number) {
    updateGroup(entryId, (g) => ({
      ...g,
      students: [...g.students, { uid: uidCounter++, name: "", honorsDegree: false }],
    }));
  }

  function removeStudent(entryId: number, index: number) {
    updateGroup(entryId, (g) => {
      if (g.students.length === 1) {
        return {
          ...g,
          students: [{ ...g.students[0], name: "", honorsDegree: false }],
        };
      }
      const students = g.students.filter((_, i) => i !== index);
      return { ...g, students };
    });
  }

  async function uploadSpecialtyPhotos(): Promise<Array<{ id: number; specialty: string; url: string; caption: string | null }>> {
    const result: Array<{ id: number; specialty: string; url: string; caption: string | null }> = [];

    for (const entry of selectedSpecs) {
      const g = specialtyGroups[entry.id];
      if (!g) continue;

      for (const img of g.existingImages) {
        if (!img.url) continue;
        result.push({
          id: Number(img.id ?? Date.now() + Math.random()),
          specialty: entry.specialty,
          url: img.url,
          caption: img.caption ?? null,
        });
      }

      for (const photo of g.newPhotos) {
        if (!photo.file) continue;
        const imageUrl = await uploadImageWithPresign(photo.file, "graduate");
        result.push({
          id: Date.now() + Math.random(),
          specialty: entry.specialty,
          url: imageUrl,
          caption: null,
        });
      }
    }

    return result;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const yearNum = Number(year);
    if (!yearNum || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError("Некоректний рік випуску");
      return;
    }

    if (!selectedSpecs.length) {
      setError("Потрібно вибрати хоча б одну спеціальність");
      return;
    }

    if (selectedSpecs.some((s) => !s.studyForm)) {
      setError("Для кожної спеціальності потрібно вибрати форму навчання.");
      return;
    }

    const preparedStudents: Array<{
      id: number;
      index: number;
      name: string;
      specialty: string;
      section: string;
      year: number;
      honorsDegree: boolean;
    }> = [];
    let globalId = 1;

    for (const entry of selectedSpecs) {
      const g = specialtyGroups[entry.id];
      if (!g) continue;
      let localIndex = 1;
      for (const s of g.students) {
        if (!s.name.trim()) continue;
        preparedStudents.push({
          id: globalId++,
          index: localIndex++,
          name: s.name.trim(),
          specialty: entry.specialty,
          section: entry.studyForm,
          year: yearNum,
          honorsDegree: s.honorsDegree,
        });
      }
    }

    if (!preparedStudents.length) {
      setError("Потрібно додати хоча б одного випускника");
      return;
    }

    setSaving(true);
    try {
      const images = await uploadSpecialtyPhotos();
      const payload = {
        year: yearNum,
        title: title.trim(),
        images,
        students: preparedStudents,
      };

      if (mode === "create") {
        await apiPostAuthed("api/graduates", payload);
        setSuccess(true);
        navigate(ROUTES.graduatesYear(yearNum));
      } else if (graduate) {
        await apiPutAuthed(`api/graduates/${graduate.year}`, payload);
        setSuccess(true);
        navigate(ROUTES.adminGraduates);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : mode === "create"
            ? "Помилка при створенні випуску"
            : "Помилка при збереженні випуску";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function resetCreateForm() {
    specIdCounter = 1;
    uidCounter = 1;
    photoUidCounter = 1;
    setYear(new Date().getFullYear());
    setTitle("");
    setSelectedSpecs([]);
    setSpecialtyGroups({});
    setNewSpecSection("");
    setNewSpecialtyTag("");
    setShowSpecialtyList(false);
    setSuccess(false);
    setError(null);
  }

  const heading = mode === "create" ? "Додати випуск" : "Редагувати випуск";

  return (
    <div className="admin-graduate-editor">
      <h1>{heading}</h1>
      <form className="admin-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="admin-form-row">
          <label htmlFor="grad-year">Рік випуску*</label>
          <input
            id="grad-year"
            type="number"
            min={1955}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            required
            readOnly={mode === "edit"}
          />
        </div>

        <div className="admin-form-row">
          <label htmlFor="grad-title">Title (опис випуску)</label>
          <textarea
            id="grad-title"
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="наприклад: випуск (2016р.) студентів математичного факультету УжНУ"
          />
        </div>

        <div className="admin-form-row">
          <span className="admin-label-bold">Спеціальність</span>
          <div className="admin-new-spec">
            <span>Форма навчання для нової спеціальності:</span>
            <select value={newSpecSection} onChange={(e) => setNewSpecSection(e.target.value)}>
              <option value="">- Оберіть форму -</option>
              {STUDY_FORMS.map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="admin-btn-secondary" onClick={() => setShowSpecialtyList((v) => !v)}>
            Додати спеціальність
          </button>

          {showSpecialtyList ? (
            <div className="admin-tags-list" role="group" aria-label="Існуючі спеціальності">
              <p className="admin-hint">
                Натисни на спеціальність у списку нижче, щоб додати її до випуску з обраною формою навчання.
              </p>
              {specialtyTags.map((tag) => (
                <button key={tag} type="button" className="admin-tag-btn" onClick={() => addExistingSpecialty(tag)}>
                  «{tag}»
                </button>
              ))}
            </div>
          ) : null}

          <div className="admin-add-tag-row">
            <input
              value={newSpecialtyTag}
              onChange={(e) => setNewSpecialtyTag(e.target.value)}
              placeholder="Нова спеціальність (перелік)…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialtyTag();
                }
              }}
            />
            <button type="button" className="admin-btn-secondary" onClick={addSpecialtyTag}>
              Додати спеціальність
            </button>
          </div>

          {selectedSpecs.length ? (
            <div>
              <span className="admin-selected-label">Вибрані:</span>
              <ul>
                {selectedSpecs.map((entry, idx) => (
                  <li key={entry.id}>
                    {idx + 1}. «{entry.specialty}» ({entry.studyForm})
                    <button type="button" className="admin-delete-link" onClick={() => removeSpecialtyEntry(entry.id)}>
                      Видалити
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="admin-hint">
            Обери одну або кілька спеціальностей цього випуску. Для кожної спеціальності нижче можна задати кілька фото
            випуску та список випускників.
          </p>
        </div>

        {selectedSpecs.map((entry) => {
          const g = specialtyGroups[entry.id];
          if (!g) return null;
          const hasPhotos = g.existingImages.length + g.newPhotos.length > 0;
          return (
            <div key={entry.id} className="admin-spec-block">
              <h2>«{entry.specialty}»</h2>

              <div className="admin-form-row">
                <label htmlFor={`sf-${entry.id}`}>Форма навчання (для всієї спеціальності)</label>
                <select
                  id={`sf-${entry.id}`}
                  value={entry.studyForm}
                  onChange={(e) => onStudyFormChange(entry, e.target.value)}
                >
                  <option disabled value="">
                    — Оберіть форму —
                  </option>
                  {STUDY_FORMS.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-row">
                <span>Загальні фото випуску (файли)</span>
                <input type="file" accept="image/*" multiple onChange={(e) => onSpecPhotosChange(entry.id, e)} />
              </div>

              {hasPhotos ? (
                <div className="admin-photos-grid">
                  <p>Фото спеціальності:</p>
                  <div className="admin-photo-items">
                    {g.existingImages.map((img, i) => (
                      <div key={`ex-${String(img.id ?? img.url)}-${i}`} className="admin-photo-item">
                        <img src={img.url} alt="" width={120} height={90} />
                        <button type="button" onClick={() => removeExistingImage(entry.id, img)}>
                          Видалити
                        </button>
                      </div>
                    ))}
                    {g.newPhotos.map((photo) => (
                      <div key={`new-${photo.uid}`} className="admin-photo-item">
                        <img src={photo.preview} alt="" width={120} height={90} />
                        <button type="button" onClick={() => removeNewPhoto(entry.id, photo.uid)}>
                          Прибрати
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="admin-form-row">
                <h3>
                  Випускники ({entry.specialty}, {entry.studyForm || "форма не вибрана"})
                </h3>
                {g.students.map((st, i) => (
                  <div key={st.uid} className="admin-student-row">
                    <span>{i + 1}.</span>
                    <div>
                      <label htmlFor={`st-${st.uid}-name`}>Прізвище І.П.*</label>
                      <input
                        id={`st-${st.uid}-name`}
                        value={st.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateGroup(entry.id, (gr) => ({
                            ...gr,
                            students: gr.students.map((x) => (x.uid === st.uid ? { ...x, name: v } : x)),
                          }));
                        }}
                        required
                        placeholder="напр. Іванов І.І."
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={st.honorsDegree}
                          onChange={(e) => {
                            const v = e.target.checked;
                            updateGroup(entry.id, (gr) => ({
                              ...gr,
                              students: gr.students.map((x) =>
                                x.uid === st.uid ? { ...x, honorsDegree: v } : x
                              ),
                            }));
                          }}
                        />
                        Диплом з відзнакою
                      </label>
                      <button type="button" className="admin-btn-secondary" onClick={() => removeStudent(entry.id, i)}>
                        Видалити
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="admin-btn-secondary" onClick={() => addStudent(entry.id)}>
                  Додати випускника
                </button>
              </div>
            </div>
          );
        })}

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? "Збереження…" : mode === "create" ? "Зберегти випуск" : "Зберегти випуск"}
          </button>
          {mode === "create" ? (
            <button type="button" className="admin-btn-secondary" onClick={resetCreateForm}>
              Скасувати
            </button>
          ) : (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => graduate && initFromGraduate(graduate)}
            >
              Скасувати зміни
            </button>
          )}
        </div>

        {error ? (
          <p role="alert" className="admin-error">
            {error}
          </p>
        ) : null}
        {success ? <p className="admin-success">Збережено</p> : null}
      </form>
    </div>
  );
}
