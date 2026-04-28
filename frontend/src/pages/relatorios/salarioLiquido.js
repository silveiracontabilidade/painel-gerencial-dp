import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';
import './relatorios.css';

const colunasSalarioLiquido = [
  { chave: 'bdcodemp', label: 'Cód. Empresa', style: { width: '9%' } },
  { chave: 'codigo_funcionario', label: 'Cód. Funcionário', style: { width: '10%' } },
  { chave: 'nome_funcionario', label: 'Nome Funcionário', style: { width: '24%' } },
  { chave: 'codigo_centro_custo', label: 'Cód. Centro Custo', style: { width: '10%' } },
  { chave: 'nome_centro_custo', label: 'Nome Centro Custo', style: { width: '18%' } },
  { chave: 'salario_liquido', label: 'Salário Líquido', style: { width: '10%' } },
  { chave: 'valor_verba_953', label: 'Verba 953', style: { width: '7%' } },
  { chave: 'valor_verba_10005', label: 'Verba 10005', style: { width: '7%' } },
  { chave: 'valor_verbas_521_152', label: 'Verbas 521/152', style: { width: '8%' } },
];

const colunasTotais = [
  { chave: 'bdcodemp', label: 'Cód. Empresa', style: { width: '8%' } },
  { chave: 'nome_empresa', label: 'Empresa', style: { width: '20%' } },
  { chave: 'inss_total', label: 'INSS', style: { width: '8%' } },
  { chave: 'irrf_total', label: 'IRRF', style: { width: '8%' } },
  { chave: 'consignado_credito_trab', label: 'Consignado/Crédito', style: { width: '10%' } },
  { chave: 'contrib_sind_assist', label: 'Contrib. Sind/Assist', style: { width: '10%' } },
  { chave: 'convenio_farmacia', label: 'Convênio Farmácia', style: { width: '9%' } },
  { chave: 'fgts_org_8_salario_bruto', label: 'FGTS 8%', style: { width: '8%' } },
  { chave: 'unimed', label: 'Unimed', style: { width: '7%' } },
  { chave: 'uniodonto', label: 'Uniodonto', style: { width: '8%' } },
  { chave: 'vale_refeicao_swile', label: 'Vale Refeição/Swile', style: { width: '10%' } },
  { chave: 'seguro_vida_grupo', label: 'Seguro Vida', style: { width: '8%' } },
  { chave: 'transporte', label: 'Transporte', style: { width: '8%' } },
  { chave: 'auxilio_estudo_capacitacao_grad', label: 'Auxílio Estudo', style: { width: '9%' } },
  { chave: 'auxilio_home_office', label: 'Auxílio Home Office', style: { width: '10%' } },
  { chave: 'auxilio_creche', label: 'Auxílio Creche', style: { width: '9%' } },
];

const itensTotais = colunasTotais.filter((c) => !['bdcodemp', 'nome_empresa'].includes(c.chave));

const formatoCompetencia = (valor) => {
  if (!valor) return '';
  const apenasNum = valor.replace(/[^\d]/g, '').slice(0, 6);
  if (apenasNum.length < 6) return '';
  const ano = apenasNum.slice(0, 4);
  const mes = apenasNum.slice(4, 6);
  return `${ano}-${mes}`;
};

const toDisplayCompetencia = (valor) => {
  if (!valor) return '';
  const [ano, mes] = valor.split('-');
  return `${mes}/${ano}`;
};

const nomeAbaValido = (nome) => nome.replace(new RegExp('[\\\\/:*?\\[\\]]', 'g'), ' ').slice(0, 31);

const exportarXlsComAbas = (
  competenciaDisplay,
  dadosSalarioLiquido,
  dadosTotaisPivot,
  colunasTotaisPivot
) => {
  if (!dadosSalarioLiquido.length && !dadosTotaisPivot.length) return;

  const criarWorksheet = (dados, colunas) => {
    const header = colunas.map((c) => c.label);
    const rows = dados.map((linha) => colunas.map((col) => {
      const valor = linha[col.chave];
      return valor === null || valor === undefined ? '' : valor;
    }));
    return XLSX.utils.aoa_to_sheet([header, ...rows]);
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    criarWorksheet(dadosSalarioLiquido, colunasSalarioLiquido),
    nomeAbaValido('Salario Liquido')
  );
  XLSX.utils.book_append_sheet(
    wb,
    criarWorksheet(dadosTotaisPivot, colunasTotaisPivot),
    nomeAbaValido('Totais')
  );

  XLSX.writeFile(wb, `folha_silveira_${competenciaDisplay || 'competencia'}.xlsx`, { compression: true });
};

