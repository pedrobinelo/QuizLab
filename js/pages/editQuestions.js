function editQuizQuestions() {
  pageContent.style.display = "none";
  loadQuestions();
}

async function loadQuestions() {
  showLoading();
  if (window.loadedQuestions.length > 0) {
    questions = window.loadedQuestions;
    showQuestion(window.loadedQuestions[0]);
  } else {
    showToast("Nenhuma questão encontrada para o quiz. Crie uma nova questão.", "warning");
    setupOptionsFields();
  }

  pageContent.style.display = "";
  hideLoading();
}

function reloadCurrentQuestion() {
  const idx = window.currentQuestionNumber - 1;
  if (window.loadedQuestions && window.loadedQuestions.length > 0 && window.loadedQuestions[idx]) {
    const confirm = window.confirm("Você tem certeza que deseja recarregar esta questão?");
    if (confirm) {
      showToast("Questão recarregada!", "success");
      clearQuestionFields();
      showQuestion(window.loadedQuestions[idx]);
    } else {
      return;
    }
  } else {
    showToast("Esta questão ainda não foi criada.", "error");
    return;
  }
}

function showPreviousQuestion() {
  if (window.confirm("Você tem certeza que deseja voltar para a questão anterior? Todas as alterações não salvas serão perdidas.")) {
    if (window.currentQuestionNumber > 1) {
      window.currentQuestionNumber--;
      showQuestion(questions[window.currentQuestionNumber - 1]);
    }
  }
}

function showQuestion(question) {
  if (question.difficulty) {
    document.querySelector(`input[name="difficulty"][value="${question.difficulty}"]`).checked = true;
  } else {
    document.querySelector('input[name="difficulty"][value="2"]').checked = true;
  }
  enunciado.value = question.statement;
  questionNumber.textContent = `Questão ${question.order}`;
  optionsDiv.innerHTML = "";
  mediaURL.value = question.mediaURL || "";
  window.lastLoadedQuestionData = question;
  currentOptions = 0;
  // Adiciona opções existentes
  question.options.forEach((opt) => {
    addOptionField(opt);
  });

  currentOptions = question.options.length || 0;

  const optionGroups = Array.from(document.querySelectorAll(".answer-option"));
  if (
    typeof question.correctAnswer === "number" &&
    optionGroups[question.correctAnswer]
  ) {
    const radio =
      optionGroups[question.correctAnswer].querySelector("input[type=radio]");
    if (radio) radio.checked = true;
  }
  updateOptionUI();
}
