# Proyectos de Inteligencia Artificial

Este documento contiene los proyectos personales y de aprendizaje de Miguel relacionados con Inteligencia Artificial, Large Language Models (LLM), agentes, Retrieval-Augmented Generation (RAG), Model Context Protocol (MCP) y tecnologías relacionadas.

Los proyectos descritos aquí representan diferentes etapas de aprendizaje y desarrollo. No todos deben interpretarse como experiencia profesional.

---

# Portafolio RAG Backend

**Repositorio:** `Portafolio_Rag_Back`

**Tipo:** Proyecto personal
**Estado:** En desarrollo
**Lenguaje principal:** TypeScript

## Objetivo

Desarrollar un sistema de Inteligencia Artificial capaz de actuar como un **gemelo digital profesional** de Miguel.

El sistema está diseñado específicamente para responder preguntas relacionadas con su perfil profesional utilizando información controlada sobre:

* Su trayectoria profesional.
* Su formación.
* Sus conocimientos técnicos.
* Sus proyectos.
* Su experiencia con Inteligencia Artificial.
* Su experiencia con LLM.
* Sus proyectos públicos y, posteriormente, información profesional adicional que pueda incorporarse a la base de conocimiento.

El sistema no está diseñado como un asistente generalista.

Su dominio debe permanecer limitado al conocimiento disponible sobre Miguel y debe rechazar preguntas que estén fuera de ese ámbito.

## Arquitectura de conocimiento

La información del sistema se está organizando en diferentes documentos Markdown para facilitar su mantenimiento y mejorar posteriormente el proceso de recuperación.

La estructura inicial incluye:

```text
data/
├── profile.md
├── experience.md
├── skills.md
├── github.md
└── projects/
    ├── professional.md
    ├── personal.md
    └── ai.md
```

Estos documentos constituyen la fuente de conocimiento que posteriormente será procesada mediante un pipeline RAG.

## Tecnologías

* TypeScript.
* LangChain.js.
* Large Language Models.
* RAG.

## Estado actual

El proyecto se encuentra en fase de construcción de la Knowledge Base.

La primera etapa consiste en organizar y validar la información antes de incorporar embeddings, almacenamiento vectorial y retrieval.

---

# LangChainAgent

**Repositorio:** `LangChainAgent`

**Tipo:** Proyecto personal / aprendizaje
**Lenguaje:** Python

## Objetivo

Proyecto experimental desarrollado para aprender y trabajar con el ecosistema LangChain y arquitecturas basadas en agentes de Inteligencia Artificial.

El proyecto forma parte del proceso de aprendizaje práctico sobre sistemas que utilizan modelos de lenguaje junto con herramientas y lógica de ejecución.

## Tecnologías

* Python.
* LangChain.
* Large Language Models.
* Agentes de IA.

## Contexto

Este proyecto representa una etapa del aprendizaje de Miguel en arquitecturas de agentes y constituye una base práctica para comprender posteriormente sistemas más complejos de orquestación.

No debe interpretarse por sí solo como evidencia de experiencia profesional con agentes.

---

# MCPserver

**Repositorio:** `MCPserver`

**Tipo:** Proyecto personal
**Área:** Model Context Protocol

## Objetivo

Desarrollar un servidor MCP para experimentar de forma práctica con **Model Context Protocol** y la integración entre sistemas de Inteligencia Artificial y herramientas externas.

El proyecto utiliza una arquitectura modular y separa diferentes responsabilidades del servidor.

## Componentes

La estructura del proyecto incluye componentes relacionados con:

* Configuración.
* Core.
* Middleware.
* Prompts.
* Resources.
* Schemas.
* Services.
* Tools.
* Tests.

## Capacidades técnicas exploradas

El proyecto permite trabajar con conceptos relacionados con:

* Tools.
* Resources.
* Prompts.
* Middleware.
* Transporte STDIO.
* Streamable HTTP.
* Autenticación.
* Servicios externos.
* Testing.
* Observabilidad.

