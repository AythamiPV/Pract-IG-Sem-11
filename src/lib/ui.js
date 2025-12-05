export function initUI(startGameCallback) {
  const startBtn = document.getElementById("start-btn");
  const helpBtn = document.getElementById("help-btn");
  const helpModal = document.getElementById("help-modal");
  const closeHelp = document.getElementById("close-help");
  const modalOverlay = document.getElementById("modal-overlay");

  // Inicializar elementos ocultos
  helpModal.style.display = "none";
  modalOverlay.style.display = "none";

  startBtn.onclick = () => {
    console.log("Botón Comenzar clickeado");
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("hud").style.display = "block";
    document.querySelector(".level-indicator").style.display = "block";
    document.querySelector(".projectile-indicator").style.display = "block";

    if (typeof startGameCallback === "function") {
      startGameCallback();
    } else {
      console.error("startGameCallback no es una función");
    }
  };

  // Botón de ayuda - mostrar modal
  helpBtn.onclick = () => {
    console.log("Mostrando controles");
    helpModal.style.display = "block";
    modalOverlay.style.display = "block";

    // Añadir clase para animación
    setTimeout(() => {
      helpModal.classList.add("show");
      modalOverlay.classList.add("show");
    }, 10);
  };

  // Cerrar ayuda con botón
  closeHelp.onclick = () => {
    closeHelpModal();
  };

  // Cerrar ayuda con overlay
  modalOverlay.onclick = () => {
    closeHelpModal();
  };

  // También cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && helpModal.style.display === "block") {
      closeHelpModal();
    }
  });

  function closeHelpModal() {
    helpModal.classList.remove("show");
    modalOverlay.classList.remove("show");

    // Esperar a que termine la animación antes de ocultar
    setTimeout(() => {
      helpModal.style.display = "none";
      modalOverlay.style.display = "none";
    }, 300);
  }

  console.log("UI inicializada correctamente");
}

export function updateHUD(ammo, angle, power, projectileType, maxPower = 200) {
  const angleElement = document.getElementById("angle");
  const powerElement = document.getElementById("power");
  const rockAmmoElement = document.getElementById("rockAmmo");
  const bombAmmoElement = document.getElementById("bombAmmo");
  const currentProjElement = document.getElementById("current-proj");

  if (angleElement) angleElement.textContent = Math.round(angle);
  if (powerElement) {
    const percentage = Math.round((power / maxPower) * 100);
    powerElement.textContent = `${Math.round(power)} (${percentage}%)`;
  }
  if (rockAmmoElement) rockAmmoElement.textContent = ammo.rock;
  if (bombAmmoElement) bombAmmoElement.textContent = ammo.bomb;

  if (currentProjElement) {
    const projName = projectileType === "rock" ? "Roca" : "Bomba";
    const projColor = projectileType === "rock" ? "#4CAF50" : "#FF5722";

    currentProjElement.textContent = projName;
    currentProjElement.style.color = projColor;
  }
}

export function updateLevelInfo(levelIndex, difficulty) {
  const currentLevelElement = document.getElementById("current-level");
  const difficultyElement = document.getElementById("difficulty");

  if (currentLevelElement) currentLevelElement.textContent = levelIndex + 1;
  if (difficultyElement) difficultyElement.textContent = difficulty;
}

export function showLevelComplete(level, ammoUsed, time) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      padding: 30px;
      border-radius: 15px;
      color: white;
      text-align: center;
      z-index: 2000;
      min-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;

    modal.innerHTML = `
      <h2 style="color: #4CAF50; margin-top: 0;">¡Nivel ${level} Completado!</h2>
      <p>Tiempo: <strong>${time.toFixed(1)}</strong> segundos</p>
      <p>Rocas usadas: <strong>${ammoUsed.rock}</strong></p>
      <p>Bombas usadas: <strong>${ammoUsed.bomb}</strong></p>
      <button id="next-level-btn" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: linear-gradient(to right, #4CAF50, #45a049);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: transform 0.2s;
        width: 100%;
      ">${level < 3 ? "Siguiente Nivel" : "Jugar de Nuevo"}</button>
    `;

    document.body.appendChild(modal);

    document.getElementById("next-level-btn").onclick = () => {
      modal.remove();
      resolve(true);
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        modal.remove();
        window.removeEventListener("keydown", handleKey);
        resolve(true);
      }
    };
    window.addEventListener("keydown", handleKey);
  });
}

export function showGameOver() {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      padding: 30px;
      border-radius: 15px;
      color: white;
      text-align: center;
      z-index: 2000;
      min-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;

    modal.innerHTML = `
      <h2 style="color: #ff4444; margin-top: 0;">Game Over</h2>
      <p>Te has quedado sin munición</p>
      <button id="restart-btn" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: linear-gradient(to right, #ff416c, #ff4b2b);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: transform 0.2s;
        width: 100%;
      ">Reiniciar desde Nivel 1</button>
    `;

    document.body.appendChild(modal);

    document.getElementById("restart-btn").onclick = () => {
      modal.remove();
      resolve(true);
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        modal.remove();
        window.removeEventListener("keydown", handleKey);
        resolve(true);
      }
    };
    window.addEventListener("keydown", handleKey);
  });
}
