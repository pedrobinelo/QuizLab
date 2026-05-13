/**
 * Remove o foco de um botão de fechar ativo dentro de um modal.
 * Isso previne que o botão permaneça focado após o modal ser fechado.
 * @param {HTMLElement} modalElement - O elemento do modal que está sendo fechado.
 */
function removeFocusFromCloseButton(modalElement) {
  const closeBtn = modalElement.querySelector(".close");
  if (closeBtn && document.activeElement === closeBtn) {
    closeBtn.blur();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Referências do formulário
  var form = document.getElementById("error-suggestion-form");
  var status = document.getElementById("form-status");

  // Referências do Quiz
  const quizCodeInput = document.getElementById("quizCode");
  const goToQuizButton = document.getElementById("goToQuizButton");

  /**
   * Lida com o envio do formulário de sugestão/erro de forma assíncrona.
   * @param {Event} event - O evento de submit do formulário.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);

    status.classList.add("mt-4");
    status.innerHTML = "Enviando...";

    try {
      const response = await fetch(event.target.action, {
        method: form.method,
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        status.innerHTML = "Enviado com sucesso ✅";
      } else {
        // Tenta extrair dados de erro do JSON da resposta
        const errorData = await response.json().catch(() => null);
        if (errorData && Object.hasOwn(errorData, "errors")) {
          status.innerHTML = errorData["errors"]
            .map((error) => error.message)
            .join(", ");
        } else {
          status.innerHTML = "Ocorreu um erro ❌!";
        }
      }
    } catch (error) {
      status.innerHTML = "Ocorreu um erro: " + error.message;
    } finally {
      // Limpa a mensagem de status após 5 segundos e reseta o formulário
      setTimeout(() => {
        status.classList.remove("mt-4");
        status.innerHTML = "";
      }, 5000);
      form.reset();
    }
  }
  
  // Listener do Formulário
  if (form) {
    form.addEventListener("submit", handleSubmit);
    // Preenche campos ocultos do formulário
    document.getElementById("error-url").value = window.location.href;
    document.getElementById("error-user-agent").value = navigator.userAgent;
  }

  // Listener genérico para abrir modais
  // Requer que os botões tenham: data-modal-target="#idDoModal"
  $(document).on("click", "[data-modal-target]", function () {
    const targetModal = $(this).data("modal-target");
    if (targetModal) {
      $(targetModal).modal("show");
    }
  });

  // Listener para o input do código do Quiz (Enter para enviar)
  if (quizCodeInput && goToQuizButton) {
    quizCodeInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        goToQuizButton.click();
      }
    });
  }

  // --- Listeners de Eventos dos Modais (Bootstrap) ---

  // Adiciona 'inert' quando certos modais são escondidos
  $("#reportErrorModal, #helpModal").on("hide.bs.modal", function () {
    this.setAttribute("inert", "");
  });

  // Remove 'inert' quando certos modais são mostrados
  $("#reportErrorModal, #helpModal").on("show.bs.modal", function () {
    this.removeAttribute("inert");
  });

  // Limpa o status do formulário especificamente ao fechar o modal de erro
  $("#reportErrorModal").on("hide.bs.modal", function () {
    status.innerHTML = "";
  });

  // Listener genérico para TODOS os modais ao serem fechados
  // Remove o foco do botão de fechar
  $(".modal").on("hide.bs.modal", function () {
    removeFocusFromCloseButton(this);
  });
});