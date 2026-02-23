import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { ConsultationsPage } from "./pages/ConsultationsPage";
import { ConsultationActivePage } from "./pages/ConsultationActivePage";
import { PatientsPage } from "./pages/PatientsPage";
import { PatientDetailPage } from "./pages/PatientDetailPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { SearchPage } from "./pages/SearchPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/consultations" element={<ConsultationsPage />} />
        <Route path="/consultations/:id" element={<ConsultationActivePage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
