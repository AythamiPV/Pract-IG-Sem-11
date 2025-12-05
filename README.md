# Catapulta Pirata 3D - Simulación Física

Este proyecto consiste en una **simulación 3D interactiva** donde controlas un cañón pirata para disparar proyectiles con física realista. Desarrollado con **Three.js** y **Ammo.js**, combina efectos visuales dinámicos, colisiones físicas y una jugabilidad estratégica basada en ángulo, potencia y tipo de proyectil.

---

## ⚙️ Integración en el Proyecto

### Estructura de Archivos

src/  
├── main.js # Loop principal del juego  
├── controls.js # Controles del cañón  
├── worldBuilder.js # Creación del mundo 3D  
├── physics.js # Sistema de física Ammo.js  
├── levels.js # Definición de niveles  
├── ui.js # Interfaz de usuario  
└── styles.css # Estilos  

---

## ⚔️ Elementos Principales del Juego

### 🏴‍☠️ Cañón Pirata 3D
- Modelo completo con ruedas, barril y mecanismos.
- Sistema de elevación (10° a 80°) y rotación 360°.
- Posicionado en (-45, 0, -45) para perspectiva estratégica.

### 💥 Sistema de Física
- **Ammo.js** para simulaciones físicas realistas.
- Trayectoria balística precisa (gravedad = 9.8 m/s²).
- Colisiones dinámicas con rebotes y explosiones.
- Fuerza radial en impactos y propagación de energía.

### 🧨 Tipos de Proyectiles

| Proyectil | Comportamiento | Efecto |
|-----------|----------------|---------|
| **Roca** | Impacto directo | Elimina enemigos al contacto |
| **Bomba** | Explosión retardada | Detona 1s tras impacto, área de efecto |

---

## 🌍 Mundo 3D y Entorno

- Terreno físico de 100×100 unidades.  
- Suelo decorativo de 500×500 unidades con texturas.  
- Montañas perimetrales como fondo visual.  
- Sistema de iluminación dinámico con sombras proyectadas.  

---

## 🕹️ Controles

| Tecla | Acción |
|-------|---------|
| ↑ / ↓ | Elevar o bajar barril |
| ← / → | Rotar horizontalmente |
| Q / A | Aumentar o disminuir potencia |
| F | Cambiar tipo de proyectil |
| ESPACIO | Disparar |
| V | Cambiar vista de cámara |
| R | Reiniciar nivel |

**Dentro del nivel, si pulsa el botón de la esquina superior derecha podrá ver los controles.**

---

## 🔥 Efectos Visuales

- **Línea de trayectoria** punteada roja.  
- **Explosiones animadas** que crecen con partículas.  
- **Sombras dinámicas** en todos los objetos.  
- **Brillo y humo** en detonaciones.  

---

## 🧩 Sistema de Niveles

Cada nivel define su dificultad, cantidad de munición y disposición de enemigos y obstáculos.

```javascript
{
  difficulty: "Fácil",
  ammo: { rock: 10, bomb: 3 },
  enemies: [{pos: [15, 0, 15]}],
  bricks: [
    {type: "movable", pos: [10, 0.3, 10], rotation: 0},
    {type: "immovable", pos: [20, 0.3, 20], rotation: 90}
  ]
}
```
---

## 🎯 Objetos del Juego

- **Enemigos 🎯:** Figuras humanoides negras.  
- **Ladrillos Marrones 🟫:** Móviles, eliminan enemigos al impactar.  
- **Ladrillos Grises ⬜:** Inamovibles, solo decorativos.  
- **Montañas 🏔️:** Puras decoraciones sin colisiones.  

---

## 💣 Mecánica de Bombas

- ⏱️ **Temporizador:** 1 segundo tras cualquier impacto.  
- 💥 **Explosión automática:** al tocar cualquier superficie.  
- 🌪️ **Radio de efecto:** 8 unidades.  
- 🎯 **Fuerza radial:** impulsa objetos cercanos.  

---

## 🧠 Consejos de Estrategia

**Para Rocas 🪨**
- Usa para enemigos individuales o de precisión.  
- Ideal para objetivos protegidos por obstáculos.  

**Para Bombas 💣**
- Perfectas contra grupos de enemigos.  
- Aprovéchalas para destruir estructuras o bloques móviles.  

---

## ⚙️ Desarrollo Técnico

### Requisitos
- Navegador moderno con soporte **WebGL**.  
- Conexión a internet (para Ammo.js CDN).  
- Teclado para controles de disparo.  

### Física Detallada
- Gravedad: 9.8 m/s²  
- Boost de velocidad: ×1.2 en proyectiles  
- Margen de colisión: 0.05 unidades  
- Estabilización inicial: 120 pasos de física  

### Optimizaciones
- **Culling** de objetos lejanos.  
- Colisiones por distancia optimizada.  
- Gestión de memoria al destruir objetos.  
- Renderizado selectivo para rendimiento.  

---

## 📷 Cámaras Disponibles

- **Vista de Cañón:** sigue el barril, muestra la trayectoria.  
- **Vista Orbital:** control libre con ratón y zoom dinámico.  

---

## 🧰 Tecnologías Utilizadas

- **Three.js** – Renderizado 3D con WebGL  
- **Ammo.js** – Motor de física realista  
- **JavaScript ES6+** – Lógica del juego  
- **CSS3** – Interfaz y estilo visual  

---

## 🔗 Enlaces

- [Repositorio en GitHub](https://github.com/AythamiPV/Pract-IG-Sem-11)
- [Codesandbox](https://codesandbox.io/p/github/AythamiPV/Pract-IG-Sem-11/main)
- [Video demostrativo](https://alumnosulpgc-my.sharepoint.com/:v:/g/personal/aythami_perez109_alu_ulpgc_es/IQBwUDJSd31-QZxjpr0W-ZfVASut6IgMiGyBCMAdadWyaBg?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=PG8MYj)
---

