/**
 * Enrutado raíz de la aplicación — GS AUTOBAT
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import NuevoAlbaranPage from '@/pages/NuevoAlbaranPage';
import AlbaranesListPage from '@/pages/AlbaranesListPage';
import AlbaranDetailPage from '@/pages/AlbaranDetailPage';
import CallCenterPage from '@/pages/CallCenterPage';
import UsuariosPage from '@/pages/admin/UsuariosPage';
import ClientesPage from '@/pages/admin/ClientesPage';
import TalleresPage from '@/pages/admin/TalleresPage';
import DelegacionesPage from '@/pages/admin/DelegacionesPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/albaranes/nuevo" element={<NuevoAlbaranPage />} />
          <Route path="/albaranes" element={<AlbaranesListPage />} />
          <Route path="/albaranes/:id" element={<AlbaranDetailPage />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route path="/admin/delegaciones" element={<DelegacionesPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin', 'oficina']} />}>
            <Route path="/call-center" element={<CallCenterPage />} />
            <Route path="/admin/clientes" element={<ClientesPage />} />
            <Route path="/admin/talleres" element={<TalleresPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
