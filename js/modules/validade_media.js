const modalPreview = document.getElementById("mediaPreviewModal");
const previewContent = document.getElementById("mediaPreviewContent");

document.addEventListener("DOMContentLoaded", function () {
  // Remover foco do botão de fechar ao fechar modais
  $("#helpMediaModal, #mediaPreviewModal").on("hide.bs.modal", function () {
    const closeBtn = this.querySelector(".close");
    if (closeBtn && document.activeElement === closeBtn) {
      closeBtn.blur();
    }
  });

  mediaPreview();

  // Abrir modal de ajuda ao clicar no botão 'Ajuda'
  const helpBtn = document.getElementById("helpMediaBtn");
  $(helpBtn).on("click", function () {
    $("#helpMediaModal").modal("show");
    helpBtn._openedModal = true;
  });

  // Ao fechar o modal de ajuda, devolver foco ao botão 'Ajuda'
  $("#helpMediaModal").on("hidden.bs.modal", function () {
    if (helpBtn._openedModal) {
      helpBtn.focus();
      helpBtn._openedModal = false;
    }
  });

  // Abrir modal de prévia ao clicar no botão 'Prévia'
  const previewBtn = document.getElementById("previewMediaBtn");
  $("#mediaPreviewModal").on("shown.bs.modal", function () {
    previewBtn._openedModal = true;
  });
  $("#mediaPreviewModal").on("hidden.bs.modal", function () {
    document.getElementById("mediaPreviewContent").innerHTML = "";
    if (previewBtn._openedModal) {
      previewBtn.focus();
      previewBtn._openedModal = false;
    }
  });
});

function mediaPreview() {
  document.getElementById("previewMediaBtn").onclick = function () {
    const url = mediaURL.value.trim();
    // previewContent.innerHTML = "";
    
    if (!url) {
      previewContent.innerHTML =
        '<p class="text-warning">Insira um link válido.</p>';
      $(modalPreview).modal("show");
      return;
    }

    const img = new Image();
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "400px";
    img.style.borderRadius = "8px";
    img.alt = "Prévia da mídia de apoio";
    img.onload = function () {
      previewContent.innerHTML = "";
      previewContent.appendChild(img);
      $(modalPreview).modal("show");
    };
    img.onerror = function () {
      // Se não for imagem, tenta vídeo ou YouTube
      if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
        previewContent.innerHTML = `<video src="${url}" controls style="max-width:100%;max-height:400px;border-radius:8px;"></video>`;
      } else if (isYouTubeUrl(url)) {
        const embedUrl = getYouTubeEmbedUrl(url);
        if (embedUrl) {
          previewContent.innerHTML = `<iframe width="100%" height="315" src="${embedUrl}?controls=1&autoplay=0" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
        } else {
          previewContent.innerHTML =
            '<p class="text-warning">Link do YouTube inválido.</p>';
        }
      } else {
        previewContent.innerHTML =
          '<p class="text-warning">Formato não suportado ou link inválido. <br> Clique em❓para saber mais. </p>';
      }
      $(modalPreview).modal("show");
    };
  };
}

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
