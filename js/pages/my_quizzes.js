const quizzesGrid = document.getElementById("quizzesGrid");
const noQuizzesMsg = document.getElementById("noQuizzesMsg");
const nav = document.querySelector(".nav.nav-head");
const db = firebase.firestore();
const quizzesRef = db.collection("quizzes");
var quizTitleInput = document.getElementById("quizTitleInput");
var quizDescInput = document.getElementById("quizDescInput");
var mediaURLInput = document.getElementById("mediaURL");
let lastVisible = null;
let loadedQuizzes = [];

let allQuizzes = [];
let currentIndex = 0;
let quizzesPerLoad = 4; // Smartphones

function renderQuizCard(quiz, idx) {
  const difficulty = quiz.difficulty || "";
  let text = ""
  if (difficulty === "1") {
    text = `<p class="m-0 text-success"><b>FÁCIL 🟢</b></p>`;
  } else if (difficulty === "2") {
    text = `<p class="m-0 text-warning"><b>MÉDIO 🟡</b></p>`;
  } else if (difficulty === "3") {
    text = `<p class="m-0 text-danger"><b>DIFÍCIL 🔴</b></p>`;
  }
  return `
        <div class="quiz-card d-flex flex-column justify-content-center">
          <div class="quiz-card-body">
            <div class="d-flex w-100 justify-content-between" style="flex: 1;"> 
              <h5 class="quiz-title" title="${quiz.title}">#${idx} ${quiz.title}</h5>
              <div class="d-flex flex-column justify-content-center">
                <span> <a class="editQuizInfoBtn btn btn-sm btn-warning text-dark" data-id="${quiz.id}">Editar</a></span>
              </div>
            </div>
            <div class="d-flex w-100 justify-content-between"> 
              <button class="btn btn-sm btn-info" onclick="shareCode('${quiz.id}')">🔗 Código</button>
              ${text}
            </div>
            <div class="quiz-actions">
              <a href="create_questions.html?quizId=${quiz.id}&edit=1" class="btn btn-sm btn-primary">Editar questões</a>
              <button class="btn btn-sm btn-danger" onclick="deleteQuiz('${quiz.id}')">Excluir</button>
              <button class="btn btn-sm btn-info" onclick="shareQuiz('${quiz.id}')">🔗</button>
            </div>
          </div>
        </div>
      `;
}

function renderNoQuizzesMsg() {
  return `
        <div class="noQuizzesMsg text-center text-light mt-5" style="grid-column: 1 / -1;">
          Nenhum quiz encontrado ☹️<br>Crie um novo quiz!
        </div>
      `;
}

function getQuizLimit() {
  const width = window.innerWidth;
  if (width < 768) {
    return 4; // Smartphones
  } else if (width < 1024) {
    return 10; // Tablets
  } else {
    return 12; // Desktops
  }
}

function renderQuizzes(offset) {
  if (!offset) {
    offset = getQuizLimit();
  }

  const info = document.getElementById("info");
  info.style.display = "";
  const limitMsg = document.getElementById("limitMsg");
  const limit = getQuizLimit();
  if (allQuizzes.length > limit) {
    limitMsg.innerHTML = `Carregando os ${limit} últimos quizzes criados... <br><br> Carregue mais&nbsp; <span class="btn btn-sm btn-success">Carregar ➕</span>`;
  } else {
    limitMsg.innerHTML = `Exibindo os ${allQuizzes.length} últimos quizzes criados...`;
  }

  const msgOrSpinnerGrid = document.getElementById("msgOrSpinnerGrid");
  msgOrSpinnerGrid.style.display = "none";
  let quizzesToRender = allQuizzes.slice(currentIndex, currentIndex + offset);
  quizzesToRender.forEach((quiz, idx) => {
    quizzesGrid.innerHTML += renderQuizCard(quiz, currentIndex + idx + 1);
  });

  currentIndex += quizzesToRender.length;
  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  let loadMoreBtn = document.getElementById("loadMoreBtn");
  currentIndex < allQuizzes.length
    ? (loadMoreBtn.disabled = false)
    : (loadMoreBtn.disabled = true);
}

