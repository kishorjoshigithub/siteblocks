import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Projects from "./pages/Projects";
import MyProjects from "./pages/MyProjects";
import Preview from "./pages/Preview";
import Community from "./pages/Community";
import View from "./pages/View";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import AuthPage from "./pages/auth/AuthPage";
import Settings from "./pages/Settings";
import Loading from "./pages/Loading";

const App = () => {
  const { pathname } = useLocation();
  const hideNavbar =
    (pathname.startsWith("/project") && pathname !== "/projects") ||
    pathname.startsWith("/view/") ||
    pathname.startsWith("/preview/");
  return (
    <div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            color: "#111827",
            fontFamily: "Poppins",
            fontSize: "14px",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
          },
        }}
      />

      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/project/:projectId" element={<Projects />} />
        <Route path="/projects" element={<MyProjects />} />
        <Route path="/account/settings" element={<Settings />} />
        <Route path="/preview/:projectId" element={<Preview />} />
        <Route path="/preview/:projectId/:versionId" element={<Preview />} />
        <Route path="/community" element={<Community />} />
        <Route path="/view/:projectId" element={<View />} />
        <Route path="/auth/:pathname" element={<AuthPage />} />
        <Route path="/loading" element={<Loading />} />
      </Routes>
    </div>
  );
};

export default App;
