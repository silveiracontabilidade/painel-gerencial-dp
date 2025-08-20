// ServicosSolicitados.js
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import ServicoSolicitadoFormModal from './servicoSolicitadoFormModal';
import './servicos-solicitados.css';

export default function ServicosSolicitados() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const carregarSolicitacoes = async () => {
    const res = await api.get('/api/solicitacoes/');
    setSolicitacoes(res.data.results || res.data);
  };

  const abrirModal = (solicitacao = null) => {
    setSolicitacaoSelecionada(solicitacao);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setSolicitacaoSelecionada(null);
    carregarSolicitacoes();
  };

  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/solicitacoes/${id}/`);
      carregarSolicitacoes();
    }
  };

  return (
    <div className="servicos-container">
      <div className="servicos-header">
        <h2>Serviços Solicitados</h2>
        <button onClick={() => abrirModal()} title="Novo Serviço">
          <Plus size={18} /> Novo
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Serviço</th>
            <th>Competência</th>
            <th>Solicitação</th>
            <th>Vencimento</th>
            <th>Conclusão</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {solicitacoes.map((s) => (
            <tr key={s.id}>
              <td>{s.empresa_razao_social}</td>
              <td>{s.servico_nome}</td>
              <td>{s.competencia}</td>
              <td>{s.data_solicitacao}</td>
              <td>{s.data_vencimento || '-'}</td>
              <td>{s.data_conclusao || '-'}</td>
              <td className="acoes">
                <button onClick={() => abrirModal(s)}><Pencil size={16} /></button>
                <button onClick={() => excluir(s.id)}><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAberto && (
        <ServicoSolicitadoFormModal
          dados={solicitacaoSelecionada}
          fechar={fecharModal}
        />
      )}
    </div>
  );
}