function reloadQuizzes() {
  quizzesGrid.innerHTML = "";
  const msgOrSpinnerGrid = document.getElementById("msgOrSpinnerGrid");
  msgOrSpinnerGrid.style.display = "";
  currentIndex = 0;
  let limit = getQuizLimit();
  renderQuizzes(limit);
}

function loadQuizzes(user) {
  if (user) {
    quizzesRef
      .where("owner", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get()
      .then((snapshot) => {
        const msgOrSpinner = document.getElementById("msgOrSpinner");
        msgOrSpinner.style.display = "none";
        pageContent.style.display = "flex";

        if (snapshot.empty) {
          const info = document.getElementById("info");
          info.style.display = "none";
          quizzesGrid.innerHTML += renderNoQuizzesMsg();
          return;
        }

        allQuizzes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        window.allQuizzes = allQuizzes;

        currentIndex = 0;
        quizzesGrid.innerHTML = "";

        // Renderiza lote inicial de quizzes
        let limit = getQuizLimit();
        renderQuizzes(limit);
      })
      .catch((error) => {
        showToast(
          "Erro ao carregar quizzes: " +
            error.message +
            ". Redirecionando para o painel...",
          "error"
        );
        window.location.href = "dashboard.html";
      });
  } else {
    showToast(
      "Usuário não autenticado. Redirecionando para o início...",
      "error"
    );
    window.location.href = "index.html";
  }
}

function removeAccents(str) {
  return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function searchQuizzes() {
  let searchInputRaw = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  let searchInput = removeAccents(searchInputRaw);
  let searchType = document.querySelector(
    'input[name="searchType"]:checked'
  ).value;

  let filteredQuizzes = [];

  filteredQuizzes = window.allQuizzes.filter((quiz) => {
    if (searchType === "title") {
      return removeAccents((quiz.title || "").toLowerCase()).includes(
        searchInput
      );
    } else if (searchType === "description") {
      return removeAccents((quiz.description || "").toLowerCase()).includes(
        searchInput
      );
    }
    return false;
  });

  const oldMsgs = document.querySelectorAll(".noQuizzesMsg");
  const info = document.getElementById("info");
  oldMsgs.forEach((msg) => msg.remove());
  quizzesGrid.innerHTML = "";
  if (filteredQuizzes.length === 0) {
    info.style.display = "none";
    quizzesGrid.innerHTML = renderNoQuizzesMsg();
    return;
  } else {
    let idx = 1;
    let htmlContent = "";
    filteredQuizzes.forEach((quiz) => {
      quiz.id = quiz.id || "";
      htmlContent += renderQuizCard(quiz, idx);
      idx++;
    });
    info.style.display = "";
    quizzesGrid.innerHTML = htmlContent;
  }
}

function deleteQuiz(quizId) {
  if (
    !confirm(
      "Tem certeza que deseja excluir este quiz? Essa ação não pode ser desfeita."
    )
  )
    return;

  const questionsRef = quizzesRef.doc(quizId).collection("questions");

  questionsRef
    .get()
    .then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      batch.commit().then(() => {
        quizzesRef
          .doc(quizId)
          .delete()
          .then(() => {
            showToast("Quiz excluído com sucesso!", "success");
            const user = firebase.auth().currentUser;
            loadQuizzes(user);
          })
          .catch((err) => {
            showToast("Erro ao excluir quiz: " + err.message, "error");
          });
      });
    })
    .catch((err) => {
      showToast("Erro ao excluir questões do quiz: " + err.message, "error");
    });
}

