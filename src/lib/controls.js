import * as THREE from "three";

export let angle = 45;
export let power = 50;
export let projectileType = "rock";
export let inputEnabled = true;
export const MAX_POWER = 100;
export const MIN_POWER = 5;

export const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyQ: false,
  KeyA: false,
};

export function handleInput(event) {
  if (!inputEnabled) return;

  if (event.type === "keydown") {
    keyStates[event.code] = true;

    if (event.code === "KeyF") {
      projectileType = projectileType === "rock" ? "bomb" : "rock";
      console.log(`Proyectil cambiado a: ${projectileType}`);
    }

    if (event.code === "Space") {
      console.log("Espacio presionado - disparar desde main.js");
    }

    if (event.code === "KeyQ") {
      console.log("Tecla Q presionada - aumentar potencia");
    }
    if (event.code === "KeyA") {
      console.log("Tecla A presionada - disminuir potencia");
    }
  } else if (event.type === "keyup") {
    keyStates[event.code] = false;
  }

  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyQ",
      "KeyA",
    ].includes(event.code)
  ) {
    event.preventDefault();
  }
}

export function resetInputState() {
  angle = 45;
  power = 50;
  projectileType = "rock";
  inputEnabled = true;

  for (const key in keyStates) {
    keyStates[key] = false;
  }
}

export function updateCatapult(catapult, deltaTime) {
  if (!catapult || !catapult.userData) {
    console.warn("No hay catapulta o userData");
    return;
  }

  const userData = catapult.userData;

  // ---- CONTROL DE POTENCIA (Teclas Q/A) ----
  if (keyStates.KeyQ) {
    userData.power += 1 * deltaTime * 60;
    userData.power = Math.min(userData.power, MAX_POWER);
  }

  if (keyStates.KeyA) {
    userData.power -= 1 * deltaTime * 60;
    userData.power = Math.max(userData.power, MIN_POWER);
  }

  // ---- CONTROL DE ELEVACIÓN (Flechas Arriba/Abajo) ----
  if (keyStates.ArrowUp) {
    userData.currentElevation += 0.0055 * deltaTime * 60;
  }

  if (keyStates.ArrowDown) {
    userData.currentElevation -= 0.0055 * deltaTime * 60;
  }

  // Limitar elevación entre 10° y 80°
  userData.currentElevation = Math.max(
    userData.minElevation,
    Math.min(userData.maxElevation, userData.currentElevation)
  );

  // ---- CONTROL DE ROTACIÓN (Flechas Izquierda/Derecha) ----
  if (keyStates.ArrowLeft) {
    userData.baseRotation += 0.005 * deltaTime * 60;
  }

  if (keyStates.ArrowRight) {
    userData.baseRotation -= 0.005 * deltaTime * 60;
  }

  // ---- APLICAR LAS TRANSFORMACIONES VISUALES ----
  if (userData.barrelGroup) {
    userData.barrelGroup.rotation.x = -userData.currentElevation;
  }
  catapult.rotation.y = userData.initialRotation + userData.baseRotation;
  angle = (userData.currentElevation * 180) / Math.PI;
  power = userData.power;
}

export function getLaunchDirection(catapult) {
  const angleRad = (catapult.userData.angle * Math.PI) / 180;
  const launchAngle = angleRad * 1.2;

  const direction = new THREE.Vector3(
    0,
    Math.sin(launchAngle) * 0.8 + 0.2,
    -Math.cos(launchAngle)
  );

  direction.applyEuler(new THREE.Euler(0, catapult.rotation.y, 0));

  return direction.normalize();
}

export function getProjectileStartPosition(catapult) {
  if (!catapult || !catapult.userData) {
    return new THREE.Vector3(0, 1, -15);
  }

  const userData = catapult.userData;

  // Para cañón pirata
  if (userData.type === "pirate-cannon") {
    if (userData.muzzle) {
      const worldPosition = new THREE.Vector3();
      userData.muzzle.getWorldPosition(worldPosition);
      return worldPosition;
    }
    const offset =
      userData.projectileStartOffset || new THREE.Vector3(0, 0, 1.05);
    let rotatedOffset = offset.clone();
    rotatedOffset.applyEuler(
      new THREE.Euler(-(userData.currentElevation || 0), 0, 0)
    );
    rotatedOffset.applyEuler(new THREE.Euler(0, userData.baseRotation || 0, 0));
    const initialRotation = userData.initialRotation || Math.PI;
    rotatedOffset.applyEuler(new THREE.Euler(0, initialRotation, 0));
    const initialPosition =
      userData.initialPosition ||
      catapult.position ||
      new THREE.Vector3(0, 0, -15);

    return initialPosition.clone().add(rotatedOffset);
  }
  let cup = userData.cup;
  if (!cup) {
    catapult.traverse((child) => {
      if (child.name === "catapultCup") {
        cup = child;
      }
    });
  }

  if (cup) {
    const worldPosition = new THREE.Vector3();
    cup.getWorldPosition(worldPosition);
    return worldPosition;
  }

  return new THREE.Vector3(-25, 3, 0);
}

export function getLaunchVelocity(catapult) {
  if (!catapult || !catapult.userData) {
    return new THREE.Vector3(0, 10, 0);
  }

  const userData = catapult.userData;
  const powerValue = userData.power || 30;

  if (userData.type === "pirate-cannon") {
    const baseVelocity = 20 + (powerValue / 100) * 30;
    const direction = new THREE.Vector3(0, 0, 1);

    const elevation = userData.currentElevation || (45 * Math.PI) / 180;
    direction.applyEuler(new THREE.Euler(-elevation, 0, 0));

    direction.applyEuler(new THREE.Euler(0, userData.baseRotation || 0, 0));

    const initialRotation = userData.initialRotation || Math.PI;
    direction.applyEuler(new THREE.Euler(0, initialRotation, 0));

    return direction.multiplyScalar(baseVelocity);
  }

  const angleRad = (userData.angle * Math.PI) / 180;
  const launchAngle = angleRad * 1.2;

  const direction = new THREE.Vector3(
    0,
    Math.sin(launchAngle) * 0.8 + 0.2,
    -Math.cos(launchAngle)
  );

  direction.applyEuler(new THREE.Euler(0, catapult.rotation.y, 0));

  const velocity = powerValue / 15;
  return direction.normalize().multiplyScalar(velocity);
}
