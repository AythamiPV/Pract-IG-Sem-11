import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  initPhysics,
  updatePhysics,
  createExplosion,
  removeRigidBody,
  getRigidBodies,
  checkCollisions,
  stabilizeObjects,
  getPhysicsWorld,
} from "./lib/physics.js";
import {
  createGround,
  createBrick,
  createEnemy,
  createProjectile,
  loadCatapultModel,
} from "./lib/worldBuilder.js";
import { levels } from "./lib/levels.js";
import {
  handleInput,
  updateCatapult,
  getProjectileStartPosition,
  getLaunchVelocity,
  projectileType,
  angle,
  power,
  resetInputState,
  inputEnabled,
  MAX_POWER, // Añadido
  MIN_POWER, // Añadido si lo necesitas
} from "./lib/controls.js";
import {
  initUI,
  updateHUD,
  updateLevelInfo,
  showLevelComplete,
  showGameOver,
} from "./lib/ui.js";

// Al principio de main.js, con las otras variables:
let scene, renderer, orbitControls;
let currentLevel = 0;
let ammo = { rock: 0, bomb: 0 };
let ammoUsed = { rock: 0, bomb: 0 };
let clock = new THREE.Clock();
let catapultCamera, orbitCamera, activeCamera;
let isGameRunning = false;
let levelStartTime = 0;
let catapult = null;
let catapultConfig = null; // <-- AÑADE ESTA LÍNEA
let trajectoryLine = null;
let enemies = [];
let projectiles = [];
let bricks = [];

// Inicialización de eventos
window.addEventListener("keydown", (e) => handleInput(e));
window.addEventListener("keyup", (e) => handleInput(e));

// Iniciar juego
startGame();

async function startGame() {
  console.log("Iniciando juego...");

  try {
    await initPhysics();
    console.log("Física inicializada");
  } catch (error) {
    console.error("Error inicializando física:", error);
  }

  initGraphics();
  initUI(startLevel);
}

function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("app").appendChild(renderer.domElement);

  // Configurar cámaras - más altas para ver montañas
  catapultCamera = new THREE.PerspectiveCamera(
    75, // Aumentado FOV para ver más
    window.innerWidth / window.innerHeight,
    0.1,
    2000 // Mayor distancia de renderizado
  );
  catapultCamera.position.set(-25, 12, 25); // Más alto

  orbitCamera = new THREE.PerspectiveCamera(
    75, // Aumentado FOV
    window.innerWidth / window.innerHeight,
    0.1,
    2000 // Mayor distancia
  );
  orbitCamera.position.set(40, 60, 40); // Mucho más alto para ver montañas
  orbitCamera.lookAt(0, 0, 0);

  activeCamera = catapultCamera;

  // Controles orbitales
  orbitControls = new OrbitControls(orbitCamera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.05;
  orbitControls.enabled = false;
  orbitControls.maxDistance = 300; // Permitir zoom out más
  orbitControls.minDistance = 20;
  orbitControls.maxPolarAngle = Math.PI / 2; // No mirar desde abajo

  // Crear línea de trayectoria
  const trajectoryMaterial = new THREE.LineDashedMaterial({
    color: 0xff0000,
    linewidth: 2,
    dashSize: 0.5,
    gapSize: 0.2,
  });
  const trajectoryGeometry = new THREE.BufferGeometry();
  trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
  scene.add(trajectoryLine);
  trajectoryLine.visible = false;

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.camera.far = 100;
  scene.add(directionalLight);

  // Eventos
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyV") {
      toggleCamera();
    } else if (e.code === "Space" && inputEnabled && isGameRunning) {
      shootProjectile();
    } else if (e.code === "KeyR") {
      // Reiniciar nivel (para debug)
      startLevel();
    }
  });
}

