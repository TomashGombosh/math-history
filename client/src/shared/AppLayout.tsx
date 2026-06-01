import { Outlet } from "react-router-dom";
import { MainHeader } from "./MainHeader";
import { MainFooter } from "./MainFooter";
import "./AppLayout.css";

export function AppLayout() {
  return (
    <div className="app">
      <MainHeader />
      <main className="content">
        <Outlet />
      </main>
      <MainFooter />
    </div>
  );
}
