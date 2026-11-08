import { createRoot } from "react-dom/client";
import { DemoWorkbench } from "@/components/demo/workbench";

const root = document.getElementById("root");
if (root) createRoot(root).render(<DemoWorkbench live />);
