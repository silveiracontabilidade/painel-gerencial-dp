import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Empresas from './pages/empresas';
import Grupos from './pages/grupos';
import Responsaveis from './pages/responsaveis';
import Servicos from './pages/servicos';
import AgendaBase from './pages/agenda';
import Login from './pages/login';
import RequireAuth from './components/RequireAuth';
import ServicosSolicitados from './pages/servicosSolicitados';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/empresas" replace />} />

        {/* Rota protegida + layout com Outlet */}
        <Route path="/" element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="empresas" element={<Empresas />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="grupos" element={<Grupos />} />
            <Route path="responsaveis" element={<Responsaveis />} />
            <Route path="agenda" element={<AgendaBase />} />
            <Route path="servicos-solicitados" element={<ServicosSolicitados />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
