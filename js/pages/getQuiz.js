window.questions = [];
const pathName = window.location.pathname;

document.addEventListener("DOMContentLoaded", () => {
  pageContent.style.display = "flex";
});

function goToQuiz() {
  const quizCode = document.getElementById("quizCode").value.trim();
  if (quizCode) {
    pageContent.style.display = "none";
    searchQuiz(quizCode);
  } else {
    showToast("Por favor, insira um código válido.", "error");
  }
}

async function searchQuiz(quizCode) {
  showLoading();
  const quizRef = firebase.firestore().collection("quizzes").doc(quizCode);
  quizRef
    .get()
    .then(async function (quizSnapshot) {
      if (!quizSnapshot.exists) {
        hideLoading();
        pageContent.style.display = "";
        showToast("Quiz não encontrado. Verifique o código inserido.", "error");
      } else {
        hideLoading();
        window.location.href = `quiz_intro.html?code=${quizSnapshot.id}`;
      }
    })
    .catch(function (error) {
      hideLoading();
      showToast("Erro ao buscar quiz: " + error.message, "error");
    });
}
