const pathName = window.location.pathname;
var loginButtonDisabled = true;
var registerButtonDisabled = true;
var loginHelp = null;
var signupHelp = null;
var passwordHelp = null;
var loginButton = null;
var confirmPassword = null;
var registerButton = null;
const auth = firebase.auth();

if (pathName.endsWith("login.html")) {
  loginButton = document.getElementById("loginButton");
  loginHelp = document.getElementById("loginHelp");
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !loginButtonDisabled) {
      e.preventDefault();
      loginButton.click();
    }
  });
  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user && user.emailVerified) {
        window.location.href = "dashboard.html";
        return;
      }
    });
  });
} else if (pathName.endsWith("signup.html")) {
  confirmPassword = document.getElementById("confirm_password");
  registerButton = document.getElementById("registerButton");
  signupHelp = document.getElementById("signupHelp");
  help = document.getElementById("help");

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !registerButtonDisabled) {
      e.preventDefault();
      registerButton.click();
    }
  });

  document.addEventListener("DOMContentLoaded", function (event) {
    $("#signupSuccessModal").on("show.bs.modal", function () {
      this.removeAttribute("inert");
    });

    $("#signupSuccessModal").on("hide.bs.modal", function () {
      this.setAttribute("inert", "");
    });
  });
}

/* AUTENTICAÇÃO VIA GOOGLE*/
const googleSignInButton = document.getElementById("googleSignInBtn");
googleSignInButton.addEventListener("click", () => {
  // Cria uma instância do provedor de autenticação do Google
  const provider = new firebase.auth.GoogleAuthProvider();
  signInWithGoogle(provider);
});

function signInWithGoogle(provider) {
  firebase
    .auth()
    // Abrir a janela de login do Google
    .signInWithPopup(provider)
    .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      // Sucesso! Redirecione o usuário para o painel
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      if (error.code === "auth/popup-closed-by-user") {
        // Ação do usuário, não um erro técnico. Não mostre nada.
        return;
      }
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Erro no login com Google:", errorCode, errorMessage);
      showToast(
        "Ocorreu um erro ao tentar fazer login com o Google. Tente novamente.",
        "error"
      );
    });
}

const form = {
  name: () => document.getElementById("userName"),
  email: () => document.getElementById("email"),
  confirmEmail: () => document.getElementById("email_confirm"),
  password: () => document.getElementById("password"),
  loginButton: () => (loginButton ? loginButton : null),
  confirmPassword: () => (confirmPassword ? confirmPassword : null),
  registerButton: () => (registerButton ? registerButton : null),
};

function prepareLoginOrRegister(event) {
  event.preventDefault();
  showLoading();
}

function login(event) {
  prepareLoginOrRegister(event);
  auth
    .signInWithEmailAndPassword(form.email().value, form.password().value)
    .then((userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified) {
        hideLoading();
        window.location.href = "dashboard.html";
        return;
      }

      // CASO 2: Usuário logou com sucesso, mas o e-mail NÃO foi verificado.
      user
        .sendEmailVerification()
        .then(() => {
          auth.signOut();
          actions(
            "Seu e-mail não foi verificado. Enviamos um novo link de verificação para sua caixa de entrada. (Verifique a sua caixa de spam 😉).",
            "error"
          );
        })
        .catch((error) => {
          auth.signOut();
          actions(
            "Ocorreu um erro ao reenviar o e-mail de verificação. Tente fazer login novamente em alguns minutos.",
            "error"
          );
        });
    })
    .catch((error) => {
      // CASO 3: Erro no login (e-mail/senha errados, usuário não existe, etc.)
      let errorMessage = "E-mail e/ou senha incorretos.";
      if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Acesso bloqueado por muitas tentativas. Tente novamente mais tarde.";
      }
      actions(errorMessage, "error");
    });
}

function register(event) {
  prepareLoginOrRegister(event);
  const email = form.email().value;
  const password = form.password().value;

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return user
        .updateProfile({
          displayName: form.name().value,
        })
        .then(() => {
          return user.sendEmailVerification();
        });
    })
    .then(() => {
      return auth.signOut();
    })
    .then(() => {
      $("#signupSuccessModal").modal("show");
      hideLoading();
      // Limpa os campos do formulário e desabilita o botão de cadastro
      clearFormFields();
    })
    .catch((error) => {
      actions("Erro ao cadastrar usuário: " + getErrorMessage(error), "error");
      clearFormFields();
    });
}

function clearFormFields() {
  form.name().value = "";
  form.email().value = "";
  form.confirmEmail().value = "";
  form.password().value = "";
  form.confirmPassword().value = "";
  registerButton.disabled = true;
  registerButtonDisabled = true;
}

function actions(message, type) {
  hideLoading();
  if (message) {
    if (type === "error") {
      showToast(message, "error");
    } else if (type === "success") {
      showToast(message, "success");
    }
  }
}

function validateFields() {
  if (pathName.includes("login.html")) {
    if (
      isEmailValid(form.email().value) &&
      isPasswordValid(form.password().value)
    ) {
      loginHelp.style.display = "none";
      loginButton.disabled = false;
      loginButtonDisabled = false;
    } else {
      loginHelp.style.display = "";
      loginButton.disabled = true;
      loginButtonDisabled = true;
    }
  } else if (pathName.includes("signup.html")) {
    // E-mail e senha coincidem
    if (
      form.email().value === form.confirmEmail().value &&
      form.password().value === form.confirmPassword().value
    ) {
      help.innerHTML = "";
      if (
        form.name().value.trim().length > 0 &&
        isEmailValid(form.email().value) &&
        isPasswordValid(form.password().value)
      ) {
        signupHelp.style.display = "none";
        registerButton.disabled = false;
        registerButtonDisabled = false;
      } else {
        signupHelp.style.display = "";
        registerButton.disabled = true;
        registerButtonDisabled = true;
        return;
      }
    } else {
      registerButton.disabled = true;
      registerButtonDisabled = true;
      if (form.email().value !== form.confirmEmail().value) {
        help.innerHTML = "<p class='mb-0 help-text'>E-mails não coincidem</p>";
      } else if (form.password().value !== form.confirmPassword().value) {
        help.innerHTML = "<p class='mb-0 help-text'>Senhas não coincidem</p>";
      }
      if (
        form.email().value !== form.confirmEmail().value &&
        form.password().value !== form.confirmPassword().value
      ) {
        help.innerHTML = "<p class='mb-0 help-text'>E-mails e senhas não coincidem</p>";
      }
      return;
    }
  }
}

function isEmailValid(email) {
  if (!email) return false;
  const regularExpression = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regularExpression.test(String(email).toLowerCase());
}

function isPasswordValid(password) {
  return password.length >= 8 ? true : false;
}

function getErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-credential":
      return "Usuário não encontrado. Verifique o email e a senha.";
    case "auth/invalid-email":
      return "E-mail inválido. Verifique o formato e tente novamente.";
    case "auth/weak-password":
      return "A senha é muito fraca. Deve ter pelo menos 8 caracteres.";
    case "auth/email-already-in-use":
      return "E-mail já cadastrado. Tente outro.";
    default:
      return "Ocorreu um erro inesperado. Por favor, tente novamente.";
  }
}
