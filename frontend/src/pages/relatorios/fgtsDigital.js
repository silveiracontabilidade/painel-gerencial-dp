import React, { useEffect, useState } from 'react';
import RelatorioBase from './RelatorioBase';
import api from '../../api/axios';

const colunas = [
  { chave: 'cod_folha', label: 'Cód. Empresa', style: { width: '12%' } },
  { chave: 'razao_social', label: 'Nome', style: { width: '26%' } },
  { chave: 'cnpj', label: 'CNPJ', style: { width: '14%' } },
  { chave: 'status_do_cliente', label: 'Status', style: { width: '10%' } },
  { chave: 'sistema', label: 'Sistema', style: { width: '10%' } },
  { chave: 'grupo', label: 'Grupo', style: { width: '10%' } },
  { chave: 'resp_dp', label: 'Responsável', style: { width: '12%' } },
  { chave: 'matriz', label: 'Matriz', style: { width: '6%' } },
];

export default function RelatorioFGTSDigital() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resResp, resGrupos] = await Promise.all([
          api.get('/api/responsaveis/', { params: { page_size: 500 } }),
          api.get('/api/grupos/'),
        ]);
        const respLista = (resResp.data.results || resResp.data || []).map((r) => ({
          value: r.nome,
          label: r.nome,
        }));
        const gruposLista = (resGrupos.data.results || resGrupos.data || []).map((g) => ({
          value: g.nome,
          label: g.nome,
        }));
        setResponsaveis(respLista);
        setGrupos(gruposLista);
      } catch (err) {
        console.error('Erro ao carregar filtros de relatório:', err);
      }
    };
    carregar();
  }, []);

  return (
    <RelatorioBase
      titulo="Relatório FGTS Digital"
      descricao="Empresas elegíveis para FGTS Digital conforme filtros padrão."
      endpoint="/api/relatorios/fgts-digital/"
      colunas={colunas}
      nomeArquivo="relatorio_fgts_digital"
      mostrarCompetencia={false}
      filtros={[
        { chave: 'responsavel', label: 'Responsável', opcoes: responsaveis },
        { chave: 'grupo', label: 'Grupo', opcoes: grupos },
      ]}
    />
  );
}
