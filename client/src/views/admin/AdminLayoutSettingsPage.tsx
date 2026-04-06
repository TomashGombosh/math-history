import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import { apiGetAuthed, apiPutAuthed } from "../../services/api";
import { normalizeLayout, type LayoutConfig, type LayoutHeaderField, type LayoutSection } from "../../admin/teacherLayout";
import "./AdminPages.css";

function exampleHeaderValue(id: string): string {
  if (id === "title") return "доцент, професор";
  if (id === "academicDegree") return "к. ф.-м. н.";
  if (id === "position") return "Доцент кафедри";
  if (id === "faculty") return "Математичний факультет";
  return "";
}

export default function AdminLayoutSettingsPage() {
  const [config, setConfig] = useState<LayoutConfig>(() => normalizeLayout({}));
  const [original, setOriginal] = useState<LayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragHeaderRef = useRef<number | null>(null);
  const dragSectionRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGetAuthed<unknown>("api/layout");
        if (cancelled) return;
        const norm = normalizeLayout(data);
        setConfig(norm);
        setOriginal(JSON.parse(JSON.stringify(norm)) as LayoutConfig);
      } catch {
        if (!cancelled) setError("Не вдалося завантажити налаштування");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function moveHeader(from: number, to: number) {
    setConfig((c) => {
      const next = { ...c, headerFields: [...c.headerFields] };
      const [row] = next.headerFields.splice(from, 1);
      next.headerFields.splice(to, 0, row);
      next.headerFields = next.headerFields.map((h, i) => ({ ...h, order: i + 1 }));
      return next;
    });
  }

  function moveSection(from: number, to: number) {
    setConfig((c) => {
      const next = { ...c, sections: [...c.sections] };
      const [row] = next.sections.splice(from, 1);
      next.sections.splice(to, 0, row);
      next.sections = next.sections.map((s, i) => ({ ...s, order: i + 1 }));
      return next;
    });
  }

  function toggleHeaderVisible(i: number) {
    setConfig((c) => {
      const headerFields = c.headerFields.map((h, idx) =>
        idx === i ? { ...h, visible: !h.visible } : h
      );
      return { ...c, headerFields };
    });
  }

  function toggleSectionVisible(i: number) {
    setConfig((c) => {
      const sections = c.sections.map((s, idx) =>
        idx === i ? { ...s, visible: !s.visible } : s
      );
      return { ...c, sections };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPutAuthed("api/layout", config);
      setOriginal(JSON.parse(JSON.stringify(config)) as LayoutConfig);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (original) setConfig(JSON.parse(JSON.stringify(original)) as LayoutConfig);
    setError(null);
  }

  const previewHeaderFields = config.headerFields.filter((f) => f.visible);
  const previewSections = config.sections.filter((s) => s.visible);

  if (loading) {
    return <p role="status">Завантаження…</p>;
  }

  return (
    <div className="admin-layout-settings">
      <h1>Налаштування сторінки викладача</h1>

      <div className="admin-layout-grid">
        <div>
          <section>
            <h2>Поля в шапці (під імʼям)</h2>
            <p className="admin-hint">Перетягни, щоб змінити порядок. Око — показати / сховати.</p>
            <ul className="admin-layout-list">
              {config.headerFields.map((field: LayoutHeaderField, index: number) => (
                <li
                  key={field.id}
                  className="admin-layout-row"
                  draggable
                  onDragStart={() => {
                    dragHeaderRef.current = index;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragHeaderRef.current;
                    dragHeaderRef.current = null;
                    if (from == null || from === index) return;
                    moveHeader(from, index);
                  }}
                >
                  <span aria-hidden>↕</span>
                  <span>{field.label}</span>
                  <button type="button" onClick={() => toggleHeaderVisible(index)} aria-pressed={field.visible}>
                    {field.visible ? "Сховати" : "Показати"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-layout-section-gap">
            <h2>Порядок і видимість розділів</h2>
            <p className="admin-hint">
              Так само перетягни, щоб змінити порядок розділів. Око — показати / сховати розділ у всіх викладачів.
            </p>
            <ul className="admin-layout-list">
              {config.sections.map((sec: LayoutSection, index: number) => (
                <li
                  key={sec.id}
                  className="admin-layout-row"
                  draggable
                  onDragStart={() => {
                    dragSectionRef.current = index;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragSectionRef.current;
                    dragSectionRef.current = null;
                    if (from == null || from === index) return;
                    moveSection(from, index);
                  }}
                >
                  <span aria-hidden>↕</span>
                  <span>{sec.title}</span>
                  <button type="button" onClick={() => toggleSectionVisible(index)} aria-pressed={sec.visible}>
                    {sec.visible ? "Сховати" : "Показати"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="admin-form-actions">
            <button type="button" className="admin-btn-primary" onClick={() => void save()} disabled={saving}>
              {saving ? "Збереження..." : "Зберегти налаштування"}
            </button>
            <button type="button" className="admin-btn-secondary" onClick={cancel} disabled={saving}>
              Скасувати
            </button>
          </div>
          {error ? (
            <p role="alert" className="admin-error">
              {error}
            </p>
          ) : null}
        </div>

        <div>
          <h2>Превʼю сторінки викладача</h2>
          <div className="admin-teacher-preview admin-teacher-preview--compact">
            <div className="admin-teacher-header">
              <div className="admin-teacher-photo admin-photo-placeholder">Фото</div>
              <div>
                <h3>Імʼя викладача</h3>
                {previewHeaderFields.map((field) => (
                  <p key={field.id}>{exampleHeaderValue(field.id)}</p>
                ))}
              </div>
            </div>
            {previewSections.map((sec) => (
              <section key={sec.id}>
                <h3>{sec.title}</h3>
                {sec.id === "shortInformation" ? <p>Коротка інформація про викладача...</p> : null}
                {sec.id === "bio" ? <p>Біографія викладача...</p> : null}
                {sec.id === "publications" ? (
                  <ol>
                    <li>(2010) Приклад публікації...</li>
                    <li>(2015) Ще одна публікація...</li>
                  </ol>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