function onWindowResize() {
  activeCamera.aspect = window.innerWidth / window.innerHeight;
  activeCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleCamera() {
  if (activeCamera === catapultCamera) {
    activeCamera = orbitCamera;
    orbitControls.enabled = true;
    trajectoryLine.visible = false;
  } else {
    activeCamera = catapultCamera;
    orbitControls.enabled = false;
    trajectoryLine.visible = true;
  }
}

async function startLevel() {
  console.log(
    `Cargando nivel ${currentLevel + 1}: ${levels[currentLevel].difficulty}`
  );

  // Limpiar escena
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  // Reiniciar arrays
  enemies = [];
  projectiles = [];
  bricks = [];
  resetInputState();

  // Restaurar luces básicas
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Crear terreno
  createGround(scene);

  // OBTENER EL PHYSICS WORLD
  const physicsWorld = getPhysicsWorld();

  if (!physicsWorld) {
    console.error(
      "ERROR: physicsWorld no está inicializado. ¿Has llamado a initPhysics()?"
    );
    return;
  }

  // Crear catapulta DETALLADA
  catapultConfig = await loadCatapultModel(scene, physicsWorld);

  if (!catapultConfig) {
    console.error("ERROR: No se pudo crear la catapulta");
    return;
  }

  // Obtener el objeto 3D de la catapulta
  catapult = catapultConfig.group;

  // Verificar que la catapulta se haya creado correctamente
  if (!catapult) {
    console.error("ERROR: No se pudo obtener el grupo de la catapulta");
    return;
  }

  // Inicializar valores de catapulta
  catapult.userData = catapult.userData || {};
  catapult.userData.angle = 45;
  catapult.userData.power = 50;
  catapult.userData.baseRotation = 0;
  catapult.userData.cup = catapultConfig.cup; // Guardar referencia a la copa

  // Cargar nivel
  const level = levels[currentLevel];
  ammo = { ...level.ammo };
  ammoUsed = { rock: 0, bomb: 0 };

  updateLevelInfo(currentLevel, level.difficulty);

  // Crear ladrillos
  console.log(`Creando ${level.bricks.length} ladrillos...`);
  for (const brickData of level.bricks) {
    const rotation = brickData.rotation || 0;
    const brick = createBrick(
      brickData.type,
      new THREE.Vector3(...brickData.pos),
      rotation,
      true
    );
    scene.add(brick);
    bricks.push(brick);
  }

  // Crear enemigos
  console.log(`Creando ${level.enemies.length} enemigos...`);
  for (const enemyData of level.enemies) {
    const enemy = createEnemy(new THREE.Vector3(...enemyData.pos));
    scene.add(enemy);
    enemies.push(enemy);
  }

  // Estabilizar objetos al inicio
  setTimeout(() => {
    console.log("Iniciando estabilización...");
    stabilizeObjects();
    console.log("Nivel completamente estabilizado y listo");

    // Información sobre la catapulta
    setTimeout(() => {
      if (isGameRunning) {
        const catapultType = catapultConfig.type || "Desconocida";
        console.log(
          `Catapulta ${catapultType} cargada. Potencia máxima: ${MAX_POWER}`
        );
      }
    }, 500);
  }, 200);

  // Restaurar línea de trayectoria
  scene.add(trajectoryLine);
  trajectoryLine.visible = true;

  // Iniciar juego
  isGameRunning = true;
  levelStartTime = Date.now();
  updateHUD(ammo, angle, power, projectileType, MAX_POWER);

  animate();
}

function shootProjectile() {
  if (!catapult || !isGameRunning) return;

  // Verificar munición
  if (ammo[projectileType] <= 0) {
    checkGameOver();
    return;
  }

  // Usar munición
  ammo[projectileType]--;
  ammoUsed[projectileType]++;

  // Obtener la posición de inicio del proyectil DESDE EL CAÑÓN
  const startPos = getCannonProjectileStartPosition(catapult);
  const velocity = getCannonLaunchVelocity(catapult);

  const projectile = createProjectile(projectileType, startPos, velocity);
  scene.add(projectile);
  projectiles.push(projectile);

  updateHUD(ammo, angle, power, projectileType);

  // Si es bomba, programar explosión
  if (projectileType === "bomb") {
    setTimeout(() => {
      if (projectile.parent) {
        handleBombExplosion(projectile);
      }
    }, 3000);
  }
}

// NUEVA FUNCIÓN para obtener posición de disparo del cañón
function getCannonProjectileStartPosition(cannon) {
  if (!cannon || !cannon.userData) {
    return new THREE.Vector3(0, 1, -15);
  }

  // Si el cañón tiene una boca definida, calcular su posición mundial
  if (cannon.userData.muzzle) {
    const worldPosition = new THREE.Vector3();
    cannon.userData.muzzle.getWorldPosition(worldPosition);
    return worldPosition;
  }

  // Calcular posición basada en offset y rotaciones
  const offset =
    cannon.userData.projectileStartOffset || new THREE.Vector3(1.3, 0.3, 0);

  // Aplicar elevación al offset
  let rotatedOffset = offset.clone();
  if (cannon.userData.barrelGroup) {
    const elevation = cannon.userData.currentElevation || 0;
    rotatedOffset.applyEuler(new THREE.Euler(elevation, 0, 0));
  }

  // Aplicar rotación horizontal al offset
  const horizontalRotation = cannon.userData.baseRotation || 0;
  rotatedOffset.applyEuler(new THREE.Euler(0, horizontalRotation, 0));

  // Obtener posición base del cañón
  const basePosition = cannon.position.clone();

  return basePosition.add(rotatedOffset);
}

// NUEVA FUNCIÓN para obtener velocidad de disparo del cañón
function getCannonLaunchVelocity(cannon) {
  if (!cannon || !cannon.userData) {
    return new THREE.Vector3(0, 10, 0);
  }

  const power = cannon.userData.power || 50;

  // Potencia base más velocidad para cañón
  const baseVelocity = 18 + (power / 100) * 25;

  // Dirección inicial (adelante en el eje local del cañón)
  const direction = new THREE.Vector3(0, 0, -1);

  // Aplicar ELEVACIÓN (arriba/abajo) desde el barrelGroup
  if (cannon.userData.barrelGroup) {
    const elevation = cannon.userData.currentElevation || 0;
    direction.applyEuler(new THREE.Euler(elevation, 0, 0));
  }

  // Aplicar ROTACIÓN HORIZONTAL (izquierda/derecha) desde el cañón completo
  const horizontalRotation = cannon.userData.baseRotation || 0;
  direction.applyEuler(new THREE.Euler(0, horizontalRotation, 0));

  // Aplicar potencia
  const velocity = direction.multiplyScalar(baseVelocity);

  return velocity;
}

function handleBombExplosion(projectile) {
  // Crear explosión
  const affectedEnemies = createExplosion(projectile.position, 5, 30);

  // Eliminar enemigos afectados por la explosión
  affectedEnemies.forEach((enemy) => {
    removeEnemy(enemy);
  });

  // Crear efecto visual de explosión
  createExplosionEffect(projectile.position);

  // Eliminar proyectil
  removeProjectile(projectile);
}

function createExplosionEffect(position) {
  const explosionGeometry = new THREE.SphereGeometry(1, 8, 8);
  const explosionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5500,
    transparent: true,
    opacity: 0.7,
  });
  const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
  explosion.position.copy(position);
  scene.add(explosion);

  // Animar y eliminar la explosión
  let scale = 1;
  const animateExplosion = () => {
    scale += 0.2;
    explosion.scale.set(scale, scale, scale);
    explosionMaterial.opacity -= 0.1;

    if (explosionMaterial.opacity > 0) {
      requestAnimationFrame(animateExplosion);
    } else {
      scene.remove(explosion);
    }
  };
  animateExplosion();
}

