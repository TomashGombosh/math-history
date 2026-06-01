import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../lib/api";
import type { TeacherDto } from "../../../lib/apiTypes";
import { uploadImageWithPresign } from "../../../lib/uploadPresigned";
import { apiGet, apiGetAuthed, apiPostAuthed, apiPutAuthed } from "../../../services/api";
import {
  DEFAULT_DEGREE_OPTIONS,
  DEFAULT_POSITIONS,
  mergeUnique,
  normalizeLayout,
  type LayoutConfig,
} from "../../../admin/teacherLayout";
import { toPreviewPublications, validatePublicationsHaveYear, type PublicationInput } from "../../../admin/teacherPublications";
import { ROUTES } from "../../../router/paths";
import { TeacherPagePreview, type TeacherPreviewModel } from "./TeacherPagePreview";
import "../AdminPages.css";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  teacherId?: number;
  initialTeacher?: TeacherDto | null;
};

export function AdminTeacherEditor({ mode, teacherId, initialTeacher }: Props) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const setPreviewObjectUrl = useCallback((url: string | null) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    if (url) previewObjectUrlRef.current = url;
    setImagePreview(url);
  }, []);

  const [layout, setLayout] = useState<LayoutConfig>(() => normalizeLayout({}));
  const [positionOptions, setPositionOptions] = useState<string[]>(() => [...DEFAULT_POSITIONS]);
  const [degreeOptions, setDegreeOptions] = useState<string[]>(() => [...DEFAULT_DEGREE_OPTIONS]);

  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [title, setTitle] = useState("");
  const [shortInformation, setShortInformation] = useState("");
  const [bio, setBio] = useState("");

  const [positionSelect, setPositionSelect] = useState("");
  const [positionOther, setPositionOther] = useState("");

  const [degreesSelected, setDegreesSelected] = useState<string[]>([]);
  const [degreeOther, setDegreeOther] = useState("");
  const [degreeOtherChecked, setDegreeOtherChecked] = useState(false);

  const [publications, setPublications] = useState<PublicationInput[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [imageCleared, setImageCleared] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const computedPosition = useMemo(() => {
    if (positionSelect === "__other__") return positionOther.trim();
    return positionSelect || "";
  }, [positionOther, positionSelect]);

  const academicDegreeDisplay = useMemo(() => {
    const list = [...degreesSelected];
    if (degreeOther.trim()) list.push(degreeOther.trim());
    return list.join(", ");
  }, [degreeOther, degreesSelected]);

  const hasDegreeOther = degreeOther.trim().length > 0 || degreeOtherChecked;

  const previewPublications = useMemo(() => toPreviewPublications(publications), [publications]);

  const previewModel: TeacherPreviewModel = useMemo(
    () => ({
      name,
      faculty,
      title,
      academicDegreeDisplay,
      position: computedPosition,
      shortInformation,
      bio,
      publications: previewPublications,
    }),
    [academicDegreeDisplay, bio, computedPosition, faculty, name, previewPublications, shortInformation, title]
  );

  const previewName = name.trim() ? name : "Ім'я викладача";

  const previewImageSrc = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (mode === "edit" && !imageCleared && savedImageUrl) {
      return savedImageUrl.startsWith("/") ? savedImageUrl : `/${savedImageUrl}`;
    }
    return "";
  }, [imageCleared, imagePreview, mode, savedImageUrl]);

  const initFromTeacher = useCallback(
    (t: TeacherDto, positionsList: string[], degreesList: string[]) => {
      setName(t.name ?? "");
      setFaculty(t.faculty ?? "");
      setTitle(t.title ?? "");
      setShortInformation(t.shortInformation ?? "");
      setBio(t.bio ?? "");

      const pos = t.position ?? "";
      const knownPos = new Set(positionsList);
      if (!pos) {
        setPositionSelect("");
        setPositionOther("");
      } else if (knownPos.has(pos)) {
        setPositionSelect(pos);
        setPositionOther("");
      } else {
        setPositionSelect("__other__");
        setPositionOther(pos);
      }

      const parts = (t.academicDegree || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const degreeSet = new Set(degreesList);
      const fromList: string[] = [];
      const otherParts: string[] = [];
      for (const p of parts) {
        if (degreeSet.has(p)) {
          fromList.push(p);
        } else {
          otherParts.push(p);
        }
      }
      setDegreesSelected(fromList);
      if (otherParts.length) {
        setDegreeOther(otherParts.join(", "));
        setDegreeOtherChecked(true);
      } else {
        setDegreeOther("");
        setDegreeOtherChecked(false);
      }

      const pubs = Array.isArray(t.publications) ? t.publications : [];
      setPublications(
        pubs.map((p: unknown) => {
          const o = p as Record<string, unknown>;
          return {
            year: o.year !== undefined && o.year !== null ? String(o.year) : "",
            text: String(o.text ?? ""),
          };
        })
      );

      setSavedImageUrl(t.imageUrl ?? null);
      setImageCleared(false);
      setImageFile(null);
      setPreviewObjectUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [setPreviewObjectUrl]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [layoutData, meta] = await Promise.all([
          apiGet<unknown>("api/layout"),
          apiGetAuthed<{ positions: string[]; degrees: string[] }>("api/teachers/meta"),
        ]);
        if (cancelled) return;
        setLayout(normalizeLayout(layoutData));
        setPositionOptions(mergeUnique(DEFAULT_POSITIONS, meta.positions));
        setDegreeOptions(mergeUnique(DEFAULT_DEGREE_OPTIONS, meta.degrees));
        setMetaLoaded(true);
      } catch {
        setMetaLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !initialTeacher || !metaLoaded) return;
    const positionsList = mergeUnique(positionOptions, [initialTeacher.position ?? ""]);
    initFromTeacher(initialTeacher, positionsList, degreeOptions);
  }, [mode, initialTeacher, metaLoaded, positionOptions, degreeOptions, initFromTeacher]);

  function addPublication() {
    setPublications((prev) => [...prev, { year: "", text: "" }]);
  }

  function removePublication(index: number) {
    const pub = publications[index];
    const preview = pub?.text ? `${String(pub.text).slice(0, 50)}...` : "";
    const message = preview ? `Видалити публікацію:\n"${preview}"?` : "Видалити цю публікацію?";
    if (!window.confirm(message)) return;
    setPublications((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePublication(index: number, patch: Partial<PublicationInput>) {
    setPublications((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImageCleared(false);
    if (file) setPreviewObjectUrl(URL.createObjectURL(file));
    else setPreviewObjectUrl(null);
  }

  function clearImage() {
    setImageFile(null);
    setPreviewObjectUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mode === "edit") {
      setSavedImageUrl(null);
      setImageCleared(true);
    }
  }

  async function resolveImageUrlForSave(): Promise<string | null | undefined> {
    if (mode === "create") {
      if (!imageFile) return undefined;
      return uploadImageWithPresign(imageFile, "teacher");
    }
    if (!imageFile) {
      if (imageCleared) return "";
      return savedImageUrl ?? undefined;
    }
    return uploadImageWithPresign(imageFile, "teacher");
  }

  const resetCreateForm = useCallback(() => {
    setName("");
    setFaculty("");
    setTitle("");
    setShortInformation("");
    setBio("");
    setPositionSelect("");
    setPositionOther("");
    setDegreesSelected([]);
    setDegreeOther("");
    setDegreeOtherChecked(false);
    setPublications([]);
    setImageFile(null);
    setPreviewObjectUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccess(false);
    setError(null);
  }, [setPreviewObjectUrl]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validatePublicationsHaveYear(publications)) {
      window.alert(
        'Для кожної публікації з текстом потрібно вказати рік.\nПеревір поле "Публікації".'
      );
      return;
    }

    let imageUrl: string | null | undefined;
    try {
      imageUrl = await resolveImageUrlForSave();
    } catch {
      setError("Не вдалося завантажити зображення");
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      faculty,
      position: computedPosition,
      title,
      academicDegree: academicDegreeDisplay,
      shortInformation,
      bio,
      publications: previewPublications,
    };
    if (imageUrl !== undefined) {
      payload.imageUrl = imageUrl;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await apiPostAuthed("api/teachers", payload);
        setSuccess(true);
        resetCreateForm();
        navigate(ROUTES.adminTeachers);
      } else if (teacherId != null) {
        await apiPutAuthed(`api/teachers/${teacherId}`, payload);
        navigate(ROUTES.adminTeachers);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Помилка при збереженні викладача";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    if (mode === "create") {
      resetCreateForm();
    } else if (initialTeacher) {
      const positionsList = mergeUnique(positionOptions, [initialTeacher.position ?? ""]);
      const degreesList = mergeUnique(degreeOptions, []);
      initFromTeacher(initialTeacher, positionsList, degreesList);
      setError(null);
    }
  }

  const heading = mode === "create" ? "Створити викладача" : "Редагувати викладача";

  return (
    <div className="admin-teacher-editor">
      <h1>{heading}</h1>
      <form className="admin-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="admin-form-row">
          <label htmlFor="teacher-name">Ім&apos;я{mode === "create" ? "*" : ""}</label>
          <input
            id="teacher-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={mode === "create"}
            autoComplete="off"
          />
        </div>

        <div className="admin-form-row">
          <label htmlFor="teacher-faculty">Факультет</label>
          <input
            id="teacher-faculty"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            placeholder="Напр. Математичний факультет"
          />
        </div>

        <div className="admin-form-row">
          <label htmlFor="teacher-position">Посада</label>
          <select
            id="teacher-position"
            value={positionSelect}
            onChange={(e) => setPositionSelect(e.target.value)}
          >
            <option value="">- Немає -</option>
            {positionOptions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
            <option value="__other__">Інше (вказати)</option>
          </select>
        </div>

        {positionSelect === "__other__" ? (
          <div className="admin-form-row">
            <label htmlFor="teacher-position-other">Своя посада</label>
            <input
              id="teacher-position-other"
              value={positionOther}
              onChange={(e) => setPositionOther(e.target.value)}
              placeholder="Напр. Завідувач кафедри"
            />
          </div>
        ) : null}

        <div className="admin-form-row">
          <label htmlFor="teacher-title">Title (вчене звання/посада)</label>
          <input
            id="teacher-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Напр. доцент, професор"
          />
        </div>

        <p className="admin-label-bold">Науковий ступінь</p>
        <div className="admin-degrees">
          {degreeOptions.map((opt) => (
            <label key={opt} className="admin-degree-item">
              <span>{opt}</span>
              <input
                type="checkbox"
                checked={degreesSelected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) setDegreesSelected((s) => [...s, opt]);
                  else setDegreesSelected((s) => s.filter((x) => x !== opt));
                }}
              />
            </label>
          ))}
          <div className="admin-degree-item admin-degree-other">
            <span>Інший (вказати)</span>
            <input
              type="checkbox"
              checked={hasDegreeOther}
              onChange={(e) => {
                setDegreeOtherChecked(e.target.checked);
                if (!e.target.checked) setDegreeOther("");
              }}
            />
            {hasDegreeOther ? (
              <input
                value={degreeOther}
                onChange={(e) => setDegreeOther(e.target.value)}
                placeholder="Напр. д. юр. н."
                aria-label="Інший науковий ступінь"
              />
            ) : null}
          </div>
        </div>

        {mode === "edit" ? (
          <div className="admin-form-row">
            <span>Поточне фото</span>
            <img
              src={
                imagePreview ||
                (!imageCleared && savedImageUrl
                  ? savedImageUrl.startsWith("/")
                    ? savedImageUrl
                    : `/${savedImageUrl}`
                  : "/profile-icon.webp")
              }
              alt="Поточне фото"
              width={150}
              height={200}
            />
          </div>
        ) : null}

        <div className="admin-form-row">
          <span>{mode === "edit" ? "Нове фото (файл)" : "Фото викладача (файл)"}</span>
          <div className="admin-file-row">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} />
            {imageFile || imagePreview ? (
              <button type="button" className="admin-btn-secondary" onClick={clearImage}>
                Прибрати фото
              </button>
            ) : null}
          </div>
        </div>

        {imagePreview && mode === "create" ? (
          <div className="admin-image-preview">
            <p>Попередній перегляд фото:</p>
            <img src={imagePreview} alt="Попередній перегляд фото" width={150} height={200} />
          </div>
        ) : null}
        {imagePreview && mode === "edit" ? (
          <div className="admin-image-preview">
            <p>Попередній перегляд нового фото:</p>
            <img src={imagePreview} alt="Нове фото" width={150} height={200} />
          </div>
        ) : null}

        <div className="admin-form-row admin-description">
          <label htmlFor="teacher-short">Коротка інформація</label>
          <textarea id="teacher-short" rows={3} value={shortInformation} onChange={(e) => setShortInformation(e.target.value)} />
        </div>

        <div className="admin-form-row admin-description">
          <label htmlFor="teacher-bio">Біографія</label>
          <textarea id="teacher-bio" rows={6} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>

        <div className="admin-form-row">
          <h2 className="admin-h3">Публікації</h2>
          {publications.map((pub, i) => (
            <div key={i} className="admin-pub-row">
              <div>
                <label htmlFor={`pub-y-${i}`}>Рік</label>
                <input
                  id={`pub-y-${i}`}
                  type="number"
                  min={1900}
                  max={2100}
                  value={pub.year === "" ? "" : pub.year}
                  onChange={(e) => updatePublication(i, { year: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor={`pub-t-${i}`}>Опис</label>
                <textarea
                  id={`pub-t-${i}`}
                  rows={2}
                  value={pub.text}
                  onChange={(e) => updatePublication(i, { text: e.target.value })}
                />
              </div>
              <button type="button" className="admin-btn-secondary" onClick={() => removePublication(i)}>
                Видалити
              </button>
            </div>
          ))}
          <button type="button" className="admin-btn-secondary" onClick={addPublication}>
            Додати публікацію
          </button>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? "Збереження…" : "Зберегти"}
          </button>
          <button type="button" className="admin-btn-secondary" onClick={onCancel}>
            Скасувати
          </button>
        </div>

        {error ? (
          <p role="alert" className="admin-error">
            {error}
          </p>
        ) : null}
        {success && mode === "create" ? <p className="admin-success">Викладача створено</p> : null}
      </form>

      <TeacherPagePreview
        layout={layout}
        previewName={previewName}
        previewImageSrc={previewImageSrc}
        model={previewModel}
      />
    </div>
  );
}
