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

export function updateCatapult(catapult, deltaTime) {
  if (!catapult) return;

  // Rotación vertical (ángulo de disparo)
  if (keyStates.ArrowUp) {
    catapult.userData.angle = Math.min(
      catapult.userData.angle + 60 * deltaTime,
      80
    );
  }
  if (keyStates.ArrowDown) {
    catapult.userData.angle = Math.max(
      catapult.userData.angle - 60 * deltaTime,
      10
    );
  }

  // Rotación horizontal
  if (keyStates.ArrowLeft) {
    catapult.userData.baseRotation += ((60 * Math.PI) / 180) * deltaTime;
  }
  if (keyStates.ArrowRight) {
    catapult.userData.baseRotation -= ((60 * Math.PI) / 180) * deltaTime;
  }

  // Potencia
  if (keyStates.KeyQ) {
    catapult.userData.power = Math.min(
      catapult.userData.power + 100 * deltaTime,
      MAX_POWER
    );
  }
  if (keyStates.KeyA) {
    catapult.userData.power = Math.max(
      catapult.userData.power - 100 * deltaTime,
      MIN_POWER
    );
  }

  // Aplicar rotación horizontal a toda la catapulta
  catapult.rotation.y = catapult.userData.baseRotation;

  // Aplicar rotación vertical al brazo
  const angleRad = (catapult.userData.angle * Math.PI) / 180;

  // Buscar el grupo del brazo en la catapulta
  let armGroup = catapult.userData.armGroup;

  // Si no está en userData, buscarlo recursivamente
  if (!armGroup) {
    catapult.traverse((child) => {
      if (child.name === "catapultArm") {
        armGroup = child;
      }
    });
  }

  if (armGroup) {
    // Calcular rotación del brazo (-π/6 es posición inicial, 0 es horizontal)
    // Mapear ángulo de 10° a 80° a rotación de -π/3 a π/6
    const minAngle = (10 * Math.PI) / 180;
    const maxAngle = (80 * Math.PI) / 180;
    const armRotation = THREE.MathUtils.mapLinear(
      angleRad,
      minAngle,
      maxAngle,
      -Math.PI / 3,
      Math.PI / 6
    );

    armGroup.rotation.z = armRotation;
  }

  // Actualizar valores exportados
  angle = catapult.userData.angle;
  power = catapult.userData.power;
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