function removeProjectile(projectile) {
  const index = projectiles.indexOf(projectile);
  if (index > -1) {
    projectiles.splice(index, 1);
  }

  removeRigidBody(projectile);
  scene.remove(projectile);
}

function removeEnemy(enemy) {
  const index = enemies.indexOf(enemy);
  if (index > -1) {
    enemies.splice(index, 1);
  }

  removeRigidBody(enemy);
  scene.remove(enemy);

  // Efecto visual de eliminación
  createDeathEffect(enemy.position);

  // Verificar victoria
  if (enemies.length === 0) {
    setTimeout(() => completeLevel(), 1000); // Pequeño delay para que se vean los efectos
  }
}

function createDeathEffect(position) {
  // Pequeño efecto visual cuando un enemigo muere
  const particles = new THREE.Group();

  for (let i = 0; i < 8; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    particle.position.copy(position);

    // Dirección aleatoria
    const direction = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();

    particle.userData.velocity = direction.multiplyScalar(
      1.5 + Math.random() * 1.5
    );
    particles.add(particle);
  }

  scene.add(particles);

  // Animar partículas
  let life = 1.0;
  const animateParticles = () => {
    life -= 0.04;

    particles.children.forEach((particle) => {
      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(0.08)
      );
      particle.userData.velocity.y -= 0.08; // Gravedad
      particle.material.opacity = life;
    });

    if (life > 0) {
      requestAnimationFrame(animateParticles);
    } else {
      scene.remove(particles);
    }
  };
  animateParticles();
}

