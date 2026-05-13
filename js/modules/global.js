// Global variables
const pageContent = document.getElementById("page-content");

function showLoading() {
  const div = document.createElement("div");
  div.id = "loading";
  div.classList.add(
    "d-flex",
    "justify-content-center",
    "align-items-start",
    "text-light"
  );
  div.innerHTML = '<p class="p-3 w-100 text-center">Carregando...</p>';
  document.body.appendChild(div);
}

function hideLoading() {
  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function recoverPassword(email) {
  if (!email || !email.trim()) {
    showToast(
      "Para redefinir sua senha, informe o e-mail cadastrado no campo de e-mail.",
      "warning"
    );
    return;
  }

  const waitDiv = document.getElementById("wait-div");
  const pathName = window.location.pathname;
  // Exibe o div de espera se estiver na página my_account.html
  if (pathName.endsWith("my_account.html")) {
    waitDiv.style.display = "block";
  }
  if (confirm("Você tem certeza que deseja redefinir sua senha?")) {
    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        showToast("Você receberá um link para redefinir sua senha.", "success");
      })
      .catch((error) => {
        showToast(
          "Um erro ocorreu:" + error.message + ". Tente novamente mais tarde.",
          "error"
        );
      })
      .finally(() => {
        if (pathName.endsWith("my_account.html")) {
          waitDiv.style.display = "none";
        }
      });
  } else {
    if (pathName.endsWith("my_account.html")) {
      waitDiv.style.display = "none";
    }
  }
}

async function fetchQuestions(quizRef) {
  try {
    const snapshot = await quizRef
      .collection("questions")
      .orderBy("order")
      .get();
    snapshot.forEach((doc) => {
      const question = doc.data();
      question.__id = doc.id;
      window.questions.push(question);
    });
    localStorage.setItem("quizQuestions", JSON.stringify(window.questions));
  } catch (error) {
    return [];
  }
}

window.isManualLogout = false;

function logout() {
  window.isManualLogout = true;
  firebase
    .auth()
    .signOut()
    .then(() => {
      window.location.href = "../index.html";
    })
    .catch((error) => {
      showToast("Erro ao fazer logout: " + error.message, "error");
    });
}

if (window.location.pathname.endsWith("my_account.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    const content = document.getElementById("page-content");
    const emailDiv = document.getElementById("email-div");
    const emailText = emailDiv.querySelector("p");

    // Exibe o e-mail do usuário logado
    firebase.auth().onAuthStateChanged(function (user) {
      content.style.display = "block";
      if (user) {
        const userName = document.getElementById("name");
        if (user.displayName && user.email) {
          userName.textContent = user.displayName;
          emailText.textContent = user.email;
        } else  {
          if (!user.displayName) {
            userName.textContent = "Nome não disponível";
          } else {
            userName.textContent = user.displayName;
          }
          if (!user.email) {
            emailText.textContent = "E-mail não disponível";
          } else {
            emailText.textContent = user.email;
          }
        }
      }
    });
  });
} else if (window.location.pathname.endsWith("dashboard.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        const welcomeTitle = document.getElementById("welcome-title");
        if (user.displayName) {
          const firstName = user.displayName.split(" ")[0];
          if (firstName.length <= 15) {
            if (window.innerWidth <= 768) {
              welcomeTitle.innerHTML = `Bem-vindo,<br> ${firstName}!`;
            } else {
              welcomeTitle.innerHTML = `Bem-vindo, ${firstName}!`;
            }
          } else {
            welcomeTitle.innerHTML = `Bem-vindo!`;
          }
        } else {
          welcomeTitle.innerHTML = `Bem-vindo!`;
        }
      }
    });
  });
}
