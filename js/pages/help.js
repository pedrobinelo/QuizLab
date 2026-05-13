document.addEventListener("DOMContentLoaded", function () {
  $(document).on("click", "#helpBtn", function () {
    $("#helpModal").modal("show");
  });

  $("#helpModal").on("show.bs.modal", function () {
    this.removeAttribute("inert");
  });

  $("#helpModal").on("hide.bs.modal", function () {
    this.setAttribute("inert", "");
    status.innerHTML = "";
  });

  // Remover foco do botão de fechar ao fechar modais
  $("#helpModal").on("hide.bs.modal", function () {
    const closeBtn = this.querySelector(".close");
    if (closeBtn && document.activeElement === closeBtn) {
      closeBtn.blur();
    }
  });
});
