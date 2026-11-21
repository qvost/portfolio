import { createRoot } from "react-dom/client";
import DeadspacePage from "../components/ui/deadspace-page";
import "./global.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("Portfolio mount point is missing.");
createRoot(mount).render(
  <DeadspacePage
    initialPath={window.location.pathname}
    assetBase={import.meta.env.VITE_ASSET_BASE || undefined}
  />,
);
