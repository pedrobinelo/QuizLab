// auth-guard.js: Protege páginas restritas, garantindo que o usuário não apenas esteja logado, mas também tenha o e-mail verificado.

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    if (user.emailVerified && pageContent) {
      const spinner = document.getElementById("msgOrSpinner");
      pageContent.style.display = "flex";
      pageContent.removeAttribute("hidden");
      spinner.style.display = "none";
    } else {
      firebase.auth().signOut();
      showToast(
        "Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada.",
        "error"
      );
      setTimeout(() => {
        window.location.href = "../../index.html";
      }, 4000);
    }
  } else {
    canLoadQuizzes = false;
    showToast("Você precisa estar logado para acessar esta página. Redirecionando para o início...", "error");
    setTimeout(() => {
      window.location.href = "../../index.html";
    }, 4000);
  }
});
