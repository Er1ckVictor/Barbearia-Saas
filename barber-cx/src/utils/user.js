// Utilitários para exibir os dados do usuário logado

// Primeiro nome, com fallback para a parte antes do @ do email
export function primeiroNome(nome, email) {
  if (nome && nome.trim()) return nome.trim().split(/\s+/)[0];
  return email ? email.split("@")[0] : "Conta";
}

// Máscara de telefone brasileiro: (11) 91234-5678
export function mascaraTelefone(valor) {
  const n = String(valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

// Iniciais para o avatar (ex: "Maria Souza" vira "MS")
export function iniciais(nome, email) {
  const partes = nome && nome.trim() ? nome.trim().split(/\s+/) : [email ? email[0] : "?"];
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}
