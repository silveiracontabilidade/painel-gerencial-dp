// utils/datas.js
export const paraISO = (br) => {
  if (!br) return null;
  const sep = br.includes('/') ? '/' : '-';
  const [dia, mes, ano] = br.split(sep);
  return `${ano}-${mes}-${dia}`;
};


export const paraBR = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`; // DD/MM/YYYY
};