import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import './App.css';
import Dashboard from './pages/dashboard';
import Empresas from './pages/empresas';
import Grupos from './pages/grupos';
import Responsaveis from './pages/responsaveis';
import Servicos from './pages/servicos';
import AgendaBase from './pages/agenda';
import Periodos from './pages/periodos';
import Sistemas from './pages/sistemas';
import Login from './pages/login';
import RequireAuth from './components/RequireAuth';
import ServicosSolicitados from './pages/servicosSolicitados';
import MotivosRescisao from './pages/motivosRescisao';
import MotivosTermino from './pages/motivosTermino';
import TiposAdmissao from './pages/tiposAdmissao';
import Entregaveis from './pages/entregaveis';
import RelatorioDCTFWEB from './pages/relatorios/dctfweb';
import RelatorioFGTSDigital from './pages/relatorios/fgtsDigital';
import Feriados from './pages/feriados';

function App() {
  const isUat = (process.env.REACT_APP_ENV || '').toUpperCase() === 'UAT';

  useEffect(() => {
    const root = document.documentElement;
    if (isUat) {
      root.style.setProperty('--env-banner-offset', '40px');
    } else {
      root.style.removeProperty('--env-banner-offset');
    }

    return () => {
      root.style.removeProperty('--env-banner-offset');
    };
  }, [isUat]);

  return (
    <BrowserRouter>
      {isUat && (
        <div className="env-banner env-banner--uat">
          ⚠️ Ambiente Homologação (UAT)
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rota protegida + layout com Outlet */}
        <Route path="/" element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="grupos" element={<Grupos />} />
            <Route path="responsaveis" element={<Responsaveis />} />
            <Route path="sistemas" element={<Sistemas />} />
            <Route path="periodos" element={<Periodos />} />
            <Route path="agenda" element={<AgendaBase />} />
            <Route path="servicos-solicitados" element={<ServicosSolicitados />} />
            <Route path="motivos-rescisao" element={<MotivosRescisao />} />
            <Route path="motivos-termino" element={<MotivosTermino />} />
            <Route path="tipos-admissao" element={<TiposAdmissao />} />
            <Route path="entregaveis" element={<Entregaveis />} />
            <Route path="relatorios/dctfweb" element={<RelatorioDCTFWEB />} />
            <Route path="relatorios/fgts-digital" element={<RelatorioFGTSDigital />} />
            <Route path="feriados" element={<Feriados />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
