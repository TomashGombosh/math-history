import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

type RouteFallbackProps = { "aria-label"?: string };

/** Lazy route / session wait — replaces spinner for cold-start-friendly UX */
export function RouteFallbackSkeleton(props: RouteFallbackProps = {}) {
  const ariaLabel = props["aria-label"] ?? "Завантаження сторінки";
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="50vh"
      px={2}
    >
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 520 }}>
        <Skeleton variant="rounded" height={28} sx={{ maxWidth: 280 }} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={88} />
      </Stack>
    </Box>
  );
}

function CardGridSkeleton({ count, minHeight }: { count: number; minHeight: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 2,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rounded" sx={{ minHeight }} />
      ))}
    </Box>
  );
}

export function HomePageSectionsSkeleton() {
  return (
    <Stack spacing={4} sx={{ mt: 1 }} role="status" aria-busy="true" aria-label="Завантаження розділів">
      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Skeleton variant="text" width={160} height={36} />
          <Skeleton variant="rounded" width={140} height={28} />
        </Stack>
        <CardGridSkeleton count={8} minHeight={260} />
      </Box>
      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Skeleton variant="text" width={200} height={36} />
          <Skeleton variant="rounded" width={120} height={28} />
        </Stack>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} variant="rounded" width={140} height={100} />
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

export function TeachersGridSkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Завантаження списку викладачів">
      <CardGridSkeleton count={12} minHeight={260} />
    </Box>
  );
}

export function GraduatesYearsGridSkeleton() {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Завантаження років випуску"
      sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <Skeleton key={i} variant="rounded" width={140} height={100} />
      ))}
    </Box>
  );
}

export function TeacherDetailSkeleton() {
  return (
    <div className="teacher-page" role="status" aria-busy="true" aria-label="Завантаження профілю викладача">
      <div className="header">
        <Skeleton className="photo" variant="rounded" sx={{ width: 220, minHeight: 275, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="text" sx={{ fontSize: "2rem", mb: 1 }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="45%" />
        </Box>
      </div>
      {[1, 2].map((k) => (
        <Box key={k} className="section" sx={{ mb: 2.5 }}>
          <Skeleton variant="text" width={200} height={36} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={72} sx={{ mt: 0.5 }} />
        </Box>
      ))}
    </div>
  );
}

export function GraduatesYearNavSkeleton() {
  return (
    <Box className="years-table" role="presentation" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <Skeleton key={i} variant="rounded" width={48} height={28} />
      ))}
    </Box>
  );
}

export function GraduatesYearContentSkeleton() {
  return (
    <Box className="year-content" role="status" aria-busy="true" aria-label="Завантаження списку випускників">
      <Skeleton variant="text" sx={{ fontSize: "1.5rem", mb: 2, maxWidth: 420 }} />
      {[1, 2, 3].map((k) => (
        <Box key={k} sx={{ mt: 3 }}>
          <Skeleton variant="text" width="55%" height={32} sx={{ mb: 1 }} />
          <Stack spacing={0.5}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} variant="rounded" height={22} />
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
