export const levels = [
  {
    difficulty: "Fácil",
    bricks: [
      // Base gris en el suelo
      { type: "immovable", pos: [0, 0.3, -6], rotation: 0 }, // Altura: mitad de 0.6 = 0.3
      { type: "immovable", pos: [1.2, 0.3, -6], rotation: 0 },
      { type: "immovable", pos: [-1.2, 0.3, -6], rotation: 0 },

      // Enemigos encima de base gris (1.2 de altura)
      // Ladrillo gris vertical encima del horizontal
      { type: "immovable", pos: [0, 1.2, -6], rotation: 90 }, // Base en 0.3 + 0.6 = 0.9, centro en 0.9 + 0.6 = 1.5
      // Ajustado: centro en 0.9 + 0.6 = 1.5

      // Columnas marrones en el suelo
      { type: "movable", pos: [3, 0.6, -8], rotation: 90 }, // Centro en 0.6 (mitad de 1.2)
      { type: "movable", pos: [4.2, 0.6, -8], rotation: 90 },

      // Viga marrón horizontal sobre columnas
      // Altura: 0.6 (columna) + 1.2 (altura columna) = 1.8, centro viga en 1.8 + 0.3 = 2.1
      { type: "movable", pos: [3.6, 2.1, -8], rotation: 0 },

      // Plataforma gris en el suelo
      { type: "immovable", pos: [-3, 0.3, -4], rotation: 0 },
      { type: "immovable", pos: [-4.2, 0.3, -4], rotation: 0 },

      // Torre gris: base + columna
      { type: "immovable", pos: [5, 0.3, -5], rotation: 0 }, // Base en suelo
      // Columna sobre base: 0.3 + 0.6 = 0.9, centro columna en 0.9 + 0.6 = 1.5
      { type: "immovable", pos: [5, 1.5, -5], rotation: 90 },
    ],
    enemies: [
      { pos: [0, 1.8, -6] }, // Encima de columna gris: 1.5 + 0.3 = 1.8
      { pos: [-3.6, 0.9, -4] }, // Encima de plataforma: 0.3 + 0.6 = 0.9
      { pos: [5, 2.1, -5] }, // Encima de torre: 1.5 + 0.6 = 2.1
    ],
    ammo: { rock: 8, bomb: 3 },
    description: "Estructuras sólidamente apoyadas en el suelo",
  },
  {
    difficulty: "Medio",
    bricks: [
      // Base gris en el suelo
      { type: "immovable", pos: [0, 0.3, -7], rotation: 0 },
      { type: "immovable", pos: [1.2, 0.3, -7], rotation: 0 },
      { type: "immovable", pos: [-1.2, 0.3, -7], rotation: 0 },
      { type: "immovable", pos: [2.4, 0.3, -7], rotation: 0 },

      // Paredes grises verticales sobre base
      // Altura base: 0.3 + 0.6 = 0.9, centro pared en 0.9 + 0.6 = 1.5
      { type: "immovable", pos: [2.4, 1.5, -7], rotation: 90 },
      // Segunda pared encima: 1.5 + 1.2 = 2.7, centro en 2.7 + 0.6 = 3.3
      { type: "immovable", pos: [2.4, 3.3, -7], rotation: 90 },

      { type: "immovable", pos: [-2.4, 1.5, -7], rotation: 90 },

      // Techo gris sobre paredes
      // Altura pared: 3.3 + 0.6 = 3.9, centro techo en 3.9 + 0.3 = 4.2
      { type: "immovable", pos: [0, 4.2, -7], rotation: 0 },
      { type: "immovable", pos: [1.2, 4.2, -7], rotation: 0 },

      // Estructura marrón separada
      { type: "movable", pos: [4, 0.6, -7], rotation: 90 }, // Columna en suelo
      { type: "movable", pos: [5.2, 0.6, -7], rotation: 90 }, // Columna en suelo
      // Viga sobre columnas: 0.6 + 1.2 = 1.8, centro en 1.8 + 0.3 = 2.1
      { type: "movable", pos: [4.6, 2.1, -7], rotation: 0 },

      // Plataforma gris lateral en suelo
      { type: "immovable", pos: [-4, 0.3, -9], rotation: 0 },
      { type: "immovable", pos: [-5.2, 0.3, -9], rotation: 0 },
      // Viga sobre plataforma: 0.3 + 0.6 = 0.9, centro en 0.9 + 0.3 = 1.2
      { type: "immovable", pos: [-4.6, 1.2, -9], rotation: 0 },

      // Columnas grises de soporte internas
      { type: "immovable", pos: [0, 1.5, -7], rotation: 90 },
      { type: "immovable", pos: [1.2, 1.5, -7], rotation: 90 },
    ],
    enemies: [
      { pos: [0, 2.1, -7] }, // Dentro de fortaleza: 1.5 + 0.6 = 2.1
      { pos: [1.2, 2.1, -7] }, // Dentro de fortaleza
      { pos: [-4.6, 1.8, -9] }, // Encima de viga: 1.2 + 0.6 = 1.8
      { pos: [0.6, 4.8, -7] }, // Bajo techo: 4.2 + 0.6 = 4.8
    ],
    ammo: { rock: 7, bomb: 2 },
    description: "Estructuras perfectamente apiladas y estables",
  },
  {
    difficulty: "Difícil",
    bricks: [
      // Castillo base en suelo
      { type: "immovable", pos: [0, 0.3, -8], rotation: 0 },
      { type: "immovable", pos: [1.2, 0.3, -8], rotation: 0 },
      { type: "immovable", pos: [2.4, 0.3, -8], rotation: 0 },
      { type: "immovable", pos: [-1.2, 0.3, -8], rotation: 0 },
      { type: "immovable", pos: [-2.4, 0.3, -8], rotation: 0 },

      // Murallas grises sobre base
      // Base: 0.3 + 0.6 = 0.9, centro muralla en 0.9 + 0.6 = 1.5
      { type: "immovable", pos: [3.6, 1.5, -8], rotation: 90 },
      // Segunda muralla: 1.5 + 1.2 = 2.7, centro en 2.7 + 0.6 = 3.3
      { type: "immovable", pos: [3.6, 3.3, -8], rotation: 90 },

      { type: "immovable", pos: [-3.6, 1.5, -8], rotation: 90 },
      { type: "immovable", pos: [-3.6, 3.3, -8], rotation: 90 },

      // Torres grises
      { type: "immovable", pos: [5, 0.3, -6], rotation: 0 }, // Base torre
      // Columna 1: 0.3 + 0.6 = 0.9, centro en 0.9 + 0.6 = 1.5
      { type: "immovable", pos: [5, 1.5, -6], rotation: 90 },
      // Columna 2: 1.5 + 1.2 = 2.7, centro en 2.7 + 0.6 = 3.3
      { type: "immovable", pos: [5, 3.3, -6], rotation: 90 },
      // Plataforma superior: 3.3 + 0.6 = 3.9, centro en 3.9 + 0.3 = 4.2
      { type: "immovable", pos: [5, 4.2, -6], rotation: 0 },

      { type: "immovable", pos: [-5, 0.3, -10], rotation: 0 }, // Base torre izquierda
      { type: "immovable", pos: [-5, 1.5, -10], rotation: 90 },
      { type: "immovable", pos: [-5, 3.3, -10], rotation: 90 },

      // Columnas de soporte para puente
      // Base: 0.3 + 0.6 = 0.9, centro columna en 0.9 + 0.6 = 1.5
      { type: "immovable", pos: [0, 1.5, -8], rotation: 90 },
      // Segunda columna: 1.5 + 1.2 = 2.7, centro en 2.7 + 0.6 = 3.3
      { type: "immovable", pos: [0, 3.3, -8], rotation: 90 },
      // Tercera columna: 3.3 + 1.2 = 4.5, centro en 4.5 + 0.6 = 5.1
      { type: "immovable", pos: [0, 5.1, -8], rotation: 90 },

      { type: "immovable", pos: [1.2, 1.5, -8], rotation: 90 },
      { type: "immovable", pos: [-1.2, 1.5, -8], rotation: 90 },

      // Puente sobre columnas
      // Altura columna: 5.1 + 0.6 = 5.7, centro puente en 5.7 + 0.3 = 6.0
      { type: "immovable", pos: [0, 6.0, -8], rotation: 0 },
      { type: "immovable", pos: [1.2, 6.0, -8], rotation: 0 },
      { type: "immovable", pos: [-1.2, 6.0, -8], rotation: 0 },

      // Barrera marrón delante en suelo
      { type: "movable", pos: [0, 0.3, -12], rotation: 0 },
      { type: "movable", pos: [1.2, 0.3, -12], rotation: 0 },
      { type: "movable", pos: [-1.2, 0.3, -12], rotation: 0 },
      // Columnas marrones sobre barrera
      // Barrera: 0.3 + 0.6 = 0.9, centro columna en 0.9 + 0.6 = 1.5
      { type: "movable", pos: [0, 1.5, -12], rotation: 90 },
      { type: "movable", pos: [1.2, 1.5, -12], rotation: 90 },

      // Estructuras marrones laterales
      { type: "movable", pos: [7, 0.6, -8], rotation: 90 }, // Columna en suelo
      { type: "movable", pos: [8.2, 0.6, -8], rotation: 90 }, // Columna en suelo

      { type: "movable", pos: [-7, 0.6, -8], rotation: 90 }, // Columna en suelo
    ],
    enemies: [
      { pos: [0, 3.9, -8] }, // Sobre columna: 3.3 + 0.6 = 3.9
      { pos: [1.2, 3.9, -8] }, // Sobre columna
      { pos: [5, 4.8, -6] }, // Encima de torre: 4.2 + 0.6 = 4.8
      { pos: [-5, 3.9, -10] }, // Encima de torre: 3.3 + 0.6 = 3.9
      { pos: [3.6, 3.9, -8] }, // Sobre muralla: 3.3 + 0.6 = 3.9
      { pos: [-3.6, 3.9, -8] }, // Sobre muralla
      { pos: [0, 6.6, -8] }, // Sobre puente: 6.0 + 0.6 = 6.6
    ],
    ammo: { rock: 10, bomb: 4 },
    description:
      "Castillo complejo con todas las piezas perfectamente apoyadas",
  },
];
