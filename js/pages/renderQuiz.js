const questionNumber = document.getElementById("question-number");
const questionLevel = document.getElementById("question-level");
const statement = document.getElementById("question");
const mediaContainer = document.getElementById("question-media");
const optionsList = document.getElementById("options");
const questions = JSON.parse(localStorage.getItem("quizQuestions") || "[]");
const nextBtn = document.getElementById("next-button");
window.buttons = document.querySelectorAll("#options .option-button");

var selectedButton = null; // Armazena o botão selecionado atualmente
var selectedAnswerIndex = null; // Índice da resposta escolhida
var currentQuestionIndex = 0; // Índice da questão atual
var score = 0;
var deactivatedBtns = false; // Indica se os botões estão desativados

document.addEventListener("DOMContentLoaded", function () {
  const quizData = JSON.parse(localStorage.getItem("quizData") || "{}");
  document.title = quizData.title || "Quiz";
  if (questions.length > 0) {
    showQuestionData(questions[0]);
  }
});

function isYouTubeUrl(url) {
  return url.includes("youtube.com/watch?v=") || url.includes("youtu.be/");
}

function getYouTubeEmbedUrl(url) {
  let videoId = null;
  if (url.includes("youtube.com/watch?v=")) {
    const match = url.match(/[?&]v=([^&#]+)/);
    if (match && match[1]) videoId = match[1];
  } else if (url.includes("youtu.be/")) {
    const match = url.match(/youtu\.be\/([^?&#]+)/);
    if (match && match[1]) videoId = match[1];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function showMedia(mediaURL, mediaContainer) {
  const img = new Image();
  img.src = mediaURL;
  img.style.maxWidth = "100%";
  img.style.maxHeight = "400px";
  img.style.borderRadius = "8px";
  img.alt = "Mídia de apoio para a questão";
  mediaContainer.innerHTML = '<div class="spinner"></div>';
  img.onload = function () {
    mediaContainer.innerHTML = "";
    mediaContainer.appendChild(img);
  };
  img.onerror = function () {
    // Se não for imagem, tenta vídeo ou YouTube
    if (mediaURL.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      mediaContainer.innerHTML = `<video src="${mediaURL}" controls style="max-width:100%;max-height:400px;border-radius:8px;"></video>`;
    } else if (isYouTubeUrl(mediaURL)) {
      const embedUrl = getYouTubeEmbedUrl(mediaURL);
      if (embedUrl) {
        mediaContainer.innerHTML = `<iframe width="100%" height="315" src="${embedUrl}?controls=1&autoplay=0" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
      } else {
        mediaContainer.innerHTML =
          '<p class="text-warning">Link do YouTube inválido.</p>';
      }
    } else {
      mediaContainer.innerHTML =
        '<p class="text-warning">Formato não suportado ou link inválido.</p>';
    }
  };
}

function showQuestionData(question) {
  pageContent.style.display = "flex";
  nextBtn.disabled = true;
  questionNumber.innerHTML = `Questão ${question.order} de ${questions.length}`;
  if (question.difficulty) {
    switch (question.difficulty) {
      case "1":
        questionLevel.innerHTML = '<p class="m-0 text-success"><b>FÁCIL 🟢</b></p>';
        break;
      case "2":
        questionLevel.innerHTML = '<p class="m-0 text-warning"><b>MÉDIO 🟡</b></p>'
        break;
      case "3":
        questionLevel.innerHTML = '<p class="m-0 text-danger"><b>DIFÍCIL 🔴</b></p>';
        break;
      default:
        questionLevel.innerHTML = '<p class="m-0 text-warning"><b>MÉDIO 🟡</b></p>'
        break;
    }
  } else {
    questionLevel.style.display = "none";
  }

  statement.innerHTML = question.statement;
  if (question.mediaURL) {
    showMedia(question.mediaURL, mediaContainer);
  } else {
    mediaContainer.style.margin = "0"; // remove a margem
    mediaContainer.innerHTML = ""; // Limpa o contêiner se não houver mídia
  }

  optionsList.innerHTML = "";
  question.options.forEach((option, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.classList.add("option-button", "btn", "btn-light");
    button.innerText = option;
    li.appendChild(button);
    optionsList.appendChild(li);
    button.onclick = () => selectAnswer(index);
  });

  window.buttons = document.querySelectorAll("#options .option-button");
  deactivatedBtns = false;
}

function selectAnswer(selectedIndex) {
  if (deactivatedBtns) {
    return;
  }

  // Habilita o botão de próxima questão
  if (nextBtn) {
    nextBtn.disabled = false;
  }

  // Se houver um botão previamente selecionado, remove o estilo
  if (selectedButton) {
    selectedButton.style.backgroundColor = ""; // Remove a cor de fundo
    selectedButton.style.color = ""; // Remove a cor do texto
  }

  selectedButton = buttons[selectedIndex];
  selectedAnswerIndex = selectedIndex;

  selectedButton.style.backgroundColor = "rgba(46, 138, 34, 0.993)";
  selectedButton.style.color = "white";
}

function isAnswered() {
  // Desabilita todos os botões de resposta
  buttons.forEach((button) => {
    button.disabled = true;
  });
  deactivatedBtns = true;
}
function loadNextQuestion() {
  isAnswered();

  if (selectedButton) {
    const correctIndex = questions[currentQuestionIndex].correctAnswer;
    const isCorrect = selectedAnswerIndex === correctIndex;
    const correctBtn = buttons[correctIndex];

    if (isCorrect) {
      showToast("Resposta correta! 🎉", "success");
      score++;
    } 

    // Mostra o feedback
    showFeedback(isCorrect, correctBtn);

    // Reseta as variáveis de seleção
    selectedButton = null;
    selectedAnswerIndex = null;

    // Avança para a próxima questão após 2.5 segundos
    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        showQuestionData(questions[currentQuestionIndex]);
      } else {
        // FIM DO QUIZ
        localStorage.setItem("quizScore", score);
        localStorage.setItem("questionsLength", questions.length);
        window.location.href = "quiz_end.html";
      }
    }, 3500);
  }
}

function showFeedback(isCorrect, correctButton) {
  selectedButton.className = "";
  selectedButton.classList.add("option-button");
  if (isCorrect) {
    selectedButton.classList.add("correct");
  } else {
    selectedButton.removeAttribute("style");
    selectedButton.classList.add("incorrect");
    correctButton.className = "";
    correctButton.classList.add("option-button");
    correctButton.classList.add("correct");
  }
}

function endOnGoingQuiz() {
  if (confirm("Você deseja realmente encerrar o quiz?")) {
    localStorage.clear();
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "index.html";
      }
    });
  }
}
