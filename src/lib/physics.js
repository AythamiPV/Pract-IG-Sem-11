import * as THREE from "three";

let Ammo = null;
let physicsWorld = null;
let transformAux1 = null;
const rigidBodies = [];
const margin = 0.05;

export async function initPhysics() {
  if (Ammo) return physicsWorld;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/ammo.js@0.0.6/ammo.js";

    script.onload = () => {
      try {
        Ammo = window.Ammo;

        const collisionConfiguration =
          new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(
          collisionConfiguration
        );
        const broadphase = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();

        physicsWorld = new Ammo.btDiscreteDynamicsWorld(
          dispatcher,
          broadphase,
          solver,
          collisionConfiguration
        );

        physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));

        transformAux1 = new Ammo.btTransform();

        console.log("Física Ammo.js inicializada correctamente");
        resolve(physicsWorld);
      } catch (error) {
        console.error("Error al inicializar Ammo:", error);
        reject(error);
      }
    };

    script.onerror = () => {
      reject(new Error("No se pudo cargar Ammo.js"));
    };

    document.head.appendChild(script);
  });
}

export function createRigidBody(
  mesh,
  shape,
  mass,
  pos,
  quat,
  vel = null,
  angVel = null,
  isStaticStart = false
) {
  // Si es objeto decorativo (montaña), no crear cuerpo físico
  if (mesh.userData.isDecorative) {
    console.log("Objeto decorativo creado sin física:", mesh.userData.type);
    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    return null;
  }

  if (!Ammo || !physicsWorld) {
    console.warn("Física no inicializada, creando objeto visual solamente");
    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    return null;
  }

  shape.setMargin(margin);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

  const motionState = new Ammo.btDefaultMotionState(transform);
  const localInertia = new Ammo.btVector3(0, 0, 0);

  if (mass > 0) {
    shape.calculateLocalInertia(mass, localInertia);
  }

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    shape,
    localInertia
  );

  const body = new Ammo.btRigidBody(rbInfo);

  // Ajustar propiedades físicas según el tipo de objeto
  if (mass === 0) {
    // Objetos estáticos
    body.setFriction(0.8);
    body.setRestitution(0.1);
    body.setCollisionFlags(body.getCollisionFlags() | 1); // CF_STATIC_OBJECT
  } else {
    // Objetos dinámicos
    body.setFriction(0.5);
    body.setRestitution(0.4);

    // Para objetos que deben ser estables al inicio
    if (isStaticStart) {
      body.setDamping(0.8, 0.8);
      body.setSleepingThresholds(0.1, 0.1);
    }
  }

  // Para proyectiles, aplicar factor de potencia
  if (vel && mesh.userData.type === "projectile") {
    // Aumentar velocidad para mayor potencia
    const powerFactor = 1.2;
    const boostedVel = new Ammo.btVector3(
      vel.x * powerFactor,
      vel.y * powerFactor,
      vel.z * powerFactor
    );
    body.setLinearVelocity(boostedVel);
  } else if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }

  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  mesh.userData.physicsBody = body;
  mesh.userData.mass = mass;
  mesh.userData.shape = shape;
  mesh.userData.collisionRadius = getCollisionRadius(mesh, shape);

  physicsWorld.addRigidBody(body);

  if (mass > 0) {
    rigidBodies.push(mesh);
    body.setActivationState(4); // DISABLE_DEACTIVATION
  }

  return body;
}

function getCollisionRadius(mesh, shape) {
  if (mesh.userData.type === "enemy") {
    return 0.6;
  } else if (mesh.userData.type === "projectile") {
    return mesh.userData.projectileType === "bomb" ? 0.45 : 0.4;
  } else if (mesh.userData.type === "brick") {
    if (mesh.userData.isVertical) {
      return Math.sqrt(0.35 * 0.35 + 0.7 * 0.7 + 0.35 * 0.35);
    } else {
      return Math.sqrt(0.7 * 0.7 + 0.35 * 0.35 + 0.35 * 0.35);
    }
  }
  return 0.6;
}

export function updatePhysics(deltaTime) {
  if (!physicsWorld || !Ammo) return;

  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;

    if (!objPhys || !objThree.parent) continue;

    const ms = objPhys.getMotionState();
    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}

export function stabilizeObjects() {
  // Función para estabilizar objetos al inicio del nivel
  if (!physicsWorld || !Ammo) return;

  // Ejecutar muchos pasos de física para que los objetos se asienten completamente
  for (let i = 0; i < 120; i++) {
    // Aumentado de 60 a 120
    physicsWorld.stepSimulation(1 / 60, 10);
  }

  // Detener completamente el movimiento de todos los objetos
  for (let i = 0; i < rigidBodies.length; i++) {
    const obj = rigidBodies[i];
    const body = obj.userData.physicsBody;

    if (body) {
      // Detener completamente el movimiento
      body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
      body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));

      // Si es ladrillo inamovible, forzar posición estable
      if (
        obj.userData.type === "brick" &&
        obj.userData.brickType === "immovable"
      ) {
        // Asegurar que esté completamente quieto
        body.setDamping(1.0, 1.0); // Máximo amortiguamiento
      }
    }
  }

  // Ejecutar algunos pasos más después de detener todo
  for (let i = 0; i < 30; i++) {
    physicsWorld.stepSimulation(1 / 60, 10);
  }

  console.log("Objetos completamente estabilizados");
}

