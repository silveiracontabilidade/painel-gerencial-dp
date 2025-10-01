
export const paraBR = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`; // DD/MM/YYYY
};


// utils/datas.js
export const paraISO = (valor) => {
  if (!valor) return null;
  const clean = valor.replace(/[^\d]/g, ""); // remove tudo que não for número
  if (clean.length !== 8) return null;

  // tenta detectar se está vindo DDMMYYYY ou YYYYMMDD
  const dia = clean.slice(0, 2);
  const mes = clean.slice(2, 4);
  const ano = clean.slice(4);

  // se já estiver no formato ISO, retorna direto
  if (valor.includes("-") && valor.indexOf("-") === 4) {
    return valor; // já está YYYY-MM-DD
  }

  return `${ano}-${mes}-${dia}`;
};
