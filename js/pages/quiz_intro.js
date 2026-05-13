window.questions = [];
const pathName = window.location.pathname;
const quizLevel = document.getElementById("quiz-level");
const quizTitle = document.getElementById("quiz-title");
const quizDescription = document.getElementById("quiz-description");
const waitLoadQuestions = document.getElementById("waitLoadQuestions");
const backButton = document.getElementById("back-button");

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const quizCode = params.get("code");

  if (!quizCode) {
    setTimeout(() => {
      showToast("Código do quiz não informado na URL.", "error");
      window.location.href = "index.html";
    }, 3500);
    return;
  }

  searchQuiz(quizCode);
});

function tryLoadQuizInfo(quizData, quizCodeStored, quizCode) {
  if (quizData && quizCodeStored === quizCode) {
    renderQuizInfo();
    if (window.questions.length > 0) {
      waitLoadQuestions.style.display = "none";
      document.getElementById("start-quiz-button").disabled = false;
    }
  }
}

function renderQuizInfo() {
  pageContent.style.display = "flex";
  const msgOrSpinner = document.getElementById("msgOrSpinner");
  msgOrSpinner.style.display = "none";
  const btns = document.getElementById("btns");
  btns.removeAttribute("hidden");
  window.quizData = JSON.parse(localStorage.getItem("quizData"));
  window.quizCode = localStorage.getItem("quizCode");
  window.mediaURL = window.quizData.mediaURL ? window.quizData.mediaURL : null;
  document.title = window.quizData.title || "Quiz";
  quizTitle.innerHTML = window.quizData.title || "Quiz";
  quizDescription.innerHTML = window.quizData.description || "Descrição";
  if (window.quizData.difficulty) {
    switch (window.quizData.difficulty) {
      case "1":
        quizLevel.innerHTML = '<p class="m-0 text-success"><b>FÁCIL 🟢</b></p>';
        quizLevel.className = "easy-level";
        break;
      case "2":
        quizLevel.innerHTML = '<p class="m-0 text-warning"><b>MÉDIO 🟡</b></p>';
        quizLevel.className = "medium-level";
        break;
      case "3":
        quizLevel.innerHTML =
          '<p class="m-0 text-danger"><b>DIFÍCIL 🔴</b></p>';
        quizLevel.className = "hard-level";
        break;
      default:
        quizLevel.innerHTML = '<p class="m-0 text-warning"><b>MÉDIO 🟡</b></p>';
        quizLevel.className = "medium-level";
        break;
    }
  } else {
    quizLevel.style.display = "none";
  }

  // Se houver imagem de capa, define como fundo
  if (window.mediaURL && window.mediaURL.trim() !== "") {
    const bgDiv = document.getElementById("background-blur");
    bgDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${window.mediaURL}')`;
  }
}

function startQuiz() {
  if (window.questions.length > 0) {
    window.location.href = `quiz.html?code=${window.quizCode}`;
  } else {
    window.questions = JSON.parse(localStorage.getItem("quizQuestions")) || [];
    if (window.questions.length > 0) {
      window.location.href = `quiz.html?code=${window.quizCode}`;
    } else {
      showToast("Nenhuma questão encontrada para o quiz.", "error");
    }
  }
}

async function searchQuiz(quizCode) {
  const quizRef = firebase.firestore().collection("quizzes").doc(quizCode);
  quizRef
    .get()
    .then(async function (quizSnapshot) {
      if (!quizSnapshot.exists) {
        showToast("Quiz não encontrado.", "error");
      } else {
        localStorage.setItem("quizData", JSON.stringify(quizSnapshot.data()));
        localStorage.setItem("quizCode", quizSnapshot.id);
        fetchQuestions(quizRef).then(() => {
          localStorage.getItem("quizQuestions");
          if (window.questions.length > 0) {
            tryLoadQuizInfo(quizSnapshot.data(), quizSnapshot.id, quizCode);
          } else {
            showToast("Nenhuma questão encontrada para o quiz.", "error");
            renderQuizInfo();
            waitLoadQuestions.innerHTML = "Nenhuma questão encontrada :(";
          }
        });
      }
    })
    .catch(function (error) {
      showToast("Erro ao buscar quiz: " + error.message, "error");
    });
}

function goBack() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "index.html";
    }
  });
}
