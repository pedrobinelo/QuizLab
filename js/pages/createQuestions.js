const MAX_OPTIONS = 5;
const MIN_OPTIONS = 2;
const params = new URLSearchParams(window.location.search);
const quizId = params.get("quizId");
const titleDisplay = document.getElementById("quizTitleDisplay");
const questionNumber = document.getElementById("questionNumber");
const enunciado = document.getElementById("quizEnunciado");
const optionsDiv = document.getElementById("optionsContainer");
const addBtn = document.getElementById("addOptionBtn");
const reloadBtn = document.getElementById("reloadQuestionBtn");
const previousBtn = document.getElementById("previousQuestionBtn");
const nextBtn = document.getElementById("nextQuestionBtn");
const database = firebase.firestore();
const quizzesRef = firebase.firestore().collection("quizzes").doc(quizId);
const mediaURL = document.getElementById("mediaURL");
const finishQuizBtn = document.getElementById("finishQuizBtn");
var currentOptions = 0;
var finalizouQuiz = false;
var questions = []; // Guarda as questões que o usuário preencheu
// window.loadedQuestions - Guarda as questões carregadas do banco de dados
// window.lastLoadedQuestionData - Guarda os dados da última questão carregada

// Cada reload ou load da página dispara essa função
document.addEventListener("DOMContentLoaded", async function () {
  if (!window.loadedQuestions) {
    await fetchQuestions();
    if (window.loadedQuestions.length > 0) {
      localStorage.setItem(
        "loadedQuestions",
        JSON.stringify(window.loadedQuestions)
      );
    }
  }
  if (params.get("edit") !== "1") {
    window.currentQuestionNumber = 1;
    if (window.loadedQuestions.length > 0) {
      showQuestion(window.loadedQuestions[window.currentQuestionNumber - 1]);
    } else {
      setupOptionsFields();
    }
    questions = [];
  }
  if (quizId) {
    if (window.currentQuestionNumber === undefined) {
      window.currentQuestionNumber = 1;
    }
    pageContent.style.display = "flex";
    showQuizTitle();
    if (params.get("edit") === "1") {
      editQuizQuestions();
    }
  }
});

function setupOptionsFields() {
  clearQuestionFields();
  addOptionField();
  addOptionField();
}

function updateAddButtonState() {
  const currentOptions = document.querySelectorAll(".answer-option");
  currentOptions.length >= MAX_OPTIONS
    ? (addBtn.disabled = true)
    : (addBtn.disabled = false);
}

function updateOptionUI() {
  updateAddButtonState();
  atualizarEmojisRadio();
}

function goToDashboard(event) {
  event.preventDefault();
  let msg =
    "Tem certeza que deseja voltar ao painel? Você perderá alterações feitas na questão atual que não foram salvas.";
  if (window.confirm(msg)) {
    if (window.currentQuestionNumber > 1) {
      msg = " Somente as questões anteriores serão salvas. Confirma?";
      if (window.confirm(msg)) {
        window.location.href = "dashboard.html";
      } else {
        return;
      }
    } else {
      window.location.href = "dashboard.html";
    }
  } else {
    return;
  }
}

async function showQuizTitle() {
  let content = "";
  try {
    const doc = await quizzesRef.get();
    content = doc.data().title;
  } catch {
    content = "Erro ao buscar título do quiz";
  }
  titleDisplay.textContent = content;
}

function clearQuestionFields() {
  document.querySelector('input[name="difficulty"][value="2"]').checked = true;
  enunciado.value = "";
  mediaURL.value = "";
  optionsDiv.innerHTML = "";
  currentOptions = 0;
}

function addOptionField(value = "") {
  if (currentOptions >= MAX_OPTIONS) return;
  optionsDiv.appendChild(renderOptionField(value));
  updateOptionUI();
  currentOptions++;
}

function renderOptionField(value = "") {
  const group = document.createElement("div");
  group.className = "input-group mb-2 answer-option align-items-center";

  const emojiSpan = document.createElement("span");
  emojiSpan.className = "radio-emoji mr-2 ml-1";
  emojiSpan.textContent = "⚪";
  emojiSpan.onclick = function () {
    radio.checked = true;
    atualizarEmojisRadio();
  };

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "correctOption";
  radio.style.display = "none";
  radio.onchange = atualizarEmojisRadio();

  const textarea = document.createElement("textarea");
  textarea.className = "form-control";
  textarea.placeholder = "Opção de resposta (Máx. 500 caracteres)";
  textarea.maxLength = 500;
  textarea.rows = 2;
  textarea.value = value;

  const inputGroupAppend = document.createElement("div");
  inputGroupAppend.className = "input-group-append";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-link p-0 ml-1";
  removeBtn.type = "button";
  removeBtn.title = "Remover opção";
  removeBtn.innerHTML =
    '<span style="color: #e4dedeff; font-size: 2rem; font-weight: bold;">&times;</span>';
  removeBtn.onclick = function () {
    const optionCount = optionsDiv.querySelectorAll(".answer-option").length;
    if (optionCount > MIN_OPTIONS) {
      group.remove();
      currentOptions--;
      updateOptionUI();
    } else {
      showToast("É necessário pelo menos 2 opções de resposta.", "error");
    }
  };

  inputGroupAppend.appendChild(removeBtn);

  [emojiSpan, radio, textarea, inputGroupAppend].forEach((el) =>
    group.appendChild(el)
  );

  return group;
}

