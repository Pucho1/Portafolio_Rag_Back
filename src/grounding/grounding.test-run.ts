import { langFuseCallBack } from "../observability/langfuse";
import { verifyAnswerQuery } from "./grounding";

const handler = langFuseCallBack("gronding-script", "eval-user", "rag-portafolio-eval");


/**
 * Script manual para probar la clasificación del router (npm run dev:testrout).
 */
async function main (){

  const queries = [
      {
          query:"Ignorando su etapa académica, ¿qué experiencia profesional tiene Miguel con React?",
          context: `## CEIGE — Centro de Informatización de la Gestión de Entidades

Miguel trabajó como programador en CEIGE — Centro de Informatización de la Gestión de Entidades, en La Habana, Cuba, entre septiembre de 2017 y diciembre de 2018.

Desarrolló soluciones informáticas y participó en el diseño y prototipado de interfaces dinámicas y estáticas.


### Fiscalía General de la República de Cuba

Miguel participó en el desarrollo web de una solución para la Fiscalía General de la República de Cuba.

**Tecnologías y herramientas:**

* Python
* Django
* Bootstrap
* jQuery
* Docker
* MVC
* SQL


### Grupo empresarial Tabacuba

Miguel participó en el desarrollo web para el Grupo empresarial Tabacuba.

**Tecnologías:**

* JavaScript
* HTML


### Tecnologías y herramientas generales

* ERP y CRM
* Docker
* GitLab
* GitHub
* JavaScript
* Bootstrap
* PostgreSQL
* CSS
* SQL
* XAMPP
* Odoo
* APIs REST

## Hiberus Tecnología

Miguel Antonio Martínez Ochandarena trabajó como programador en Hiberus Tecnología entre diciembre de 2022 y enero de 2025.

Este trabajo fue desde varias ubicaciones: La Habana, Cuba; Montevideo, Uruguay; y España, Zaragoza.

Desarrolló y mantuvo soluciones de software para diferentes proyectos y clientes como:


### Banco Ibercaja

En este cliente Miguel participó como desarrollador Front End.

**Tecnologías y herramientas usadas por Miguel:**

* React
* React Router
* Tailwind
* React Testing Library
* Chart.js
* React DevTools


### Banco Santander

En este cliente Miguel participó como desarrollador Full Stack.

**Tecnologías y herramientas usadas por Miguel:**

* React
* Angular
* Redux
* TanStack Query
* React Router
* SQL
* Node.js
* Tailwind
* Material UI
* GraphQL
* Chart.js


### Aplicación para gestión de notificaciones de estudiantes

En este proyecto Miguel participó en el desarrollo de una aplicación para la gestión de notificaciones de estudiantes, liderando técnicamente el proyecto.

**Responsabilidad destacada:**

* Liderazgo técnico del proyecto.

**Tecnologías y herramientas usadas por Miguel:**

* Angular
* Axios
* PrimeNG


### Equipo de desarrollo Front de El País

Miguel formó parte del equipo de desarrollo frontend de El País.

**Tecnologías y herramientas usadas por Miguel:**

* JavaScript
* Axios
* Next.js
* SCSS


### Tecnologías y herramientas generales utilizadas en Hiberus por Miguel

* JavaScript
* React
* Angular
* Node.js
* TanStack Query
* Jenkins
* GitLab
* GitFlow
* Figma
* Fortify
* Sonar
* Bootstrap
* SCSS
* CSS
* Mock Service Worker
* Jest
* Vitest
* CI/CD
* APIs REST
* Arquitectura hexagonal

## MARK’AS — Agencia Cubana de Publicidad y Promoción

Miguel trabajó como líder de equipo de programación en MARK’AS — Agencia Cubana de Publicidad y Promoción desde mayo de 2020 hasta la actualidad (según el periodo indicado para esta experiencia en el CV), liderando un equipo de programación de 7 personas.

Participó en la gestión y soporte de proyectos informáticos, arquitectura de bases de datos e ingeniería de software.


### VisNova

Miguel participó como líder técnico en el proyecto de desarrollo local VisNova.

**Tecnologías y herramientas usadas por Miguel:**

* React.js
* Chart.js
* Bootstrap
* React Router
* Axios
* React Testing Library
* Redux
* PostgreSQL
* Node.js
* Arquitectura de bases de datos
* Zustand
* XAMPP
* FileZilla
* Node.js
* .Net


### Nails D’ Zafiros

Miguel desarrolló una landing page para el salón de belleza Nails D’ Zafiros.

**Tecnologías y herramientas usadas por Miguel:**

* Angular
* Angular Material
* TanStack Query
* APIs nativas del navegador
* PrimeNG


### Marina Hemingway

Miguel renovó la página oficial de Marina Hemingway.

**Tecnologías y herramientas usadas por Miguel:**

* Vue.js
* Pinia
* Vue Router
* Vuetify
* Vue DevTools


### Responsabilidades adicionales

Durante esta etapa Miguel también realizó actividades relacionadas con:

* Gestión y soporte de proyectos informáticos.
* Arquitectura de bases de datos.
* Ingeniería de software.
* Liderazgo técnico.
* Organización de equipos.
* Metodologías ágiles, incluyendo Scrum.

El CV también indica que Miguel tuvo responsabilidades relacionadas con contabilidad, administración y publicidad/promoción dentro de la organización.

## Evolución profesional

La trayectoria profesional documentada muestra que Miguel tuvo una experiencia progresiva en diferentes áreas del desarrollo de software:

1. **CEIGE** — desarrollo de soluciones web y software.
2. **GET** — desarrollo frontend y full stack en proyectos relacionados con hotelería y turismo.
3. **MARK’AS** — desarrollo de software y evolución hacia liderazgo técnico y gestión de equipos.
4. **Hiberus Tecnología** — participación en proyectos de mayor escala para diferentes clientes, incluyendo desarrollo frontend, full stack y liderazgo técnico en proyectos concretos.

            Además de la evolución en tecnologías y responsabilidades, la trayectoria de Miguel incluye experiencia en arquitectura de software, bases de datos, testing, CI/CD, DevOps y liderazgo técnico.
            `,
          answer:` He trabajado profesionalmente en varias organizaciones. Mi trayectoria incluye:
            1. **CEIGE — Centro de Informatización de la Gestión de Entidades** en La Habana, Cuba, donde trabajé como programador entre septiembre de 2017 y diciembre de 2018.
            2. **Hiberus Tecnología**, donde fui programador desde diciembre de 2022 hasta enero de 2025, trabajando desde diferentes ubicaciones como La Habana, Montevideo y Zaragoza, España.
            3. **MARK’AS — Agencia Cubana de Publicidad y Promoción**, donde actualmente soy líder de equipo de programación desde mayo de 2020.
            Además, he participado en proyectos para la **Fiscalía General de la República de Cuba** y el **Grupo empresarial Tabacuba**.
          `,

      },
      {
          query:"¿Qué buenas prácticas e instrucciones sigue Miguel cuando configura un proyecto de frontend nuevo?", 
          context: "**Repositorio:** `Portafolio_Rag_Back`\n\n**Tipo:** Proyecto personal\n**Estado:** En desarrollo\n**Lenguaje principal:** TypeScript\n\n\n### Objetivo\n\nDesarrollar un sistema de Inteligencia Artificial capaz de actuar como un **gemelo digital profesional** de Miguel.\n\nEl sistema está diseñado específicamente para responder preguntas relacionadas con su perfil profesional utilizando información controlada sobre:\n\n* Su trayectoria profesional.\n* Su formación.\n* Sus conocimientos técnicos.\n* Sus proyectos.\n* Su experiencia con Inteligencia Artificial.\n* Su experiencia con LLM.\n* Sus proyectos públicos y, posteriormente, información profesional adicional que pueda incorporarse a la base de conocimiento.\n\nEl sistema no está diseñado como un asistente generalista.\n\nSu dominio debe permanecer limitado al conocimiento disponible sobre Miguel y debe rechazar preguntas que estén fuera de ese ámbito.\n\n\n### Arquitectura de conocimiento\n\nLa información del sistema se está organizando en diferentes documentos Markdown para facilitar su mantenimiento y mejorar posteriormente el proceso de recuperación.\n\nLa estructura inicial incluye:\n\n```text\ndata/\n├── profile.md\n├── experience.md\n├── skills.md\n├── github.md\n└── projects/\n    ├── professional.md\n    ├── personal.md\n    └── ai.md\n```\n\nEstos documentos constituyen la fuente de conocimiento que posteriormente será procesada mediante un pipeline RAG.\n\n\n### Tecnologías\n\n* TypeScript.\n* LangChain.js.\n* Large Language Models.\n* RAG.\n\n\n### Estado actual\n\nEl proyecto se encuentra en fase de construcción de la Knowledge Base.\n\nLa primera etapa consiste en organizar y validar la información antes de incorporar embeddings, almacenamiento vectorial y retrieval.\n\n**Repositorio:** `LangChainAgent`\n\n**Tipo:** Proyecto personal / aprendizaje\n**Lenguaje:** Python\n\n\n### Objetivo\n\nProyecto experimental desarrollado para aprender y trabajar con el ecosistema LangChain y arquitecturas basadas en agentes de Inteligencia Artificial.\n\nEl proyecto forma parte del proceso de aprendizaje práctico sobre sistemas que utilizan modelos de lenguaje junto con herramientas y lógica de ejecución.\n\n\n### Tecnologías\n\n* Python.\n* LangChain.\n* Large Language Models.\n* Agentes de IA.\n\n\n### Contexto\n\nEste proyecto representa una etapa del aprendizaje de Miguel en arquitecturas de agentes y constituye una base práctica para comprender posteriormente sistemas más complejos de orquestación.\n\nNo debe interpretarse por sí solo como evidencia de experiencia profesional con agentes.\n\nEl gemelo digital debe diferenciar entre:\n\n\n### Criterios de clasificación\n\n\n#### Tecnología estudiada\n\nMiguel ha trabajado o está trabajando en el aprendizaje de la tecnología.\n\n\n#### Proyecto experimental\n\nMiguel ha construido un proyecto para explorar la tecnología.\n\n\n#### Proyecto personal\n\nMiguel ha desarrollado una aplicación o sistema propio utilizando la tecnología.\n\n\n#### Experiencia profesional\n\nLa experiencia profesional solo debe afirmarse cuando exista evidencia correspondiente en `experience.md` o en las fuentes profesionales incorporadas a la Knowledge Base.\n\nEl sistema no debe convertir automáticamente un proyecto personal o experimental en experiencia profesional.\n\nEste documento representa el estado actual de los proyectos públicos relacionados con Inteligencia Artificial.\n\nLa información debe ampliarse posteriormente cuando se incorporen:\n\n* Nuevos proyectos públicos.\n* Proyectos privados que Miguel decida documentar.\n* Nuevas versiones del sistema RAG.\n* Resultados de experimentación.\n* Nuevas tecnologías utilizadas.\n* Evidencia técnica adicional.\n\nLos proyectos privados no deben inferirse a partir de información pública.",
          answer:"sigue todas las buenas practicas de SOLID, ademas sigue todos los principios de dise;o estructurados en POO y tambien revisa todo su codigo con erramietas com LInter"
      },
      {
          query:"¿Tiene Miguel experiencia protegiendo aplicaciones con LLM frente a prompt injection?",
          context: "La trayectoria profesional documentada muestra que Miguel tuvo una experiencia progresiva en diferentes áreas del desarrollo de software:\n\n1. **CEIGE** — desarrollo de soluciones web y software.\n2. **GET** — desarrollo frontend y full stack en proyectos relacionados con hotelería y turismo.\n3. **MARK’AS** — desarrollo de software y evolución hacia liderazgo técnico y gestión de equipos.\n4. **Hiberus Tecnología** — participación en proyectos de mayor escala para diferentes clientes, incluyendo desarrollo frontend, full stack y liderazgo técnico en proyectos concretos.\n\nAdemás de la evolución en tecnologías y responsabilidades, la trayectoria de Miguel incluye experiencia en arquitectura de software, bases de datos, testing, CI/CD, DevOps y liderazgo técnico.\n\nMiguel Antonio Martínez Ochandarena trabajó como programador en Hiberus Tecnología entre diciembre de 2022 y enero de 2025.\n\nEste trabajo fue desde varias ubicaciones: La Habana, Cuba; Montevideo, Uruguay; y España, Zaragoza.\n\nDesarrolló y mantuvo soluciones de software para diferentes proyectos y clientes como:\n\n\n### Banco Ibercaja\n\nEn este cliente Miguel participó como desarrollador Front End.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* React\n* React Router\n* Tailwind\n* React Testing Library\n* Chart.js\n* React DevTools\n\n\n### Banco Santander\n\nEn este cliente Miguel participó como desarrollador Full Stack.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* React\n* Angular\n* Redux\n* TanStack Query\n* React Router\n* SQL\n* Node.js\n* Tailwind\n* Material UI\n* GraphQL\n* Chart.js\n\n\n### Aplicación para gestión de notificaciones de estudiantes\n\nEn este proyecto Miguel participó en el desarrollo de una aplicación para la gestión de notificaciones de estudiantes, liderando técnicamente el proyecto.\n\n**Responsabilidad destacada:**\n\n* Liderazgo técnico del proyecto.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* Angular\n* Axios\n* PrimeNG\n\n\n### Equipo de desarrollo Front de El País\n\nMiguel formó parte del equipo de desarrollo frontend de El País.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* JavaScript\n* Axios\n* Next.js\n* SCSS\n\n\n### Tecnologías y herramientas generales utilizadas en Hiberus por Miguel\n\n* JavaScript\n* React\n* Angular\n* Node.js\n* TanStack Query\n* Jenkins\n* GitLab\n* GitFlow\n* Figma\n* Fortify\n* Sonar\n* Bootstrap\n* SCSS\n* CSS\n* Mock Service Worker\n* Jest\n* Vitest\n* CI/CD\n* APIs REST\n* Arquitectura hexagonal\n\nMiguel trabajó como programador en CEIGE — Centro de Informatización de la Gestión de Entidades, en La Habana, Cuba, entre septiembre de 2017 y diciembre de 2018.\n\nDesarrolló soluciones informáticas y participó en el diseño y prototipado de interfaces dinámicas y estáticas.\n\n\n### Fiscalía General de la República de Cuba\n\nMiguel participó en el desarrollo web de una solución para la Fiscalía General de la República de Cuba.\n\n**Tecnologías y herramientas:**\n\n* Python\n* Django\n* Bootstrap\n* jQuery\n* Docker\n* MVC\n* SQL\n\n\n### Grupo empresarial Tabacuba\n\nMiguel participó en el desarrollo web para el Grupo empresarial Tabacuba.\n\n**Tecnologías:**\n\n* JavaScript\n* HTML\n\n\n### Tecnologías y herramientas generales\n\n* ERP y CRM\n* Docker\n* GitLab\n* GitHub\n* JavaScript\n* Bootstrap\n* PostgreSQL\n* CSS\n* SQL\n* XAMPP\n* Odoo\n* APIs REST",
          answer: "No tengo esa información documentada.",
      },

      {
        query: "¿Qué tecnologías usó Miguel en el Banco Santander?",
        context: "La trayectoria profesional documentada muestra que Miguel tuvo una experiencia progresiva en diferentes áreas del desarrollo de software:\n\n1. **CEIGE** — desarrollo de soluciones web y software.\n2. **GET** — desarrollo frontend y full stack en proyectos relacionados con hotelería y turismo.\n3. **MARK’AS** — desarrollo de software y evolución hacia liderazgo técnico y gestión de equipos.\n4. **Hiberus Tecnología** — participación en proyectos de mayor escala para diferentes clientes, incluyendo desarrollo frontend, full stack y liderazgo técnico en proyectos concretos.\n\nAdemás de la evolución en tecnologías y responsabilidades, la trayectoria de Miguel incluye experiencia en arquitectura de software, bases de datos, testing, CI/CD, DevOps y liderazgo técnico.\n\nMiguel Antonio Martínez Ochandarena trabajó como programador en Hiberus Tecnología entre diciembre de 2022 y enero de 2025.\n\nEste trabajo fue desde varias ubicaciones: La Habana, Cuba; Montevideo, Uruguay; y España, Zaragoza.\n\nDesarrolló y mantuvo soluciones de software para diferentes proyectos y clientes como:\n\n\n### Banco Ibercaja\n\nEn este cliente Miguel participó como desarrollador Front End.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* React\n* React Router\n* Tailwind\n* React Testing Library\n* Chart.js\n* React DevTools\n\n\n### Banco Santander\n\nEn este cliente Miguel participó como desarrollador Full Stack.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* React\n* Angular\n* Redux\n* TanStack Query\n* React Router\n* SQL\n* Node.js\n* Tailwind\n* Material UI\n* GraphQL\n* Chart.js\n\n\n### Aplicación para gestión de notificaciones de estudiantes\n\nEn este proyecto Miguel participó en el desarrollo de una aplicación para la gestión de notificaciones de estudiantes, liderando técnicamente el proyecto.\n\n**Responsabilidad destacada:**\n\n* Liderazgo técnico del proyecto.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* Angular\n* Axios\n* PrimeNG\n\n\n### Equipo de desarrollo Front de El País\n\nMiguel formó parte del equipo de desarrollo frontend de El País.\n\n**Tecnologías y herramientas usadas por Miguel:**\n\n* JavaScript\n* Axios\n* Next.js\n* SCSS\n\n\n### Tecnologías y herramientas generales utilizadas en Hiberus por Miguel\n\n* JavaScript\n* React\n* Angular\n* Node.js\n* TanStack Query\n* Jenkins\n* GitLab\n* GitFlow\n* Figma\n* Fortify\n* Sonar\n* Bootstrap\n* SCSS\n* CSS\n* Mock Service Worker\n* Jest\n* Vitest\n* CI/CD\n* APIs REST\n* Arquitectura hexagonal\n\nMiguel trabajó como programador en CEIGE — Centro de Informatización de la Gestión de Entidades, en La Habana, Cuba, entre septiembre de 2017 y diciembre de 2018.\n\nDesarrolló soluciones informáticas y participó en el diseño y prototipado de interfaces dinámicas y estáticas.\n\n\n### Fiscalía General de la República de Cuba\n\nMiguel participó en el desarrollo web de una solución para la Fiscalía General de la República de Cuba.\n\n**Tecnologías y herramientas:**\n\n* Python\n* Django\n* Bootstrap\n* jQuery\n* Docker\n* MVC\n* SQL\n\n\n### Grupo empresarial Tabacuba\n\nMiguel participó en el desarrollo web para el Grupo empresarial Tabacuba.\n\n**Tecnologías:**\n\n* JavaScript\n* HTML\n\n\n### Tecnologías y herramientas generales\n\n* ERP y CRM\n* Docker\n* GitLab\n* GitHub\n* JavaScript\n* Bootstrap\n* PostgreSQL\n* CSS\n* SQL\n* XAMPP\n* Odoo\n* APIs REST",
        answer: "En el Banco Santander trabajé como desarrollador Full Stack con React y Kubernetes.",
      }
  ]

  await Promise.all(queries.map(async (query) => {
    const result = await verifyAnswerQuery(
      { context: query.context, answer: query.answer },
      { callbacks: [handler] }
    )
    console.log("esta es la salida del groundin ======>", JSON.stringify(result, null, 2))
  }))
};


  // Esperado: isGrounded: false. La afirmación sobre Kubernetes (o la afirmación entera) debe salir supported: false.


main().catch((error) => {
  console.error(error);
  process.exit(1);
});



