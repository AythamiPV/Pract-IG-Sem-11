import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createRigidBody, Ammo } from "./physics.js";

// Materiales básicos (sin texturas)
const materials = {
  movable: new THREE.MeshBasicMaterial({ color: 0x8b4513 }),
  immovable: new THREE.MeshBasicMaterial({ color: 0x808080 }),
  rock: new THREE.MeshBasicMaterial({ color: 0x777777 }),
  bomb: new THREE.MeshBasicMaterial({ color: 0x000000 }),
  enemy: new THREE.MeshBasicMaterial({ color: 0x000000 }),
  wood: new THREE.MeshBasicMaterial({ color: 0x8b4513 }),
  metal: new THREE.MeshBasicMaterial({ color: 0x666666 }),
  ground: new THREE.MeshBasicMaterial({ color: 0x7cfc00 }),
  mountain: new THREE.MeshBasicMaterial({ color: 0x888888 }),
};

const gltfLoader = new GLTFLoader();

export function createGround(scene) {
  // Terreno principal plano (con física)
  const groundSize = 100;
  const groundGeometry = new THREE.PlaneGeometry(
    groundSize,
    groundSize,
    32,
    32
  );
  const ground = new THREE.Mesh(groundGeometry, materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;

  if (Ammo) {
    const groundShape = new Ammo.btBoxShape(
      new Ammo.btVector3(groundSize / 2, 0.5, groundSize / 2)
    );
    const pos = new THREE.Vector3(0, -0.5, 0);
    const quat = new THREE.Quaternion(0, 0, 0, 1);
    createRigidBody(ground, groundShape, 0, pos, quat);
  }

  scene.add(ground);

  // Crear montañas decorativas alrededor
  createMountains(scene, groundSize);

  return ground;
}

function createMountains(scene, groundSize) {
  // Crear un anillo de montañas alrededor del terreno - MUCHO MÁS ALEJADAS
  const innerRingRadius = groundSize * 1.5; // 150 unidades desde centro
  const outerRingRadius = groundSize * 2.0; // 200 unidades desde centro
  const numMountains = 32; // Más montañas para cubrir más área

  for (let i = 0; i < numMountains; i++) {
    const angle = (i / numMountains) * Math.PI * 2;

    // Posición en anillo (entre radio interno y externo)
    const radius =
      innerRingRadius + Math.random() * (outerRingRadius - innerRingRadius);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Variar altura y tamaño - montañas más grandes al estar más lejos
    const distanceFactor = radius / innerRingRadius;
    const baseHeight = 20 * distanceFactor;
    const height = baseHeight + Math.random() * 30 * distanceFactor;
    const width = 10 * distanceFactor + Math.random() * 15 * distanceFactor;
    const depth = 10 * distanceFactor + Math.random() * 15 * distanceFactor;

    // Crear montaña
    const mountain = createMountain(x, z, width, height, depth, angle);
    scene.add(mountain);
  }

  // Montañas más grandes en las esquinas - MUCHO MÁS ALEJADAS
  const cornerDistance = groundSize * 1.8; // 180 unidades
  createCornerMountain(scene, cornerDistance, cornerDistance, 35, 45); // Esquina NE
  createCornerMountain(scene, -cornerDistance, cornerDistance, 35, 45); // Esquina NW
  createCornerMountain(scene, cornerDistance, -cornerDistance, 35, 45); // Esquina SE
  createCornerMountain(scene, -cornerDistance, -cornerDistance, 35, 45); // Esquina SW

  // Montañas extra grandes para horizonte - MUY ALEJADAS
  const horizonDistance = groundSize * 2.2; // 220 unidades
  createLargeMountain(scene, 0, horizonDistance, 50, 60); // Norte
  createLargeMountain(scene, 0, -horizonDistance, 50, 60); // Sur
  createLargeMountain(scene, horizonDistance, 0, 50, 60); // Este
  createLargeMountain(scene, -horizonDistance, 0, 50, 60); // Oeste

  // Montañas diagonales adicionales
  const diagDistance = groundSize * 1.9;
  const diagOffset = diagDistance * Math.cos(Math.PI / 4);
  createMediumMountain(scene, diagOffset, diagOffset, 30, 40); // NE diagonal
  createMediumMountain(scene, -diagOffset, diagOffset, 30, 40); // NW diagonal
  createMediumMountain(scene, diagOffset, -diagOffset, 30, 40); // SE diagonal
  createMediumMountain(scene, -diagOffset, -diagOffset, 30, 40); // SW diagonal
}

function createMountain(x, z, width, height, depth, rotation) {
  // Geometría de montaña (cono para simular pico)
  const geometry = new THREE.ConeGeometry(width / 2, height, 8, 1);
  const mountain = new THREE.Mesh(geometry, materials.mountain);

  // Posicionar
  mountain.position.set(x, height / 2, z);
  mountain.rotation.y = rotation;

  // Añadir nieve en la cima para montañas altas
  if (height > 35) {
    const snowHeight = height * 0.15;
    const snowGeometry = new THREE.ConeGeometry(width / 3, snowHeight, 8, 1);
    const snow = new THREE.Mesh(
      snowGeometry,
      new THREE.MeshBasicMaterial({ color: 0xf0f8ff })
    ); // Azul nieve
    snow.position.set(0, height - snowHeight / 2, 0);
    mountain.add(snow);
  }

  // Marcar como decorativo (sin física)
  mountain.userData.isDecorative = true;
  mountain.userData.type = "mountain";

  return mountain;
}

function createMediumMountain(scene, x, z, baseSize, height) {
  const group = new THREE.Group();

  // Base
  const baseGeometry = new THREE.CylinderGeometry(
    baseSize,
    baseSize * 1.3,
    height * 0.5,
    10,
    1
  );
  const base = new THREE.Mesh(baseGeometry, materials.mountain);
  base.position.y = height * 0.25;

  // Pico
  const peakGeometry = new THREE.ConeGeometry(
    baseSize * 0.5,
    height * 0.6,
    8,
    1
  );
  const peak = new THREE.Mesh(peakGeometry, materials.mountain);
  peak.position.y = height * 0.5 + height * 0.3;

  group.add(base, peak);
  group.position.set(x, 0, z);

  // Rotar aleatoriamente
  group.rotation.y = Math.random() * Math.PI * 2;

  // Nieves en la cima
  if (height > 30) {
    const snowGeometry = new THREE.ConeGeometry(
      baseSize * 0.4,
      height * 0.1,
      8,
      1
    );
    const snow = new THREE.Mesh(
      snowGeometry,
      new THREE.MeshBasicMaterial({ color: 0xf0f8ff })
    );
    snow.position.y = height * 0.5 + height * 0.6 - height * 0.05;
    group.add(snow);
  }

  group.userData.isDecorative = true;
  group.userData.type = "mountain";

  scene.add(group);
  return group;
}

function createCornerMountain(scene, x, z, baseSize, height) {
  const group = new THREE.Group();

  // Base amplia
  const baseGeometry = new THREE.CylinderGeometry(
    baseSize,
    baseSize * 1.6,
    height * 0.5,
    12,
    1
  );
  const base = new THREE.Mesh(baseGeometry, materials.mountain);
  base.position.y = height * 0.25;

  // Cuerpo principal
  const bodyGeometry = new THREE.ConeGeometry(
    baseSize * 0.8,
    height * 0.7,
    10,
    1
  );
  const body = new THREE.Mesh(bodyGeometry, materials.mountain);
  body.position.y = height * 0.5 + height * 0.35;

  // Pico
  const peakGeometry = new THREE.ConeGeometry(
    baseSize * 0.3,
    height * 0.3,
    8,
    1
  );
  const peak = new THREE.Mesh(peakGeometry, materials.mountain);
  peak.position.y = height * 0.5 + height * 0.7 + height * 0.15;

  group.add(base, body, peak);
  group.position.set(x, 0, z);

  // Rotar para que se vea bien desde la catapulta
  const angleToCenter = Math.atan2(-z, -x);
  group.rotation.y = angleToCenter + Math.PI / 4;

  // Gran capa de nieve
  const snowGeometry = new THREE.ConeGeometry(
    baseSize * 0.25,
    height * 0.15,
    8,
    1
  );
  const snow = new THREE.Mesh(
    snowGeometry,
    new THREE.MeshBasicMaterial({ color: 0xf0f8ff })
  );
  snow.position.y =
    height * 0.5 + height * 0.7 + height * 0.15 - height * 0.075;
  group.add(snow);

  group.userData.isDecorative = true;
  group.userData.type = "mountain";
  group.userData.isLarge = true;

  scene.add(group);
  return group;
}

function createLargeMountain(scene, x, z, baseSize, height) {
  const group = new THREE.Group();

  // Base muy amplia
  const baseGeometry = new THREE.CylinderGeometry(
    baseSize * 1.5,
    baseSize * 2.0,
    height * 0.4,
    16,
    1
  );
  const base = new THREE.Mesh(baseGeometry, materials.mountain);
  base.position.y = height * 0.2;

  // Cuerpo principal
  const bodyGeometry = new THREE.ConeGeometry(baseSize, height * 0.8, 12, 1);
  const body = new THREE.Mesh(bodyGeometry, materials.mountain);
  body.position.y = height * 0.4 + height * 0.4;

  // Pico múltiple (crear varios picos)
  const numPeaks = 3;
  for (let i = 0; i < numPeaks; i++) {
    const peakSize = baseSize * (0.2 + Math.random() * 0.1);
    const peakHeight = height * (0.1 + Math.random() * 0.1);
    const peakOffset = (Math.random() - 0.5) * baseSize * 0.5;

    const peakGeometry = new THREE.ConeGeometry(peakSize, peakHeight, 6, 1);
    const peak = new THREE.Mesh(peakGeometry, materials.mountain);
    peak.position.set(
      peakOffset,
      height * 0.4 + height * 0.8 + peakHeight / 2,
      0
    );
    group.add(peak);

    // Nieve en picos
    const snowGeometry = new THREE.ConeGeometry(
      peakSize * 0.8,
      peakHeight * 0.3,
      6,
      1
    );
    const snow = new THREE.Mesh(
      snowGeometry,
      new THREE.MeshBasicMaterial({ color: 0xf0f8ff })
    );
    snow.position.set(peakOffset, height * 0.4 + height * 0.8 + peakHeight, 0);
    group.add(snow);
  }

  group.add(base, body);
  group.position.set(x, 0, z);

  // Orientar hacia el centro
  const angleToCenter = Math.atan2(-z, -x);
  group.rotation.y = angleToCenter;

  group.userData.isDecorative = true;
  group.userData.type = "mountain";
  group.userData.isLarge = true;

  scene.add(group);
  return group;
}

export function createBrick(type, position, rotation = 0, isStable = true) {
  const isMovable = type === "movable";
  const isVertical = rotation === 90;

  let size;
  if (isVertical) {
    // Ladrillo vertical: 0.6 (ancho) x 1.2 (alto) x 0.6 (profundo)
    size = { x: 0.6, y: 1.2, z: 0.6 };
  } else {
    // Ladrillo horizontal: 1.2 (largo) x 0.6 (alto) x 0.6 (ancho)
    size = { x: 1.2, y: 0.6, z: 0.6 };
  }

  // Material con textura para ladrillos
  let brickMaterial;
  if (isMovable) {
    // Ladrillo marrón con textura de madera
    brickMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b4513,
      map: createBrickTexture(0x8b4513, isVertical),
    });
  } else {
    // Ladrillo gris con textura de piedra
    brickMaterial = new THREE.MeshBasicMaterial({
      color: 0x808080,
      map: createBrickTexture(0x808080, isVertical),
    });
  }

  const brick = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    brickMaterial
  );

  // La posición ya viene calculada con el centro correcto desde levels.js
  brick.position.copy(position);
  brick.castShadow = true;
  brick.receiveShadow = true;
  brick.userData.type = "brick";
  brick.userData.brickType = type;
  brick.userData.isVertical = isVertical;
  brick.userData.rotation = rotation;

  if (Ammo) {
    const mass = isMovable ? 2 : 0;
    const shape = new Ammo.btBoxShape(
      new Ammo.btVector3(size.x / 2, size.y / 2, size.z / 2)
    );

    // Crear cuaternión para la rotación
    const quat = new THREE.Quaternion();
    if (isVertical) {
      // Para ladrillos verticales, rotar 90 grados en X
      quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    }

    const physicsPos = new THREE.Vector3().copy(position);
    const isStaticStart = isStable && isMovable;

    createRigidBody(
      brick,
      shape,
      mass,
      physicsPos,
      quat,
      null,
      null,
      isStaticStart
    );
  }

  return brick;
}