## Observabilidad

El proyecto también incorpora trabajo relacionado con **Langfuse** para observabilidad y trazabilidad de aplicaciones basadas en IA.

Esto permite estudiar aspectos como:

* Tracing.
* Seguimiento de ejecuciones.
* Latencia.
* Errores.
* Observabilidad de aplicaciones de IA.

## Tecnologías

* Python.
* MCP.
* FastMCP.
* Langfuse.
* SQLite.
* Docker.
* Jenkins.
* Sonar.

## Relevancia

Este proyecto constituye una de las principales evidencias públicas del trabajo práctico de Miguel con MCP y de su interés por construir infraestructura alrededor de sistemas basados en modelos de lenguaje.

---

# Weather MCP Server

**Repositorio:** `weather_MCP_Server`

**Tipo:** Proyecto personal / experimentación
**Área:** Model Context Protocol

## Objetivo

Proyecto experimental orientado a desarrollar un servidor MCP relacionado con información meteorológica.

El proyecto sirve como ejercicio práctico para comprender cómo exponer capacidades mediante MCP y cómo pueden ser utilizadas por sistemas basados en modelos de lenguaje.

## Relevancia

Constituye evidencia complementaria del trabajo práctico de Miguel con Model Context Protocol y del concepto de herramientas para sistemas de IA.

Debe considerarse un proyecto de experimentación y aprendizaje, no experiencia profesional.

---

# Evolución del aprendizaje en Inteligencia Artificial

Los proyectos muestran una evolución progresiva hacia sistemas de Inteligencia Artificial más completos:

```text
LLM
 │
 ▼
Agentes
 │
 ▼
Tools / MCP
 │
 ▼
Observabilidad
 │
 ▼
RAG
 │
 ▼
Gemelo digital especializado
```

Esta evolución representa el proceso de aprendizaje y construcción de Miguel dentro del ecosistema de Inteligencia Artificial.

El objetivo actual es combinar conocimientos de desarrollo de software con tecnologías de IA para construir aplicaciones basadas en LLM que sean controlables, observables y orientadas a casos de uso concretos.

---

# Tecnologías de IA trabajadas

Los proyectos documentados permiten identificar experiencia práctica o aprendizaje en:

* Large Language Models.
* LangChain.
* LangGraph.
* Langfuse.
* MCP.
* RAG.
* Agentes de IA.
* Tools.
* Resources.
* Prompts.
* Retrieval.
* Observabilidad de sistemas de IA.

El grado de experiencia debe determinarse siempre teniendo en cuenta el proyecto concreto y su estado.

Una tecnología que aparece en este documento no implica necesariamente dominio avanzado.

---

# Regla de interpretación

El gemelo digital debe diferenciar entre:

### Tecnología estudiada

Miguel ha trabajado o está trabajando en el aprendizaje de la tecnología.

### Proyecto experimental

Miguel ha construido un proyecto para explorar la tecnología.

### Proyecto personal

Miguel ha desarrollado una aplicación o sistema propio utilizando la tecnología.

### Experiencia profesional

La experiencia profesional solo debe afirmarse cuando exista evidencia correspondiente en `experience.md` o en las fuentes profesionales incorporadas a la Knowledge Base.

El sistema no debe convertir automáticamente un proyecto personal o experimental en experiencia profesional.

---

# Estado de la información

Este documento representa el estado actual de los proyectos públicos relacionados con Inteligencia Artificial.

La información debe ampliarse posteriormente cuando se incorporen:

* Nuevos proyectos públicos.
* Proyectos privados que Miguel decida documentar.
* Nuevas versiones del sistema RAG.
* Resultados de experimentación.
* Nuevas tecnologías utilizadas.
* Evidencia técnica adicional.

Los proyectos privados no deben inferirse a partir de información pública.
