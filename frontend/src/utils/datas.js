
export const paraBR = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`; // DD/MM/YYYY
};


// utils/datas.js
export const paraISO = (valor) => {
  if (!valor) return null;

  const somenteDigitos = valor.replace(/[^\d]/g, '');
  if (somenteDigitos.length !== 8) {
    return null;
  }

  let dia;
  let mes;
  let ano;

  const possuiSeparador = valor.includes('-') || valor.includes('/');
  if (possuiSeparador) {
    const separador = valor.includes('-') ? '-' : '/';
    const partes = valor.split(separador).map((parte) => parte.trim());
    if (partes.length !== 3) {
      return null;
    }
    if (partes[0].length === 4) {
      // já no padrão ISO YYYY-MM-DD
      [ano, mes, dia] = partes;
    } else {
      [dia, mes, ano] = partes;
    }
  } else {
    dia = somenteDigitos.slice(0, 2);
    mes = somenteDigitos.slice(2, 4);
    ano = somenteDigitos.slice(4);
  }

  const diaNum = Number(dia);
  const mesNum = Number(mes);
  const anoNum = Number(ano);

  if (
    Number.isNaN(diaNum) ||
    Number.isNaN(mesNum) ||
    Number.isNaN(anoNum) ||
    diaNum < 1 ||
    mesNum < 1 ||
    mesNum > 12 ||
    anoNum < 1900
  ) {
    return null;
  }

  const data = new Date(anoNum, mesNum - 1, diaNum);
  if (
    data.getFullYear() !== anoNum ||
    data.getMonth() + 1 !== mesNum ||
    data.getDate() !== diaNum
  ) {
    return null;
  }

  const diaPad = String(diaNum).padStart(2, '0');
  const mesPad = String(mesNum).padStart(2, '0');
  const anoPad = String(anoNum).padStart(4, '0');
  return `${anoPad}-${mesPad}-${diaPad}`;
};