function removeBrick(brick) {
  const index = bricks.indexOf(brick);
  if (index > -1) {
    bricks.splice(index, 1);
  }

  removeRigidBody(brick);
  scene.remove(brick);
}

function updateTrajectory() {
  if (!catapult || !trajectoryLine || activeCamera !== catapultCamera) return;

  // Usar las funciones específicas del cañón
  const startPos = getCannonProjectileStartPosition(catapult);
  const velocity = getCannonLaunchVelocity(catapult);

  const points = [];
  const gravity = 9.8;
  const timeStep = 0.1;
  const maxTime = 5; // Tiempo más corto para trayectoria de cañón

  // Calcular puntos de la trayectoria
  for (let t = 0; t <= maxTime; t += timeStep) {
    const x = startPos.x + velocity.x * t;
    const y = startPos.y + velocity.y * t - 0.5 * gravity * t * t;
    const z = startPos.z + velocity.z * t;

    // Detener si golpea el suelo
    if (y < 0) break;

    points.push(new THREE.Vector3(x, y, z));
  }

  // Actualizar geometría de la línea
  if (points.length > 0) {
    if (trajectoryLine.geometry) {
      trajectoryLine.geometry.dispose();
    }
    trajectoryLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    trajectoryLine.computeLineDistances();
    trajectoryLine.visible = true;
  } else {
    trajectoryLine.visible = false;
  }
}

function checkCollisionsNow() {
  // Obtener colisiones desde la física
  const collisions = checkCollisions();

  // Procesar colisiones detectadas
  collisions.forEach((collision) => {
    const { enemy, other, type } = collision;

    // Ignorar colisiones con objetos decorativos (montañas)
    if (other.userData.isDecorative) {
      return; // No hacer nada, las montañas son decorativas
    }

    // Si el enemigo colisiona con un proyectil
    if (enemies.includes(enemy) && type === "projectile") {
      console.log(`Enemigo golpeado por proyectil`);
      removeEnemy(enemy);
      removeProjectile(other);
    }

    // Si el enemigo colisiona con un ladrillo MARRÓN (movable)
    if (
      enemies.includes(enemy) &&
      type === "brick" &&
      other.userData.brickType === "movable" &&
      other.userData.mass > 0
    ) {
      // Verificar que el ladrillo se esté moviendo con suficiente velocidad
      if (other.userData.physicsBody) {
        const velocity = other.userData.physicsBody.getLinearVelocity();
        const speed = Math.sqrt(
          velocity.x() ** 2 + velocity.y() ** 2 + velocity.z() ** 2
        );

        // Solo eliminar enemigo si el ladrillo marrón se mueve rápido
        if (speed > 1.0) {
          console.log(
            `Enemigo golpeado por ladrillo marrón (velocidad: ${speed.toFixed(
              2
            )})`
          );
          removeEnemy(enemy);

          // Aplicar fuerza de retroceso al ladrillo
          const impulse = new THREE.Vector3(
            Math.random() * 2 - 1,
            2,
            Math.random() * 2 - 1
          )
            .normalize()
            .multiplyScalar(8);

          other.userData.physicsBody.applyCentralImpulse(
            new Ammo.btVector3(impulse.x, impulse.y, impulse.z)
          );
        } else {
          console.log(
            `Ladrillo marrón tocó enemigo pero velocidad insuficiente (${speed.toFixed(
              2
            )})`
          );
          // NO eliminar enemigo - solo física normal
        }
      }
    }

    // NOTA: Si colisiona con ladrillo GRIS (immovable), NO hacemos nada
    // Los ladrillos grises no eliminan enemigos
  });

  // Limpiar objetos que hayan caído fuera del mapa
  cleanupOutOfBounds();
}