document.addEventListener("DOMContentLoaded", function () {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      loadQuizzes(user);
      $(document).on("click", ".editQuizInfoBtn ", function () {
        $("#editQuizInfoModal").modal("show");
        const quizId = $(this).data("id");
        loadQuizInfo(quizId);
        lastEditBtn = this;
      });

      $("#editQuizInfoModal").on("show.bs.modal", function () {
        this.removeAttribute("inert");
      });

      $("#editQuizInfoModal").on("hide.bs.modal", function () {
        this.setAttribute("inert", "");
      });

      $("#editQuizInfoModal").on("hidden.bs.modal", function () {
        if (lastEditBtn) {
          lastEditBtn.focus();
          lastEditBtn = null;
        }
      });
      // Remover foco do botão de fechar ao fechar modais
      $("#editQuizInfoModal").on("hide.bs.modal", function () {
        const closeBtn = this.querySelector(".close");
        if (closeBtn && document.activeElement === closeBtn) {
          closeBtn.blur();
        }
      });
    }
  });
});

function clearMediaURL() {
  document.getElementById("mediaURL").value = "";
  document.getElementById("mediaURLStatus").textContent = "";
}

function validateMediaURL() {
  const mediaURLInput = document.getElementById("mediaURL").value.trim();
  const mediaURLStatus = document.getElementById("mediaURLStatus");
  const isValid = isValidUrl(mediaURLInput);

  if (mediaURLInput === "") {
    mediaURLStatus.textContent = "";
    return;
  }

  if (isValid) {
    mediaURLStatus.textContent = "✅";
    mediaURLStatus.style.color = "green";
  } else {
    mediaURLStatus.textContent = "❌";
    mediaURLStatus.style.color = "red";
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function loadQuizInfo(quizId) {
  quizzesRef
    .doc(quizId)
    .get()
    .then((doc) => {
      window.quiz = doc.data();
      window.quizID = quizId;
      document.querySelector(`input[name="difficulty"][value="${window.quiz.difficulty}"]`).checked = true;
      quizTitleInput.value = window.quiz.title || "";
      quizDescInput.value = window.quiz.description || "";
      mediaURLInput.value = window.quiz.mediaURL || "";
      validateMediaURL();
    });
}

function verifyIfQuizInfoChanged() {
  if (!window.quiz) return;
  let isChanged = false;
  let quizDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
  let quizTitle = quizTitleInput.value.trim() || "";
  let quizDescription = quizDescInput.value.trim() || "";
  let mediaURL = mediaURLInput.value.trim() || "";

  isChanged =
    window.quiz.difficulty !== quizDifficulty ||
    (window.quiz.title || "").trim() !== quizTitle ||
    (window.quiz.description || "").trim() !== quizDescription ||
    (window.quiz.mediaURL || "").trim() !== mediaURL;


  if (isChanged) {
    if (
      confirm(
        "As informações do quiz foram alteradas. Deseja salvar as alterações?"
      )
    ) {
      saveQuizInfo(quizDifficulty,quizTitle, quizDescription, mediaURL);
    }
  } else {
    $("#editQuizInfoModal").modal("hide");
  }
}

function saveQuizInfo(difficulty, title, description, mediaURL) {
  const user = firebase.auth().currentUser;
  if (!user) {
    showToast("Você precisa estar logado para criar um quiz.", "error");
    return;
  }
  firebase
    .firestore()
    .collection("quizzes")
    .doc(window.quizID)
    .update({
      difficulty: difficulty,
      title: title,
      description: description,
      mediaURL: mediaURL,
    })
    .then(() => {
      showToast("Informações do quiz salvas com sucesso!", "success");
      $("#editQuizInfoModal").modal("hide");
      const user = firebase.auth().currentUser;
      loadQuizzes(user);
    })
    .catch((error) => {
      showToast(
        "Erro ao salvar informações do quiz: " + error.message,
        "error"
      );
    });
}

function shareCode(quizId) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(quizId);
    showToast("Código do quiz copiado para área de transferência!", "info");
  } else {
    showToast("Erro ao copiar o código do quiz.", "error");
  }
}

function shareQuiz(quizId) {
  const quizUrl = `${window.location.origin}/quiz_intro.html?code=${quizId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(quizUrl);
    showToast("Link do quiz copiado para área de transferência! Compartilhe-o para que ele seja respondido 😃.", "info");
  } else {
    showToast("Erro ao copiar o link.", "error");
  }
}