// Función para crear texturas simples para ladrillos
function createBrickTexture(baseColor, isVertical) {
  // Crear un canvas para la textura
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  // Color base
  ctx.fillStyle = `rgb(${(baseColor >> 16) & 255}, ${(baseColor >> 8) & 255}, ${
    baseColor & 255
  })`;
  ctx.fillRect(0, 0, 64, 64);

  // Añadir patron de ladrillo
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";

  if (isVertical) {
    // Patrón para ladrillos verticales
    for (let x = 0; x < 64; x += 16) {
      ctx.fillRect(x, 0, 8, 64);
    }
    for (let y = 0; y < 64; y += 16) {
      ctx.fillRect(0, y, 64, 4);
    }
  } else {
    // Patrón para ladrillos horizontales
    for (let y = 0; y < 64; y += 16) {
      ctx.fillRect(0, y, 64, 8);
    }
    for (let x = 0; x < 64; x += 32) {
      ctx.fillRect(x, 0, 4, 64);
    }
  }

  // Crear textura desde el canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(isVertical ? 2 : 4, isVertical ? 4 : 2);

  return texture;
}

export function createEnemy(position) {
  const group = new THREE.Group();

  // Cabeza
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    materials.enemy
  );
  head.position.y = 0.8;

  // Cuerpo
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
    materials.enemy
  );
  body.position.y = 0.3;

  // Brazos
  const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
  const leftArm = new THREE.Mesh(armGeometry, materials.enemy);
  leftArm.position.set(0.4, 0.6, 0);
  leftArm.rotation.z = Math.PI / 4;

  const rightArm = new THREE.Mesh(armGeometry, materials.enemy);
  rightArm.position.set(-0.4, 0.6, 0);
  rightArm.rotation.z = -Math.PI / 4;

  // Piernas
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
  const leftLeg = new THREE.Mesh(legGeometry, materials.enemy);
  leftLeg.position.set(0.15, -0.2, 0);
  leftLeg.rotation.z = Math.PI / 8;

  const rightLeg = new THREE.Mesh(legGeometry, materials.enemy);
  rightLeg.position.set(-0.15, -0.2, 0);
  rightLeg.rotation.z = -Math.PI / 8;

  group.add(head, body, leftArm, rightArm, leftLeg, rightLeg);
  group.position.copy(position);
  group.userData.type = "enemy";

  if (Ammo) {
    const shape = new Ammo.btSphereShape(0.5);
    const mass = 1;
    const quat = new THREE.Quaternion();
    createRigidBody(group, shape, mass, position, quat);
  }

  return group;
}

