document.addEventListener("DOMContentLoaded", () => {
  const quizScore = localStorage.getItem("quizScore") || 0;
  const questionsLength = localStorage.getItem("questionsLength") || 0;
  const score = document.getElementById("score");
  const quizData = JSON.parse(localStorage.getItem("quizData"));
  if (quizData) {
    window.mediaURL = quizData.mediaURL ? quizData.mediaURL : null;
  }

  // Se houver imagem de capa, define como fundo
  if (window.mediaURL && window.mediaURL.trim() !== "") {
    const bgDiv = document.getElementById("background-blur");
    bgDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${window.mediaURL}')`;
  }

  if (quizScore) {
    pageContent.style.display = "flex";
    const msgOrSpinner = document.getElementById("msgOrSpinner");
    msgOrSpinner.style.display = "none";
    score.innerHTML = `Sua pontuação:<br> ${quizScore} de ${questionsLength}`;
  } else {
    score.innerText = "Erro ao recuperar a pontuação.";
  }
});

function endQuiz() {
  const quizCover = document.getElementById("quizCover");
  quizCover.style.display = "none";
  const msgOrSpinner = document.getElementById("msgOrSpinner");
  msgOrSpinner.style.display = "";
  localStorage.clear();
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "index.html";
    }
  });
}

function restartQuiz() {
  const quizCover = document.getElementById("quizCover");
  quizCover.style.display = "none";
  const msgOrSpinner = document.getElementById("msgOrSpinner");
  msgOrSpinner.style.display = "";
  const code = localStorage.getItem("quizCode");
  if (code) {
    window.location.href = `quiz.html?code=${code}`;
  } else {
    showToast("Código do quiz não encontrado.", "error");
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }
}