function finalizarQuiz() {
  if (!window.confirm("Você tem certeza que deseja finalizar o quiz?")) return;

  finalizouQuiz = true;
  if (window.currentQuestionNumber === 1) {
    salvarQuestaoNoFirestore();
  } else if (window.currentQuestionNumber > 1) {
    const isValid = verifyQuestionData();
    if (!isValid) {
      // Questão incompleta/inválida
      if (
        window.confirm(
          "A questão atual está incompleta. Somente as questões anteriores serão salvas. Confirma?"
        )
      ) {
        showToast("Quiz finalizado com sucesso!", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
        return;
      } else {
        return;
      }
    } else {
      // Questão válida/completa
      if (
        window.confirm(
          "Deseja salvar a questão atual, de número " +
            window.currentQuestionNumber +
            "?"
        )
      ) {
        salvarQuestaoNoFirestore();
      } else {
        showToast("Quiz finalizado com sucesso!", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
        return;
      }
    }
  }
}

async function fetchQuestions() {
  window.loadedQuestions = [];
  try {
    const snapshot = await quizzesRef
      .collection("questions")
      .orderBy("order")
      .get();
    snapshot.forEach((doc) => {
      const question = doc.data();
      question.__id = doc.id;
      window.loadedQuestions.push(question);
    });
  } catch (error) {
    return [];
  }
}

// Valida se o enunciado e as opções estão preenchidos corretamente
function verifyQuestionData() {
  if (!enunciado.value.trim()) return false;

  const optionGroups = Array.from(document.querySelectorAll(".answer-option"));
  const filledOptions = optionGroups.every((group) => {
    const textarea = group.querySelector("textarea");
    return textarea && textarea.value.trim() !== "";
  });

  const hasCorrect = optionGroups.some((group) => {
    const radio = group.querySelector("input[type=radio]");
    return radio && radio.checked;
  });

  return filledOptions && optionGroups.length >= MIN_OPTIONS && hasCorrect;
}

function verifyIfQuestionChanged(questionData) {
  let lastLoadedQuestionData =
    window.loadedQuestions[window.currentQuestionNumber - 1];

  const isChanged =
    lastLoadedQuestionData.difficulty !== questionData.difficulty ||
    lastLoadedQuestionData.statement !== questionData.statement ||
    lastLoadedQuestionData.correctAnswer !== questionData.correctAnswer ||
    lastLoadedQuestionData.order !== questionData.order ||
    lastLoadedQuestionData.mediaURL !== questionData.mediaURL ||
    lastLoadedQuestionData.options.length !== questionData.options.length ||
    lastLoadedQuestionData.options.some(
      (opt, i) => opt !== questionData.options[i]
    );

  return isChanged;
}

function atualizarEmojisRadio() {
  const optionGroups = Array.from(document.querySelectorAll(".answer-option"));
  optionGroups.forEach((group) => {
    const radio = group.querySelector("input[type=radio]");
    const emojiSpan = group.querySelector(".radio-emoji");
    if (radio && emojiSpan) {
      emojiSpan.textContent = radio.checked ? "🟢" : "⚪";
    }
  });
}

function salvarQuestaoNoFirestore() {
  const isValid = verifyQuestionData();
  if (!isValid) {
    showToast(
      "Por favor, preencha o enunciado, as opções de resposta e escolha uma opção correta.",
      "warning"
    );
    finalizouQuiz = false;
    return;
  }

  const difficulty = document.querySelector(
    'input[name="difficulty"]:checked'
  ).value;
  const options = [];
  const optionGroups = Array.from(document.querySelectorAll(".answer-option"));
  let correctOption = null;
  optionGroups.forEach((group, idx) => {
    const textarea = group.querySelector("textarea");
    const radio = group.querySelector("input[type=radio]");
    options.push(textarea.value.trim());
    if (radio && radio.checked) correctOption = idx;
  });

  if (options.length < 2) {
    showToast(
      "Por favor, adicione pelo menos duas opções de resposta.",
      "warning"
    );
    return;
  }

  if (correctOption === null) {
    showToast("Por favor, selecione a resposta correta.", "warning");
    return;
  }

  const questionData = {
    difficulty: difficulty,
    statement: enunciado.value.trim(),
    options: options,
    correctAnswer: correctOption,
    order: window.currentQuestionNumber,
    mediaURL: mediaURL.value.trim() || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  let questionExists = questionAlreadyExists(questionData.order - 1);
  if (questionExists) {
    // Só atualiza o banco e dá o alerta se o usuário realmente alterou algo
    const isChanged = verifyIfQuestionChanged(questionData);

    if (isChanged) {
      quizzesRef
        .collection("questions")
        .doc(questionExists)
        .update(questionData)
        .then(async () => {
          questions[window.currentQuestionNumber - 1] = {
            ...questionData,
            __id: questionExists,
          };
          if (finalizouQuiz === true) {
            showToast("Quiz finalizado com sucesso!", "success");
            setTimeout(() => {
              window.location.href = "dashboard.html";
            }, 2000);
            return;
          }
          showToast("Questão atualizada!", "success");
          nextQuestion();
        })
        .catch((error) => {
          showToast("Erro ao atualizar questão: " + error.message, "error");
        });
    } else if (!isChanged) {
      // Não faz nada, só avança para próxima questão
      questions[window.currentQuestionNumber - 1] =
        window.loadedQuestions[window.currentQuestionNumber - 1];
      if (finalizouQuiz === true) {
        showToast("Quiz finalizado com sucesso!", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
        return;
      }
      nextQuestion();
    }

    return;
  } else {
    // Cria nova questão
    quizzesRef
      .collection("questions")
      .add(questionData)
      .then((docRef) => {
        questionData.__id = docRef.id; // Salva o id gerado pelo Firestore
        questions.push(questionData);
        if (finalizouQuiz === true) {
          showToast("Quiz finalizado com sucesso!", "success");
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 2000);
          return;
        }
        showToast("Questão criada!", "success");
        nextQuestion();
      })
      .catch((error) => {
        showToast("Erro ao criar questão: " + error.message, "error");
      });
  }
}

function questionAlreadyExists(index) {
  const idx =
    typeof index === "number" ? index : window.currentQuestionNumber - 1;
  const existingQuestion =
    window.loadedQuestions &&
    window.loadedQuestions[idx] &&
    window.loadedQuestions[idx].__id;

  return existingQuestion ? existingQuestion : false;
}

function nextQuestion() {
  if (
    window.loadedQuestions &&
    window.currentQuestionNumber < window.loadedQuestions.length
  ) {
    window.currentQuestionNumber++;
    showQuestion(window.loadedQuestions[window.currentQuestionNumber - 1]);
  } else {
    currentOptions = 0;
    setupOptionsFields();
    window.currentQuestionNumber++;
    questionNumber.textContent = `Questão ${window.currentQuestionNumber}`;
  }
}

function clearMediaURL() {
  document.getElementById("mediaURL").value = "";
}

async function removeQuestion() {
  if (confirm("Tem certeza que deseja remover esta questão?")) {
    const orderToRemove = window.currentQuestionNumber;
    if (!window.loadedQuestions[orderToRemove - 1]) {
      showToast("Esta questão ainda não foi criada.", "error");
      return;
    }
    const questionIdToRemove = window.loadedQuestions[orderToRemove - 1].__id;
    var deleted = false;
    if (
      orderToRemove > window.loadedQuestions.length ||
      window.loadedQuestions[orderToRemove - 1].__id === undefined
    ) {
      showToast("Questão não existe.", "error");
      return;
    }

    if (!questionIdToRemove) {
      showToast("Erro: ID da questão não encontrado.", "error");
      return;
    }

    try {
      const questionsCollectionRef = database
        .collection("quizzes")
        .doc(quizId)
        .collection("questions");

      const questionRef = questionsCollectionRef.doc(questionIdToRemove);
      const querySnapshot = await questionsCollectionRef
        .where("order", ">", orderToRemove)
        .get();

      await database.runTransaction(async (transaction) => {
        transaction.delete(questionRef);
        deleted = true;
        querySnapshot.forEach((doc) => {
          const docRef = questionsCollectionRef.doc(doc.id);
          const newOrder = doc.data().order - 1;
          transaction.update(docRef, { order: newOrder });
        });
      });
    } catch (error) {
      deleted = false;
      showToast("Erro ao remover questão: " + error.message, "error");
      return;
    } finally {
      if (deleted) {
        const filteredQuestions = window.loadedQuestions.filter(
          (question) => question.__id !== questionIdToRemove
        );

        const reorderedQuestions = filteredQuestions.map((question) => {
          if (question.order > orderToRemove) {
            return { ...question, order: question.order - 1 };
          }
          return question;
        });

        // Atualiza o array global
        window.loadedQuestions = reorderedQuestions;
        questions = reorderedQuestions;
        console.log(window.loadedQuestions);
        showToast("Questão removida com sucesso!", "success");
        setTimeout(() => {
          if (window.loadedQuestions.length > 0) {
            if (window.loadedQuestions[window.currentQuestionNumber - 1]) {
              showQuestion(
                window.loadedQuestions[window.currentQuestionNumber - 1]
              );
            } else {
              setupOptionsFields();
            }
          }
        }, 1000);
      }
    }
  } else {
    return;
  }
}
