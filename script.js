// Referências dos elementos
const btnVote = document.getElementById("btnVote");
const status = document.getElementById("status");
const loginSection = document.getElementById("loginSection"); // seção login
const voteSection = document.getElementById("voteSection");   // seção de voto

let currentUser = null;
let desafioAtivo = false; // variável global para controlar status do desafio

// Função para verificar se o desafio está ativo (consultando o Firestore)
async function verificarDesafioAtivo() {
  try {
    const doc = await db.collection("controle").doc("desafio").get();
    if (doc.exists) {
      const data = doc.data();
      const agora = new Date();
      const inicio = new Date(data.inicio);
      const fim = new Date(data.fim);
      return agora >= inicio && agora <= fim;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar desafio:", error);
    return false;
  }
}

// Monitorar mudança de estado de autenticação
firebase.auth().onAuthStateChanged(async (user) => {
  if (user && !user.isAnonymous) {
    currentUser = user;

    desafioAtivo = await verificarDesafioAtivo(); // Verifica se o desafio está liberado

    // Mostrar ou esconder botão com base no status do desafio
    btnVote.disabled = !desafioAtivo;
    btnVote.style.display = desafioAtivo ? "inline-block" : "none";
    status.textContent = `Olá, ${user.displayName || user.email}`;

    // Esconder login e mostrar voto
    loginSection.style.display = "none";
    voteSection.style.display = "block";
  } else {
    currentUser = null;

    btnVote.disabled = true;
    btnVote.style.display = "none";
    status.textContent = "Você precisa fazer login para votar (não pode ser anônimo).";

    loginSection.style.display = "block";
    voteSection.style.display = "none";
  }
});

// Atualizar status do desafio a cada 10 segundos
setInterval(async () => {
  if (!currentUser) return;

  const ativo = await verificarDesafioAtivo();
  desafioAtivo = ativo;

  btnVote.disabled = !ativo;
  btnVote.style.display = ativo ? "inline-block" : "none";
}, 10000); // 10 segundos

// Evento botão votar
btnVote.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Você precisa estar logado para votar.");
    return;
  }

  if (!desafioAtivo) {
    alert("O desafio ainda não está liberado.");
    return;
  }

  const userId = currentUser.uid;
  const userName = currentUser.displayName || currentUser.email;
  const userDoc = db.collection("votes").doc(userId);

  try {
    const doc = await userDoc.get();
    if (doc.exists) {
      alert("Você já votou uma vez e não pode votar novamente.");
      return;
    }

    await userDoc.set({
      nome: userName,
      voto: 1,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    alert("Voto registrado com sucesso!");
  } catch (error) {
    alert("Erro ao registrar voto: " + error.message);
  }
});
