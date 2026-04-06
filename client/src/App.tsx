import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { appRoutes } from "./router/routes";

function App() {
  const element = useRoutes(appRoutes);
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress aria-label="Завантаження сторінки" />
        </Box>
      }
    >
      {element}
    </Suspense>
  );
}

export default App;
