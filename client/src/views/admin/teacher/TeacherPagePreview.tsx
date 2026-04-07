import type { LayoutConfig } from "../../../admin/teacherLayout";

const DEFAULT_AVATAR = "/profile-icon.webp";

export type TeacherPreviewModel = {
  name: string;
  faculty: string;
  title: string;
  academicDegreeDisplay: string;
  position: string;
  shortInformation: string;
  bio: string;
  publications: Array<{ index: number; year: number | null; text: string }>;
};

type Props = {
  layout: LayoutConfig;
  previewName: string;
  previewImageSrc: string;
  model: TeacherPreviewModel;
};

export function TeacherPagePreview({ layout, previewName, previewImageSrc, model }: Props) {
  const headerFields = layout.headerFields.filter((f) => f.visible);

  function hasHeaderValue(id: string): boolean {
    if (id === "title") return Boolean(model.title);
    if (id === "academicDegree") return Boolean(model.academicDegreeDisplay);
    if (id === "position") return Boolean(model.position);
    if (id === "faculty") return Boolean(model.faculty);
    return false;
  }

  function getHeaderValue(id: string): string {
    if (id === "title") return model.title;
    if (id === "academicDegree") return model.academicDegreeDisplay;
    if (id === "position") return model.position;
    if (id === "faculty") return model.faculty;
    return "";
  }

  const sections = layout.sections.filter((s) => s.visible);

  function hasSectionContent(id: string): boolean {
    if (id === "shortInformation") return Boolean(model.shortInformation);
    if (id === "bio") return Boolean(model.bio);
    if (id === "publications") return model.publications.length > 0;
    return false;
  }

  return (
    <div className="admin-teacher-preview">
      <hr className="admin-divider" />
      <h2>Попередній перегляд сторінки викладача</h2>
      <div className="admin-teacher-header">
        <div className="admin-teacher-photo">
          <img src={previewImageSrc || DEFAULT_AVATAR} alt={previewName} width={160} height={210} />
        </div>
        <div>
          <h3>{previewName}</h3>
          {headerFields.map((field) =>
            hasHeaderValue(field.id) ? <p key={field.id}>{getHeaderValue(field.id)}</p> : null
          )}
        </div>
      </div>
      {sections.map((sec) => {
        if (!hasSectionContent(sec.id)) return null;
        return (
          <section key={sec.id}>
            <h3>{sec.title}</h3>
            {sec.id === "shortInformation" ? <p>{model.shortInformation}</p> : null}
            {sec.id === "bio" ? <p>{model.bio}</p> : null}
            {sec.id === "publications" ? (
              <ol>
                {model.publications.map((pub) => (
                  <li key={pub.index}>
                    {pub.year != null ? <span>({pub.year}) </span> : null}
                    {pub.text}
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