export function createProjectile(type, position, velocity = null) {
  const isBomb = type === "bomb";
  const radius = isBomb ? 0.4 : 0.35;

  const geometry = isBomb
    ? new THREE.SphereGeometry(radius, 16, 16)
    : new THREE.SphereGeometry(radius, 12, 8);

  const material = isBomb ? materials.bomb : materials.rock;
  const projectile = new THREE.Mesh(geometry, material);
  projectile.position.copy(position);
  projectile.castShadow = true;
  projectile.userData.type = "projectile";
  projectile.userData.projectileType = type;
  projectile.userData.isBomb = isBomb;

  if (Ammo) {
    const shape = new Ammo.btSphereShape(radius);
    const mass = isBomb ? 0.8 : 1.2;
    const quat = new THREE.Quaternion();

    createRigidBody(projectile, shape, mass, position, quat, velocity);
  }

  return projectile;
}

export async function loadCatapultModel(scene, physicsWorld) {
  console.log("Creando cañón de artillería pirata...");

  try {
    // Crear grupo principal para el cañón
    const cannonGroup = new THREE.Group();
    cannonGroup.name = "pirateCannon";

    // Materiales simples pero efectivos
    const metalMaterial = new THREE.MeshLambertMaterial({
      color: 0x666666, // Gris metálico
    });

    const woodMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b4513, // Madera marrón
    });

    const brassMaterial = new THREE.MeshLambertMaterial({
      color: 0xd4a017, // Latón dorado
    });

    const wheelMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333, // Ruedas oscuras
    });

    // -------------------- CARRETA SIMPLIFICADA --------------------

    // Base de la carreta (más pequeña y mejor posicionada)
    const carriageBaseGeometry = new THREE.BoxGeometry(2.5, 0.4, 1.2);
    const carriageBase = new THREE.Mesh(carriageBaseGeometry, woodMaterial);
    carriageBase.position.set(0, 0.2, 0);
    cannonGroup.add(carriageBase);

    // Ruedas traseras (más grandes)
    const rearWheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.25, 12);

    const leftRearWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
    leftRearWheel.position.set(-1.0, 0.6, 0.6);
    leftRearWheel.rotation.z = Math.PI / 2;
    cannonGroup.add(leftRearWheel);

    const rightRearWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
    rightRearWheel.position.set(-1.0, 0.6, -0.6);
    rightRearWheel.rotation.z = Math.PI / 2;
    cannonGroup.add(rightRearWheel);

    // Ruedas delanteras (más pequeñas)
    const frontWheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12);

    const leftFrontWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
    leftFrontWheel.position.set(0.8, 0.6, 0.6);
    leftFrontWheel.rotation.z = Math.PI / 2;
    cannonGroup.add(leftFrontWheel);

    const rightFrontWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
    rightFrontWheel.position.set(0.8, 0.6, -0.6);
    rightFrontWheel.rotation.z = Math.PI / 2;
    cannonGroup.add(rightFrontWheel);

    // -------------------- CAÑÓN PRINCIPAL --------------------

    // Grupo para el cañón (para poder rotarlo/elevarlo)
    const cannonBarrelGroup = new THREE.Group();
    cannonBarrelGroup.name = "cannonBarrel";
    cannonBarrelGroup.position.set(0, 0.6, 0); // Centro en la carreta

    // CAÑÓN principal (cilindro)
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 10);
    const cannonBarrel = new THREE.Mesh(barrelGeometry, metalMaterial);
    cannonBarrel.position.set(0, 0.3, 0);
    cannonBarrel.rotation.z = Math.PI / 2; // Horizontal
    cannonBarrelGroup.add(cannonBarrel);

    // Anillos de refuerzo
    const ringGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 8);

    const ring1 = new THREE.Mesh(ringGeometry, brassMaterial);
    ring1.position.set(0.5, 0.3, 0);
    ring1.rotation.z = Math.PI / 2;
    cannonBarrelGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, brassMaterial);
    ring2.position.set(-0.5, 0.3, 0);
    ring2.rotation.z = Math.PI / 2;
    cannonBarrelGroup.add(ring2);

    // BOCA del cañón (más ancha)
    const muzzleGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.3, 10);
    const muzzle = new THREE.Mesh(muzzleGeometry, metalMaterial);
    muzzle.name = "cannonMuzzle"; // IMPORTANTE: para identificar
    muzzle.position.set(1.25, 0.3, 0);
    muzzle.rotation.z = Math.PI / 2;
    cannonBarrelGroup.add(muzzle);

    // CULATA del cañón
    const breechGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.4, 10);
    const breech = new THREE.Mesh(breechGeometry, metalMaterial);
    breech.position.set(-1.25, 0.3, 0);
    breech.rotation.z = Math.PI / 2;
    cannonBarrelGroup.add(breech);

    // Tapa de culata (latón)
    const breechCapGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 8);
    const breechCap = new THREE.Mesh(breechCapGeometry, brassMaterial);
    breechCap.position.set(-1.43, 0.3, 0);
    breechCap.rotation.z = Math.PI / 2;
    cannonBarrelGroup.add(breechCap);

    // Soportes del cañón (trunnions)
    const trunnionGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);

    const leftTrunnion = new THREE.Mesh(trunnionGeometry, metalMaterial);
    leftTrunnion.position.set(0, 0.3, 0.4);
    leftTrunnion.rotation.x = Math.PI / 2;
    cannonBarrelGroup.add(leftTrunnion);

    const rightTrunnion = new THREE.Mesh(trunnionGeometry, metalMaterial);
    rightTrunnion.position.set(0, 0.3, -0.4);
    rightTrunnion.rotation.x = Math.PI / 2;
    cannonBarrelGroup.add(rightTrunnion);

    // Añadir el grupo del cañón a la carreta
    cannonGroup.add(cannonBarrelGroup);

    // -------------------- ACCESORIOS --------------------

    // Cuña de elevación
    const wedgeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.6);
    const wedge = new THREE.Mesh(wedgeGeometry, woodMaterial);
    wedge.position.set(0.3, 0.2, 0);
    cannonGroup.add(wedge);

    // Balas de cañón (pila)
    const cannonballGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const cannonballMaterial = new THREE.MeshLambertMaterial({
      color: 0x111111,
    });

    // Pila de 3 balas al lado del cañón
    for (let i = 0; i < 3; i++) {
      const cannonball = new THREE.Mesh(cannonballGeometry, cannonballMaterial);
      cannonball.position.set(-1.5, 0.12 + i * 0.25, 0.8);
      cannonGroup.add(cannonball);
    }

    // Barril de pólvora
    const powderKegGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 8);
    const powderKeg = new THREE.Mesh(powderKegGeometry, woodMaterial);
    powderKeg.position.set(-1.5, 0.2, -0.8);
    cannonGroup.add(powderKeg);

    // -------------------- POSICIONAMIENTO FINAL --------------------

    // Posicionar todo el cañón en el escenario
    cannonGroup.position.set(0, 1, -15);
    cannonGroup.rotation.y = Math.PI; // Mirar hacia adelante

    // Añadir a la escena
    scene.add(cannonGroup);

    console.log("Cañón pirata 3D creado exitosamente");

    // Calcular el punto de disparo (en la boca del cañón)
    // Usamos la posición global del cañón + la posición de la boca
    const muzzleWorldPosition = new THREE.Vector3();
    muzzle.getWorldPosition(muzzleWorldPosition);

    // Crear físicas para el cañón
    if (Ammo && physicsWorld) {
      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(0, 1, -15));

      const motionState = new Ammo.btDefaultMotionState(transform);
      const colShape = new Ammo.btBoxShape(new Ammo.btVector3(1.25, 0.5, 0.6));
      const localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(1, localInertia);

      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        0,
        motionState,
        colShape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      physicsWorld.addRigidBody(body);

      // Configuración del cañón
      const cannonConfig = {
        group: cannonGroup,
        body: body,
        barrelGroup: cannonBarrelGroup,
        muzzle: muzzle,
        angle: 10,
        power: 50,
        rotationSpeed: 0.02,
        maxElevation: Math.PI / 4, // 45 grados máximo
        minElevation: -Math.PI / 12, // -15 grados mínimo
        currentElevation: 0,
        baseRotation: 0, // <-- AÑADE ESTO: rotación horizontal
        baseRotationSpeed: 0.03, // <-- AÑADE ESTO: velocidad rotación horizontal
        maxBaseRotation: Math.PI / 4, // <-- AÑADE ESTO: 45° izquierda/derecha
        isRotating: false,
        rotationDirection: 0,
        isBaseRotating: false, // <-- AÑADE ESTO: para rotación horizontal
        baseRotationDirection: 0, // <-- AÑADE ESTO
        type: "pirate-cannon",
        projectileStartOffset: new THREE.Vector3(1.3, 0.3, 0),
      };

      return cannonConfig;
    }

    // Configuración sin física
    const cannonConfig = {
      group: cannonGroup,
      barrelGroup: cannonBarrelGroup,
      muzzle: muzzle,
      angle: 10,
      power: 50,
      rotationSpeed: 0.02,
      maxElevation: Math.PI / 4,
      minElevation: -Math.PI / 12,
      currentElevation: 0,
      isRotating: false,
      rotationDirection: 0,
      type: "pirate-cannon",
      projectileStartOffset: new THREE.Vector3(1.3, 0.3, 0),
    };

    return cannonConfig;
  } catch (error) {
    console.error("Error creando cañón pirata:", error);

    // Fallback a catapulta simple
    console.log("Usando catapulta simple como fallback");
    return createSimpleCatapult(scene, physicsWorld);
  }
}