export default function RelatorioFolhaSilveira() {
  const [perfilUsuario, setPerfilUsuario] = useState('');
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  const [competencia, setCompetencia] = useState(() => {
    const hoje = new Date();
    let ano = hoje.getFullYear();
    let mes = hoje.getMonth();
    if (mes === 0) {
      ano -= 1;
      mes = 12;
    }
    const mesFormatado = String(mes).padStart(2, '0');
    return `${ano}-${mesFormatado}`;
  });

  const [abaAtiva, setAbaAtiva] = useState('salario_liquido');
  const [dadosSalarioLiquido, setDadosSalarioLiquido] = useState([]);
  const [dadosTotais, setDadosTotais] = useState([]);
  const [meta, setMeta] = useState({ competencia: '', total_salario: 0, total_totais: 0 });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const competenciaDisplay = useMemo(() => toDisplayCompetencia(competencia), [competencia]);
  const colunasTotaisPivot = useMemo(() => {
    const colunas = [{ chave: 'item', label: 'Item/Verba', style: { minWidth: '230px' } }];
    dadosTotais.forEach((empresa) => {
      const empKey = `emp_${empresa.bdcodemp}`;
      const empLabel = `${empresa.bdcodemp} - ${empresa.nome_empresa || ''}`.trim();
      colunas.push({ chave: empKey, label: empLabel, style: { minWidth: '170px' } });
    });
    return colunas;
  }, [dadosTotais]);

  const dadosTotaisPivot = useMemo(
    () => itensTotais.map((item) => {
      const linha = { item: item.label };
      dadosTotais.forEach((empresa) => {
        linha[`emp_${empresa.bdcodemp}`] = empresa[item.chave];
      });
      return linha;
    }),
    [dadosTotais]
  );

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const { data } = await api.get('/api/me/');
        setPerfilUsuario((data.perfil || '').toLowerCase());
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
        setPerfilUsuario('');
      } finally {
        setCarregandoPerfil(false);
      }
    };
    carregarPerfil();
  }, []);

  const carregarRelatorio = async () => {
    setCarregando(true);
    setErro('');
    try {
      const params = { competencia: competencia?.replace('-', '') };
      const [resSalario, resTotais] = await Promise.all([
        api.get('/api/relatorios/salario-liquido/', { params }),
        api.get('/api/relatorios/folha-silveira/totais/', { params }),
      ]);

      const listaSalario = resSalario.data.resultado || [];
      const listaTotais = resTotais.data.resultado || [];

      setDadosSalarioLiquido(listaSalario);
      setDadosTotais(listaTotais);
      setMeta({
        competencia: resSalario.data.competencia || resTotais.data.competencia || '',
        total_salario: resSalario.data.total ?? listaSalario.length,
        total_totais: resTotais.data.total ?? listaTotais.length,
      });
    } catch (err) {
      console.error('Erro ao carregar relatório Folha Silveira:', err);
      setErro('Não foi possível carregar o relatório.');
      setDadosSalarioLiquido([]);
      setDadosTotais([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (perfilUsuario === 'admin') {
      carregarRelatorio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia, perfilUsuario]);

  const handleCompetenciaChange = (valor) => {
    const normalizado = formatoCompetencia(valor);
    if (normalizado) {
      setCompetencia(normalizado);
    } else {
      setCompetencia('');
    }
  };

  if (carregandoPerfil) {
    return <div className="relatorio-container">Carregando...</div>;
  }

  if (perfilUsuario !== 'admin') {
    return <div className="relatorio-container">Acesso restrito a administradores.</div>;
  }

  const isSalario = abaAtiva === 'salario_liquido';
  const colunasAtuais = isSalario ? colunasSalarioLiquido : colunasTotaisPivot;
  const dadosAtuais = isSalario ? dadosSalarioLiquido : dadosTotaisPivot;
  const totalAtual = isSalario ? meta.total_salario : meta.total_totais;

  return (
    <div className="relatorio-container">
      <div className="relatorio-header">
        <div>
          <h2>Folha Silveira</h2>
          <p className="relatorio-descricao">Consulta por competência com abas de Salário Líquido e Totais por empresa.</p>
        </div>

        <div className="relatorio-acoes">
          <label>
            Competência:
            <input
              type="month"
              value={competencia}
              onChange={(e) => handleCompetenciaChange(e.target.value)}
            />
          </label>

          <button
            className="btn-primario"
            onClick={() => exportarXlsComAbas(
              competenciaDisplay,
              dadosSalarioLiquido,
              dadosTotaisPivot,
              colunasTotaisPivot
            )}
            disabled={!dadosSalarioLiquido.length && !dadosTotaisPivot.length}
          >
            Exportar XLS (2 abas)
          </button>
        </div>
      </div>

      <div className="relatorio-tabs">
        <button
          type="button"
          className={`relatorio-tab ${isSalario ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('salario_liquido')}
        >
          Salário Líquido
        </button>
        <button
          type="button"
          className={`relatorio-tab ${!isSalario ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('totais')}
        >
          Totais
        </button>
      </div>

      <div className="relatorio-meta">
        <span>Competência: {meta.competencia || competenciaDisplay || '-'}</span>
        <span>Total: {totalAtual ?? dadosAtuais.length}</span>
      </div>

      {erro && <div className="relatorio-erro">{erro}</div>}
      {carregando && <div className="relatorio-loading">Carregando...</div>}

      {!carregando && !erro && (
        <div className="relatorio-tabela-wrapper" style={!isSalario ? { overflowX: 'auto' } : undefined}>
          <table className="relatorio-tabela">
            <thead>
              <tr>
                {colunasAtuais.map((col) => (
                  <th key={col.chave} style={col.style || {}}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dadosAtuais.length === 0 ? (
                <tr>
                  <td colSpan={colunasAtuais.length} className="relatorio-vazio">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                dadosAtuais.map((linha, idx) => (
                  <tr key={`${linha.bdcodemp || idx}-${linha.codigo_funcionario || idx}-${idx}`}>
                    {colunasAtuais.map((col) => {
                      const valor = linha[col.chave];
                      return (
                        <td key={col.chave} style={col.style || {}}>
                          {valor === null || valor === undefined || valor === '' ? '' : String(valor)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
