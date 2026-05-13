const db = firebase.firestore();

function createQuiz() {
  const title = document.getElementById("quizTitle").value;
  const description = document.getElementById("quizDescription").value;
  const mediaURL = document.getElementById("mediaURL").value.trim();
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  
  if (!title || !description) {
    showToast("O título e a descrição do quiz são obrigatórios.", "warning");
    return;
  }

  if (mediaURL !== "" && !isValidUrl(mediaURL)) {
    showToast("A URL da mídia é inválida.", "warning");
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    showToast("Você precisa estar logado para criar um quiz.", "warning");
    return;
  }
  db.collection("quizzes")
    .add({
      difficulty: difficulty,
      title: title,
      description: description,
      mediaURL: mediaURL ? mediaURL : null,
      owner: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then((docRef) => {
      window.location.href = `create_questions.html?quizId=${docRef.id}`;
    })
    .catch((error) => {
      showToast("Ocorreu um erro ao criar o quiz: " + error.message, "error");
    });
}

function clearMediaURL() {
  document.getElementById("mediaURL").value = "";
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}
