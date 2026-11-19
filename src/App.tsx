import { useEffect } from "react";
import { AnakSedunia } from "./pages/AnakSedunia";
import { Legal } from "./pages/Landing";
import { IntroLanding } from "./pages/IntroLanding";
import { StudioV2 } from "./pages/StudioV2";
import { StudioGateway } from "./pages/StudioGateway";
import { McpConsent } from "./pages/McpConsent";
import { StudioV2Canvas } from "./pages/StudioV2Canvas";
import { BusinessPortal } from "./pages/BusinessPortal";
import { BusinessMagicAccess } from "./pages/BusinessMagicAccess";
import { BusinessAdmin } from "./pages/BusinessAdmin";
import { BusinessVisualStudio } from "./pages/BusinessVisualStudio";
import { ClientForm } from "./pages/ClientForm";
import { StaticSite } from "./pages/StaticSite";
import { DoctorSite } from "./pages/DoctorSite";
import { ChibiSite } from "./pages/ChibiSite";
import { WeddingSite } from "./pages/WeddingSite";
import { Wedding2Demo } from "./pages/Wedding2Site";
import { CoachNovalClone } from "./pages/CoachNovalClone";
import { ThemeDemo, ThemeGallery } from "./pages/ThemeDemos";
import { getDemoTheme } from "./themes/catalog";
import "./namana.css";

function Redirect({ to }: { to: string }) {
  useEffect(() => { location.replace(to); }, [to]);
  return <p role="status">Membuka {to}…</p>;
}

function App() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const demoTheme = getDemoTheme(path.slice(1));
  let page;
  if (path === "/") page = <IntroLanding />;
  else if (path === "/anaksedunia") page = <AnakSedunia />;
  else if (path === "/dokter") page = <DoctorSite />;
  else if (path === "/chibi") page = <ChibiSite />;
  else if (path === "/wedding") page = <WeddingSite />;
  else if (path === "/wedding2") page = <Wedding2Demo />;
  else if (path === "/kloning") page = <CoachNovalClone />;
  else if (path === "/formulir") page = <ClientForm />;
  else if (["/mitra","/daftar"].includes(path)) page = <BusinessPortal />;
  else if (path === "/akses") page = <BusinessMagicAccess />;
  else if (path === "/mitra/studio") page = <BusinessVisualStudio />;
  else if (path === "/mitra/admin" || path === "/studio/admin") page = <BusinessAdmin />;
  // The Visual Studio is the only supported editor. Legacy V1 URLs return to it.
  else if (path === "/studio/oauth") page = <McpConsent />;
  else if (path === "/studio") page = <StudioGateway />;
  else if (path === "/studio-v2") page = <StudioV2 />;
  else if (path === "/studio-v1" || path === "/generator") page = <Redirect to="/studio" />;
  else if (path === "/studio-v2-canvas") page = <StudioV2Canvas />;
  else if (path === "/gaya" || path === "/templates") page = <ThemeGallery />;
  else if (demoTheme) page = <ThemeDemo theme={demoTheme} />;
  else if (["/login", "/auth", "/dashboard", "/admin"].includes(path))
    page = <Redirect to="/studio" />;
  else if (path === "/demo") page = <Redirect to="/vini" />;
  else if (path === "/privacy" || path === "/terms")
    page = <Legal terms={path === "/terms"} />;
  else page = <StaticSite slug={path.slice(1)} />;
  return page;
}

export default App;
