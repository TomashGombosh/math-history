import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { RouteFallbackSkeleton } from "./components/skeletons/PageSkeletons";
import { appRoutes } from "./router/routes";

function App() {
  const element = useRoutes(appRoutes);
  return (
    <Suspense fallback={<RouteFallbackSkeleton />}>
      {element}
    </Suspense>
  );
}

export default App;