function cleanupOutOfBounds() {
  // Limpiar proyectiles - límites mucho más grandes por montañas lejanas
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    if (
      projectile.position.y < -50 ||
      Math.abs(projectile.position.x) > 300 ||
      Math.abs(projectile.position.z) > 300
    ) {
      removeProjectile(projectile);
    }
  }

  // Limpiar enemigos
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (
      enemy.position.y < -30 ||
      Math.abs(enemy.position.x) > 150 ||
      Math.abs(enemy.position.z) > 150
    ) {
      removeEnemy(enemy);
    }
  }

  // Limpiar ladrillos
  for (let i = bricks.length - 1; i >= 0; i--) {
    const brick = bricks[i];
    if (
      brick.position.y < -40 ||
      Math.abs(brick.position.x) > 180 ||
      Math.abs(brick.position.z) > 180
    ) {
      removeBrick(brick);
    }
  }
}

async function checkGameOver() {
  if (ammo.rock <= 0 && ammo.bomb <= 0 && enemies.length > 0) {
    isGameRunning = false;
    const restart = await showGameOver();
    if (restart) {
      currentLevel = 0;
      startLevel();
    }
  }
}

async function completeLevel() {
  isGameRunning = false;
  const levelTime = (Date.now() - levelStartTime) / 1000;

  const next = await showLevelComplete(currentLevel + 1, ammoUsed, levelTime);
  if (next) {
    currentLevel++;
    if (currentLevel >= levels.length) {
      currentLevel = 0;
    }
    setTimeout(() => startLevel(), 1500);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  if (isGameRunning) {
    // Actualizar física
    updatePhysics(deltaTime);

    // Verificar colisiones
    checkCollisionsNow();

    // Actualizar cañón (esto aplicará las animaciones)
    if (catapult) {
      updateCatapult(catapult, deltaTime); // Asegúrate de llamar esto

      // Actualizar trayectoria
      if (activeCamera === catapultCamera) {
        updateTrajectory();
      }
    }

    // Actualizar cámara de cañón
    if (activeCamera === catapultCamera && catapult) {
      const offset = new THREE.Vector3(-8, 5, 8); // Ajuste para cañón

      // Aplicar rotación horizontal al offset de cámara
      offset.applyEuler(
        new THREE.Euler(0, catapult.userData?.baseRotation || 0, 0)
      );

      catapultCamera.position.copy(catapult.position).add(offset);
      catapultCamera.lookAt(catapult.position);
    }

    // Actualizar HUD
    updateHUD(ammo, angle, power, projectileType);
  }

  orbitControls.update();
  renderer.render(scene, activeCamera);
}

// Para debugging
window.game = {
  scene,
  catapult,
  startLevel,
  shootProjectile,
  get ammo() {
    return ammo;
  },
  get enemies() {
    return enemies;
  },
  get projectiles() {
    return projectiles;
  },
  get bricks() {
    return bricks;
  },
  get currentLevel() {
    return currentLevel;
  },
};