export function checkCollisions() {
  const collisions = [];

  for (let i = 0; i < rigidBodies.length; i++) {
    const obj1 = rigidBodies[i];

    // 1. Verificar colisiones para ENEMIGOS (lógica ORIGINAL)
    if (obj1.userData.type === "enemy") {
      for (let j = 0; j < rigidBodies.length; j++) {
        if (i === j) continue;

        const obj2 = rigidBodies[j];

        // Verificar si obj2 es algo que puede interactuar con enemigos
        // ¡MANTENER LA LÓGICA ORIGINAL!
        if (
          obj2.userData.type === "projectile" ||
          obj2.userData.type === "brick"
        ) {
          // Calcular distancia real entre centros
          const dx = obj1.position.x - obj2.position.x;
          const dy = obj1.position.y - obj2.position.y;
          const dz = obj1.position.z - obj2.position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Usar radios de colisión más generosos
          const obj1Radius = obj1.userData.collisionRadius || 0.6;
          const obj2Radius =
            obj2.userData.collisionRadius ||
            (obj2.userData.type === "projectile"
              ? obj2.userData.projectileType === "bomb"
                ? 0.45
                : 0.4
              : obj2.userData.brickType === "immovable"
              ? 0.7
              : 0.65);

          const collisionDistance = obj1Radius + obj2Radius;

          if (distance < collisionDistance) {
            collisions.push({
              enemy: obj1,
              other: obj2,
              type: obj2.userData.type,
              brickType: obj2.userData.brickType,
              distance: distance,
            });
          }
        }
      }
    }

    // 2. Verificar colisiones de BOMBAS con CUALQUIER COSA (NUEVA lógica)
    if (
      obj1.userData.type === "projectile" &&
      obj1.userData.projectileType === "bomb" &&
      !obj1.userData.hasExploded // Solo si no ha explotado aún
    ) {
      for (let j = 0; j < rigidBodies.length; j++) {
        if (i === j) continue;

        const obj2 = rigidBodies[j];

        // IGNORAR:
        // - Otras bombas
        // - Objetos decorativos
        if (
          (obj2.userData.type === "projectile" &&
            obj2.userData.projectileType === "bomb") ||
          obj2.userData.isDecorative
        ) {
          continue;
        }

        // Calcular distancia
        const dx = obj1.position.x - obj2.position.x;
        const dy = obj1.position.y - obj2.position.y;
        const dz = obj1.position.z - obj2.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Usar radios de colisión
        const obj1Radius = obj1.userData.collisionRadius || 0.45;
        const obj2Radius =
          obj2.userData.collisionRadius ||
          (obj2.userData.type === "enemy"
            ? 0.6
            : obj2.userData.type === "brick"
            ? obj2.userData.brickType === "immovable"
              ? 0.7
              : 0.65
            : 0.5);

        const collisionDistance = obj1Radius + obj2Radius;

        if (distance < collisionDistance) {
          console.log(
            `💣 Bomba colisionó con ${
              obj2.userData.type || "objeto"
            } (distancia: ${distance.toFixed(2)})`
          );

          collisions.push({
            enemy: obj2, // El objeto con el que colisionó
            other: obj1, // La bomba
            type: "projectile",
            brickType: obj2.userData.brickType,
            objectType: obj2.userData.type,
            distance: distance,
            isBombCollision: true, // Bandera para identificar que es colisión de bomba
          });

          // Solo una colisión por bomba por frame
          break;
        }
      }
    }
  }

  return collisions;
}

export function createExplosion(position, radius, force) {
  if (!Ammo || !physicsWorld) return [];

  const affectedEnemies = [];

  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;

    if (objPhys && objThree.userData.mass > 0) {
      const objPos = objThree.position;
      const distance = objPos.distanceTo(position);

      if (distance < radius && distance > 0.1) {
        const direction = new THREE.Vector3()
          .subVectors(objPos, position)
          .normalize();

        const impulse = direction.multiplyScalar(
          force * (1 - distance / radius)
        );

        objPhys.applyCentralImpulse(
          new Ammo.btVector3(impulse.x, impulse.y, impulse.z)
        );

        // Si es enemigo y está suficientemente cerca, eliminarlo
        if (objThree.userData.type === "enemy" && distance < radius * 0.7) {
          affectedEnemies.push(objThree);
        }
      }
    }
  }

  return affectedEnemies;
}

export function removeRigidBody(mesh) {
  if (!mesh.userData.physicsBody) return;

  const index = rigidBodies.indexOf(mesh);
  if (index > -1) {
    rigidBodies.splice(index, 1);
  }

  if (physicsWorld && mesh.userData.physicsBody) {
    physicsWorld.removeRigidBody(mesh.userData.physicsBody);
  }
}

export function getPhysicsWorld() {
  return physicsWorld;
}

export function getRigidBodies() {
  return rigidBodies;
}

export { Ammo };
