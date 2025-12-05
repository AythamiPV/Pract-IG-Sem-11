import * as THREE from "three";

export let angle = 45;
export let power = 50;
export let projectileType = "rock";
export let inputEnabled = true;
export const MAX_POWER = 200;
export const MIN_POWER = 10;

const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyQ: false,
  KeyA: false,
};

export function resetInputState() {
  angle = 45;
  power = 50;
  projectileType = "rock";
  inputEnabled = true;

  for (const key in keyStates) {
    keyStates[key] = false;
  }
}

export function handleInput(event) {
  if (!inputEnabled) return;

  if (event.type === "keydown") {
    keyStates[event.code] = true;

    if (event.code === "KeyF") {
      projectileType = projectileType === "rock" ? "bomb" : "rock";
    }
  } else if (event.type === "keyup") {
    keyStates[event.code] = false;
  }
}

// Añade esta función si no existe, o modifica la existente
export function updateCatapult(catapult, deltaTime) {
  if (!catapult || !catapult.userData) return;

  // Si es un cañón pirata
  if (catapult.userData.type === "pirate-cannon") {
    // Actualizar elevación (arriba/abajo)
    if (catapult.userData.isRotating && catapult.userData.barrelGroup) {
      catapult.userData.currentElevation +=
        catapult.userData.rotationDirection *
        catapult.userData.rotationSpeed *
        deltaTime;

      // Limitar elevación
      catapult.userData.currentElevation = Math.max(
        catapult.userData.minElevation,
        Math.min(
          catapult.userData.maxElevation,
          catapult.userData.currentElevation
        )
      );

      // Aplicar rotación al grupo del cañón (elevación)
      catapult.userData.barrelGroup.rotation.x =
        catapult.userData.currentElevation;

      // Detener si alcanza los límites
      if (
        catapult.userData.currentElevation <= catapult.userData.minElevation ||
        catapult.userData.currentElevation >= catapult.userData.maxElevation
      ) {
        catapult.userData.isRotating = false;
      }
    }

    // Actualizar rotación horizontal (izquierda/derecha)
    if (catapult.userData.isBaseRotating) {
      catapult.userData.baseRotation +=
        catapult.userData.baseRotationDirection *
        catapult.userData.baseRotationSpeed *
        deltaTime;

      // Limitar rotación horizontal
      catapult.userData.baseRotation = Math.max(
        -catapult.userData.maxBaseRotation,
        Math.min(
          catapult.userData.maxBaseRotation,
          catapult.userData.baseRotation
        )
      );

      // Aplicar rotación horizontal al grupo completo
      catapult.rotation.y = Math.PI + catapult.userData.baseRotation; // Math.PI es la rotación base

      // Detener si alcanza los límites
      if (
        catapult.userData.baseRotation <= -catapult.userData.maxBaseRotation ||
        catapult.userData.baseRotation >= catapult.userData.maxBaseRotation
      ) {
        catapult.userData.isBaseRotating = false;
      }
    }
  }
  // Si es catapulta simple (mantener compatibilidad)
  else if (catapult.userData.armGroup) {
    // Código original para catapulta...
  }
}

export function getProjectileStartPosition(catapult) {
  if (!catapult) {
    return new THREE.Vector3(-25, 2, 0);
  }

  // Buscar la copa recursivamente si no está en userData
  let cup = catapult.userData.cup;

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

  // Fallback: posición aproximada
  return new THREE.Vector3(-25, 3, 0);
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

export function getLaunchVelocity(catapult) {
  const direction = getLaunchDirection(catapult);
  // Ajustar escala para catapulta medieval (más potencia)
  const velocity = catapult.userData.power / 12; // Antes era /15
  return direction.multiplyScalar(velocity);
}

export { keyStates };
