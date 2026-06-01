/**
 * Quicklist – script.js
 * Gerenciamento da lista de compras da semana
 */

/* ====================================================
   Dados iniciais
   ==================================================== */
const itensIniciais = [
  { id: gerarId(), nome: "Pão de forma", concluido: false },
  { id: gerarId(), nome: "Café preto", concluido: false },
  { id: gerarId(), nome: "Suco de laranja", concluido: false },
  { id: gerarId(), nome: "Bolacha", concluido: false },
];

/* ====================================================
   Estado da aplicação
   ==================================================== */
let itens = [...itensIniciais];
let toastTimer = null;

/* ====================================================
   Referências ao DOM
   ==================================================== */
const lista = document.getElementById("lista-compras");
const form = document.getElementById("form-adicionar");
const inputItem = document.getElementById("input-item");
const btnVoltar = document.getElementById("btn-voltar");
const msgErro = document.getElementById("msg-erro");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toast-msg");
const btnFecharToast = document.getElementById("btn-fechar-toast");

/* ====================================================
   Utilitários
   ==================================================== */

/** Gera um ID simples único */
function gerarId() {
  return "_" + Math.random().toString(36).slice(2, 11);
}

/** Escapa caracteres HTML para evitar XSS */
function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/* ====================================================
   Renderização
   ==================================================== */

/** Cria e retorna o elemento <li> para um item */
function criarElementoItem(item) {
  const li = document.createElement("li");
  li.classList.add("list-item");
  if (item.concluido) li.classList.add("done");
  li.dataset.id = item.id;

  li.innerHTML = `
    <label class="item-checkbox" aria-label="Marcar ${escaparHtml(item.nome)} como concluído">
      <input
        type="checkbox"
        id="check-${item.id}"
        ${item.concluido ? "checked" : ""}
        aria-checked="${item.concluido}"
      />
      <span class="checkbox-visual" aria-hidden="true"></span>
    </label>

    <span class="item-label" id="label-${item.id}">${escaparHtml(item.nome)}</span>

    <button
      class="btn-delete"
      type="button"
      aria-label="Remover ${escaparHtml(item.nome)}"
      data-id="${item.id}"
    >
      <!-- Trash icon -->
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v5M14 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  /* Evento: checkbox */
  const checkbox = li.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", () => alternarConcluido(item.id, li, checkbox));

  /* Evento: botão remover */
  const btnDel = li.querySelector(".btn-delete");
  btnDel.addEventListener("click", () => removerItem(item.id, li, item.nome));

  return li;
}

/** Renderiza toda a lista do zero */
function renderizarLista() {
  lista.innerHTML = "";

  if (itens.length === 0) {
    lista.innerHTML = `
      <li class="empty-state" aria-live="polite">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="8" y="8" width="32" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M16 18h16M16 24h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>Nenhum item na lista ainda.<br/>Adicione um item acima!</p>
      </li>`;
    return;
  }

  itens.forEach((item) => {
    lista.appendChild(criarElementoItem(item));
  });
}

/* ====================================================
   Ações
   ==================================================== */

/** Adiciona um novo item à lista */
function adicionarItem(nome) {
  const novoItem = { id: gerarId(), nome: nome.trim(), concluido: false };
  itens.push(novoItem);

  // Se estava no estado vazio, re-renderiza completo; senão só anexa
  if (itens.length === 1) {
    renderizarLista();
  } else {
    const li = criarElementoItem(novoItem);
    lista.appendChild(li);
  }
}

/** Alterna o estado concluído de um item */
function alternarConcluido(id, li, checkbox) {
  const item = itens.find((i) => i.id === id);
  if (!item) return;

  item.concluido = checkbox.checked;
  checkbox.setAttribute("aria-checked", item.concluido);

  if (item.concluido) {
    li.classList.add("done");
  } else {
    li.classList.remove("done");
  }
}

/** Remove um item da lista com animação */
function removerItem(id, li, nome) {
  // Anima saída
  li.classList.add("removing");

  li.addEventListener(
    "animationend",
    () => {
      itens = itens.filter((i) => i.id !== id);
      li.remove();

      // Mostra estado vazio se necessário
      if (itens.length === 0) {
        renderizarLista();
      }

      exibirToast(`"${nome}" foi removido da lista`);
    },
    { once: true }
  );
}

/* ====================================================
   Toast
   ==================================================== */

function exibirToast(mensagem) {
  toastMsg.textContent = mensagem;
  toast.classList.add("visible");

  // Cancela timer anterior, se existir
  if (toastTimer) clearTimeout(toastTimer);

  // Fecha automaticamente após 4 s
  toastTimer = setTimeout(fecharToast, 4000);
}

function fecharToast() {
  toast.classList.remove("visible");
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

/* ====================================================
   Validação do input
   ==================================================== */

function limparErro() {
  msgErro.textContent = "";
  inputItem.classList.remove("input-error");
}

function exibirErro(mensagem) {
  msgErro.textContent = mensagem;
  inputItem.classList.add("input-error");
  inputItem.focus();
}

/* ====================================================
   Eventos
   ==================================================== */

/** Submissão do formulário */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const valor = inputItem.value.trim();

  if (!valor) {
    exibirErro("Por favor, digite o nome do item antes de adicionar.");
    return;
  }

  // Verifica duplicata (case-insensitive)
  const duplicado = itens.some(
    (i) => i.nome.toLowerCase() === valor.toLowerCase()
  );
  if (duplicado) {
    exibirErro(`"${valor}" já está na lista.`);
    return;
  }

  limparErro();
  adicionarItem(valor);
  inputItem.value = "";
  inputItem.focus();
});

/** Limpa erro enquanto o usuário digita */
inputItem.addEventListener("input", () => {
  if (msgErro.textContent) limparErro();
});

/** Botão Voltar */
btnVoltar.addEventListener("click", () => {
  window.history.back();
});

/** Fechar toast manualmente */
btnFecharToast.addEventListener("click", fecharToast);

/* ====================================================
   Inicialização
   ==================================================== */
renderizarLista();
