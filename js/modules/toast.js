/**
 * Função principal para exibir uma notificação "Toast".
 * Substitui o `alert()` de forma elegante e não-bloqueante.
 *
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='info'] - O tipo de notificação ('success', 'error', 'info').
 * @param {number} [duration=5000] - Duração em milissegundos para o toast ficar visível.
 */
function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10); 

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, duration);
}
