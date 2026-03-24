# 🎡 Ruleta de Presentaciones Pokémon

Una aplicación web interactiva diseñada para profesores y presentadores. Permite elegir de forma aleatoria y gamificada el orden en el que los alumnos deben salir a presentar a la pizarra, o bien dividirlos en grupos equilibrados. 

Para hacerlo más divertido, cada vez que la ruleta elige a un alumno, ¡se le asigna un Pokémon acompañante aleatorio utilizando la [PokeAPI](https://pokeapi.co/)!

## ✨ Características Principales

* **Dos Modos de Uso:**
  * **Modo Individual (0 Grupos):** Elige a los alumnos uno a uno para salir a presentar.
  * **Modo Grupos (1-10 Grupos):** Reparte equitativamente a los alumnos en el número de grupos elegido (ideal para trabajos en equipo).
* **Asignación de Pokémon:** Cada alumno recibe un Pokémon único (sin repeticiones en la misma sesión).
* **Filtros Personalizables:** Permite elegir qué generaciones de Pokémon pueden aparecer (1ª a 9ª) e incluir o excluir Megaevoluciones, formas Gigamax y formas Regionales (Alola, Galar, Hisui, Paldea).
* **Memoria Local (`localStorage`):** Guarda automáticamente la lista de alumnos en el navegador. Si cierras la pestaña por error, no perderás tu clase.
* **Gestión de Sesiones:** * *Reiniciar Sesión:* Vacía los grupos y el historial, pero mantiene a la clase para volver a girar la ruleta otro día.
  * *Vaciar Lista:* Borra todos los datos para que puedas introducir a una clase completamente nueva.
* **Sistema de Sesgos (Bias):** Permite dar más o menos probabilidad matemática a ciertos alumnos de salir elegidos.

## 🚀 Cómo usarlo

1. Clona o descarga este proyecto en tu ordenador.
2. Abre el archivo `index.html` en cualquier navegador web moderno (Chrome, Firefox, Edge, Safari). No requiere servidor ni instalación.
3. Haz clic en el botón **Participantes** y añade los nombres de tus alumnos.
4. Ve a **Opciones** para configurar si quieres formar grupos (pon `0` para presentaciones individuales) y filtra los Pokémon que quieres que aparezcan.
5. Haz clic en **Girar Ruleta** y ¡que la suerte decida!

## 🛠️ Tecnologías Utilizadas

* **HTML5 y CSS3:** Para la estructura y un diseño visual limpio, en formato de tarjetas y modales.
* **Vanilla JavaScript:** Toda la lógica de la ruleta, cálculos matemáticos del giro, animaciones en `<canvas>` y gestión del LocalStorage.
* **PokeAPI:** Fetch de datos asíncrono para obtener los sprites oficiales y los nombres de los Pokémon en tiempo real.