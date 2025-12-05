import * as THREE from "three";

export let angle = 45;
export let power = 50;
export let projectileType = "rock";
export let inputEnabled = true;
export const MAX_POWER = 200;
export const MIN_POWER = 10;

// Objeto global para el estado de las teclas
export const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyQ: false,
  KeyA: false,
};

// Función que SÍ se ejecuta cuando presionas teclas
export function handleInput(event) {
  if (!inputEnabled) return;

  // Siempre actualizar keyStates
  if (event.type === "keydown") {
    keyStates[event.code] = true;
    console.log(`Tecla presionada: ${event.code}`); // Para debug

    // Cambiar tipo de proyectil con F
    if (event.code === "KeyF") {
      projectileType = projectileType === "rock" ? "bomb" : "rock";
      console.log(`Proyectil cambiado a: ${projectileType}`);
    }

    // Espacio para disparar
    if (event.code === "Space") {
      console.log("Espacio presionado - disparar desde main.js");
    }

    // Mostrar mensajes específicos para Q y A
    if (event.code === "KeyQ") {
      console.log("Tecla Q presionada - aumentar potencia");
    }
    if (event.code === "KeyA") {
      console.log("Tecla A presionada - disminuir potencia");
    }
  } else if (event.type === "keyup") {
    keyStates[event.code] = false;
  }

  // Prevenir comportamiento por defecto para las flechas, Q y A
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

// ¡ESTA ES LA FUNCIÓN CLAVE! Se llama en cada frame
export function updateCatapult(catapult, deltaTime) {
  if (!catapult || !catapult.userData) {
    console.warn("No hay catapulta o userData");
    return;
  }

  const userData = catapult.userData;

  // ---- CONTROL DE POTENCIA (Teclas Q/A) ----
  if (keyStates.KeyQ) {
    // Tecla Q - Aumentar potencia
    userData.power += 1 * deltaTime * 60; // Incremento suave
    userData.power = Math.min(userData.power, MAX_POWER); // Limitar a máximo
    console.log(`Q - Potencia aumentada: ${userData.power.toFixed(1)}`);
  }

  if (keyStates.KeyA) {
    // Tecla A - Disminuir potencia
    userData.power -= 1 * deltaTime * 60; // Decremento suave
    userData.power = Math.max(userData.power, MIN_POWER); // Limitar a mínimo
    console.log(`A - Potencia disminuida: ${userData.power.toFixed(1)}`);
  }

  // ---- CONTROL DE ELEVACIÓN (Flechas Arriba/Abajo) ----
  if (keyStates.ArrowUp) {
    userData.currentElevation += 0.03 * deltaTime * 60;
  }

  if (keyStates.ArrowDown) {
    userData.currentElevation -= 0.03 * deltaTime * 60;
  }

  // Limitar elevación entre 10° y 80°
  userData.currentElevation = Math.max(
    userData.minElevation,
    Math.min(userData.maxElevation, userData.currentElevation)
  );

  // ---- CONTROL DE ROTACIÓN (Flechas Izquierda/Derecha) ----
  if (keyStates.ArrowLeft) {
    userData.baseRotation += 0.04 * deltaTime * 60;
  }

  if (keyStates.ArrowRight) {
    userData.baseRotation -= 0.04 * deltaTime * 60;
  }

  // ---- APLICAR LAS TRANSFORMACIONES VISUALES ----

  // 1. Aplicar elevación al cañón
  if (userData.barrelGroup) {
    userData.barrelGroup.rotation.x = -userData.currentElevation;
  }

  // 2. Aplicar rotación horizontal a TODO el cañón
  catapult.rotation.y = Math.PI + userData.baseRotation;

  // Actualizar variables globales para el HUD
  angle = (userData.currentElevation * 180) / Math.PI;
  power = userData.power; // ¡IMPORTANTE! Actualizar la variable global de potencia
}

export function getLaunchDirection(catapult) {
  const angleRad = (catapult.userData.angle * Math.PI) / 180;

  // Para catapulta medieval, la dirección es más horizontal
  // Ajustar el vector de dirección para que sea más realista
  const launchAngle = angleRad * 1.2; // Aumentar ligeramente el ángulo efectivo

  const direction = new THREE.Vector3(
    0,
    Math.sin(launchAngle) * 0.8 + 0.2, // Más componente horizontal
    -Math.cos(launchAngle)
  );

  // Rotar según la orientación de la catapulta
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

    // Fallback: calcular desde offset
    const offset =
      userData.projectileStartOffset || new THREE.Vector3(1.05, 0, 0);
    let rotatedOffset = offset.clone();

    // Aplicar elevación (NEGATIVA, igual que visualmente)
    rotatedOffset.applyEuler(
      new THREE.Euler(-(userData.currentElevation || 0), 0, 0)
    );

    // Aplicar rotación horizontal
    rotatedOffset.applyEuler(new THREE.Euler(0, userData.baseRotation || 0, 0));

    // Aplicar rotación inicial del cañón (180°)
    rotatedOffset.applyEuler(new THREE.Euler(0, Math.PI, 0));

    return catapult.position.clone().add(rotatedOffset);
  }

  // Para catapulta (código original)
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

  // Fallback
  return new THREE.Vector3(-25, 3, 0);
}

export function getLaunchVelocity(catapult) {
  if (!catapult || !catapult.userData) {
    return new THREE.Vector3(0, 10, 0);
  }

  const userData = catapult.userData;
  const powerValue = userData.power || 30;

  // Para cañón pirata
  if (userData.type === "pirate-cannon") {
    const baseVelocity = 20 + (powerValue / 100) * 30;
    const direction = new THREE.Vector3(0, 0, 1);

    // Aplicar elevación NEGATIVA (igual que visualmente)
    const elevation = userData.currentElevation || (45 * Math.PI) / 180;
    direction.applyEuler(new THREE.Euler(-elevation, 0, 0));

    // Aplicar rotación horizontal
    direction.applyEuler(new THREE.Euler(0, userData.baseRotation || 0, 0));

    // Aplicar rotación inicial del cañón (180°)
    direction.applyEuler(new THREE.Euler(0, Math.PI, 0));

    return direction.multiplyScalar(baseVelocity);
  }

  // Para catapulta (código original)
  const angleRad = (userData.angle * Math.PI) / 180;
  const launchAngle = angleRad * 1.2;

  const direction = new THREE.Vector3(
    0,
    Math.sin(launchAngle) * 0.8 + 0.2,
    -Math.cos(launchAngle)
  );

  // Rotar según la orientación de la catapulta
  direction.applyEuler(new THREE.Euler(0, catapult.rotation.y, 0));

  // Ajustar escala para catapulta medieval
  const velocity = powerValue / 15;
  return direction.normalize().multiplyScalar(velocity);
}
