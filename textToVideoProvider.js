class ProviderNotConfiguredError extends Error {
  constructor() {
    super("A geração Texto → vídeo ainda não está ligada a um fornecedor de IA. A base do projecto está preparada para integrar um serviço externo com chave API no servidor.");
    this.status = 501;
  }
}

async function generateFromText(_input) {
  // Integration point: connect a real provider here after choosing its official API.
  // Keep provider credentials on the server; never expose them in the React app.
  throw new ProviderNotConfiguredError();
}

module.exports = { generateFromText };
