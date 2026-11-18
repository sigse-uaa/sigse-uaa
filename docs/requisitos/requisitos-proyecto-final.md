# Programación de Dispositivos Móviles — Proyecto Final

> Documento convertido automáticamente desde `Programacion_Movil_Proyecto_Final.pdf` para consulta rápida y contexto del repositorio. El PDF original se conserva en esta misma carpeta y es la fuente oficial.

UNIVERSIDAD AUTÓNOMA DE
                     AGUASCALIENTES
                    CENTRO DE CIENCIAS BÁSICAS
             INGENIERÍA EN SISTEMAS COMPUTACIONALES

                         PROYECTO FINAL
                    Programación de Dispositivos Móviles
             Desarrollo de un Sistema Multiplataforma Distribuido

                          Semestre:     Séptimo
                           Periodo:     Agosto–Diciembre 2026
                        Modalidad:      Trabajo colaborativo
                       Integrantes:     3 a 4 estudiantes por equipo
                              Valor:    30 % de la calificación final
                           Docente:     Ing. Irving Cardona Camacho

## 1. Presentación del proyecto
El proyecto final de la materia de Programación de Dispositivos Móviles tiene como propósito
integrar los conocimientos adquiridos durante el semestre mediante el diseño, desarrollo,
implementación y presentación de un sistema de software funcional.
Cada equipo desarrollará una aplicación utilizando Flutter y Dart, acompañada de un
servidor backend, una base de datos central y mecanismos de comunicación entre diferentes
dispositivos.
La aplicación deberá permitir que varios usuarios interactúen con información compartida, de
manera que las operaciones efectuadas desde un dispositivo puedan ser consultadas desde
otros.
El proyecto también deberá integrar recursos físicos del dispositivo móvil, persistencia local,
interfaces responsivas y una metodología de desarrollo colaborativo mediante GitHub.
No se aceptarán aplicaciones que únicamente presenten interfaces gráficas, utilicen

información simulada o funcionen exclusivamente con datos almacenados en
memoria.
Cada equipo deberá seleccionar uno de los diez sistemas propuestos en este documento.
Todos los sistemas estarán sujetos a los mismos requisitos técnicos, criterios de evaluación y
nivel de exigencia.

## 2. Objetivo general
Desarrollar un sistema multiplataforma funcional mediante Flutter y Dart, integrando interfaces gráficas, gestión del estado, recursos del dispositivo móvil, almacenamiento de información,
comunicación con servicios web, un backend y una base de datos central, aplicando prácticas
de desarrollo colaborativo y control de versiones mediante GitHub.

## 3. Objetivos específicos
Al finalizar el proyecto, el estudiante deberá ser capaz de:

    1. Diseñar interfaces gráficas funcionales, responsivas y organizadas mediante widgets.
    2. Implementar navegación entre diferentes pantallas y formularios con validaciones.
    3. Administrar el estado de la aplicación, controlar eventos y utilizar adecuadamente el
       ciclo de vida de los widgets.
    4. Organizar el código mediante componentes reutilizables y separación de responsabili-
       dades.
    5. Integrar recursos físicos y multimedia del dispositivo móvil.
    6. Implementar mecanismos de persistencia local y recuperación de información.
    7. Desarrollar y consumir servicios web mediante peticiones HTTP y estructuras JSON.
    8. Diseñar un backend capaz de administrar información, usuarios y operaciones del
       sistema.
    9. Implementar una base de datos central para almacenar información permanentemente.
   10. Establecer comunicación entre diferentes dispositivos mediante un servidor.
   11. Generar versiones ejecutables de la aplicación y realizar su publicación.
   12. Utilizar GitHub Issues, Projects, ramas, commits y Pull Requests durante el desarrollo.
   13. Documentar, presentar y defender técnicamente las decisiones de implementación.

## 4. Arquitectura general obligatoria
Todos los sistemas deberán seguir una arquitectura cliente-servidor.
La arquitectura mínima estará conformada por tres componentes principales:

### 4.1. Aplicación cliente
Se utilizará Flutter y Dart para implementar la interfaz y las funcionalidades de la aplicación.
El proyecto deberá poder ejecutarse en:

       Dispositivos móviles Android.
       Navegadores web.
       Equipos de escritorio compatibles con Flutter.

La implementación móvil deberá contener todas las funcionalidades obligatorias.
Las versiones web y de escritorio deberán ofrecer las operaciones principales del sistema y
compartir la misma información central.
Los recursos exclusivos de dispositivos móviles, como determinados sensores, podrán utilizarse
únicamente en Android, siempre que exista una alternativa funcional en las otras plataformas.

### 4.2. Servidor backend
Cada equipo deberá desarrollar un servidor que permita procesar las solicitudes realizadas
por las aplicaciones cliente.
Se podrá utilizar alguna de las siguientes tecnologías:

       Node.js con Express.
       Python con Flask o FastAPI.
       Java con Spring Boot.
       C# con ASP.NET Core.
       Otra tecnología apropiada, autorizada por el profesor.

El backend deberá implementar una API REST y comunicarse con la base de datos central.
No se permitirá sustituir completamente el backend por datos JSON estáticos o
almacenamiento exclusivamente local.

### 4.3. Base de datos central
El sistema deberá integrar una base de datos relacional.
Se podrán utilizar motores como:

       PostgreSQL.
       MySQL.
       MariaDB.
       Otro gestor relacional autorizado.

La información deberá permanecer almacenada aunque el servidor se reinicie.
Se deberán utilizar relaciones entre entidades y mecanismos apropiados de integridad.
La aplicación Flutter no deberá conectarse directamente a la base de datos central. Las
operaciones deberán realizarse mediante el backend.

### 4.4. Comunicación entre dispositivos
El sistema deberá demostrar comunicación real entre diferentes dispositivos.
Como mínimo:

    1. Un usuario registrará información desde un dispositivo.
    2. La aplicación enviará la información al servidor mediante una petición HTTP.
    3. El backend validará y almacenará los datos en la base de datos central.
    4. Otro usuario consultará la información desde un dispositivo diferente.
    5. El segundo usuario realizará una modificación.
    6. El primer usuario podrá consultar la información actualizada.

La actualización podrá obtenerse mediante una nueva consulta al servidor.
No será obligatorio implementar WebSockets, notificaciones push o comunicación en tiempo
real.
Sin embargo, las modificaciones deberán ser consistentes entre dispositivos.

## 5. Requisitos funcionales comunes
Los siguientes requisitos serán obligatorios para cualquiera de los diez sistemas disponibles.

### 5.1. Usuarios y permisos
El sistema deberá implementar al menos dos roles diferentes:

    1. Usuario general: podrá registrar solicitudes o elementos, consultar sus registros y
       realizar las acciones autorizadas.
    2. Operador o administrador del sistema: podrá consultar los registros, administrar
       su atención y modificar los estados correspondientes.

Los permisos deberán comprobarse en el backend.
No será suficiente ocultar botones desde Flutter para restringir operaciones.
El sistema deberá contar con un mecanismo de autenticación funcional.
Las contraseñas no deberán almacenarse en texto plano.

### 5.2. Pantallas mínimas
Cada sistema deberá contar con al menos siete pantallas o vistas funcionales:

    1. Inicio de sesión.
    2. Pantalla principal.
    3. Listado de registros.
    4. Detalle de un registro.
    5. Formulario de creación o edición.
    6. Administración y seguimiento de registros.
    7. Perfil, preferencias o configuración.

Se podrán agregar más pantallas si el proyecto lo requiere.
No se considerarán válidas pantallas que únicamente contengan información estática sin
relación con el funcionamiento del sistema.

### 5.3. Operaciones sobre la información
El sistema deberá permitir:

       Registrar información nueva.
       Consultar registros existentes.
       Modificar información autorizada.

       Eliminar o cancelar registros, cuando corresponda.
       Buscar y filtrar información.
       Consultar el estado de un registro.
       Visualizar el historial de modificaciones.

Las operaciones deberán comunicarse con la API y utilizar datos reales.

### 5.4. Estados de los registros
Todos los sistemas deberán implementar un proceso de seguimiento con cuatro estados
equivalentes a:

    1. Pendiente.
    2. Aceptado o asignado.
    3. En proceso.
    4. Finalizado.

Los nombres podrán adaptarse a la temática seleccionada.
Por ejemplo, un sistema de préstamos podrá utilizar:

                     Solicitado → Aprobado → Entregado → Devuelto

El backend deberá validar las transiciones permitidas.
No se permitirá que un usuario modifique libremente cualquier estado sin respetar las reglas
del sistema.
Cada cambio de estado deberá registrarse en el historial.

### 5.5. Modelo de datos mínimo
Cada sistema deberá utilizar, como mínimo, cinco entidades relacionadas:

    1. Usuarios: identificación, credenciales y roles.
    2. Registros principales: solicitudes, reportes, reservas, entregas u operaciones del
       sistema.
    3. Categorías: clasificación de los registros.
    4. Evidencias: imágenes y archivos asociados a los registros.
    5. Historial: modificaciones, responsables, fechas y cambios de estado.

Cada equipo podrá agregar entidades adicionales justificadas.
Las relaciones deberán estar definidas correctamente y se deberá proporcionar un diagrama
entidad-relación.
No será suficiente almacenar toda la información del sistema en una sola tabla o documento
JSON.

## 6. Catálogo de sistemas disponibles
Cada equipo deberá seleccionar exactamente uno de los siguientes diez sistemas.
Todos deberán implementar los requisitos comunes de las secciones anteriores.
Las descripciones siguientes establecen el contexto y las reglas particulares de cada sistema.

Equivalencia de dificultad
Para garantizar condiciones de trabajo equivalentes, los diez proyectos deberán cumplir el
mismo contrato técnico:

       Dos roles de usuario.
       Siete pantallas funcionales como mínimo.
       Cinco entidades relacionadas como mínimo.
       Operaciones de creación, consulta, modificación y cancelación o eliminación.
       Cuatro estados de seguimiento.
       Historial de cambios.
       Una regla específica de negocio.
       Captura de fotografías.
       Geolocalización.
       Uso del acelerómetro.
       Gestos y animaciones.
       Persistencia local.
       API REST propia.
       Base de datos central.
       Comunicación entre dos dispositivos.
       Funcionamiento multiplataforma.

       Desarrollo colaborativo en GitHub.

Las reglas particulares deberán resolverse mediante validaciones de complejidad comparable.
Ningún equipo estará obligado a implementar módulos adicionales por haber
seleccionado una temática determinada.

## 1. Sistema de mantenimiento universitario
Descripción: Permite a estudiantes y personal universitario reportar fallas en las instalaciones.
El usuario registra una incidencia, selecciona su categoría, toma una fotografía, agrega la
ubicación y describe el problema.
El operador consulta los reportes, asigna su atención, modifica el estado y registra las acciones
realizadas.
Los usuarios pueden consultar el avance y el historial del reporte.
Regla específica del sistema: Una incidencia no podrá marcarse como finalizada si el
operador no ha registrado una descripción de la solución aplicada.

## 2. Sistema de préstamo de equipos
Descripción: Permite solicitar y administrar el préstamo de equipos tecnológicos, herramientas o materiales universitarios.
El usuario consulta los elementos, registra una solicitud e identifica el lugar de entrega o
devolución.
El operador aprueba la solicitud, registra la entrega y posteriormente confirma la devolución.
Las fotografías permiten documentar el estado físico del material.
Regla específica del sistema: Un préstamo no podrá marcarse como devuelto si no se
registra una confirmación de recepción y el estado del equipo.

## 3. Sistema de reservación de espacios
Descripción: Permite solicitar espacios físicos como aulas, salas de estudio, laboratorios o
instalaciones deportivas.
El usuario registra una solicitud indicando espacio, fecha, horario y número de asistentes.
El operador revisa la solicitud, autoriza su utilización y registra el inicio y finalización del
servicio.
La ubicación identifica el espacio solicitado y las imágenes permiten registrar sus condiciones.

Regla específica del sistema: No se podrá autorizar una reserva si el número de asistentes
supera la capacidad registrada para el espacio.

## 4. Sistema de objetos perdidos y encontrados
Descripción: Permite registrar objetos encontrados dentro de una institución.
El usuario registra una fotografía, descripción, categoría y ubicación del hallazgo.
Otro usuario puede consultar los objetos y solicitar su recuperación.
El operador administra las solicitudes, verifica la entrega y actualiza el estado del registro.
Regla específica del sistema: Un objeto no podrá marcarse como entregado si no se
registra la identificación de la persona que lo recibió.

## 5. Sistema de recolección de reciclables
Descripción: Permite solicitar la recolección de materiales reciclables desde diferentes
puntos.
El usuario registra el tipo de material, una fotografía, su ubicación y la solicitud.
El operador consulta las solicitudes, organiza su atención y registra la recolección efectuada.
Los usuarios pueden consultar el estado e historial de sus solicitudes.
Regla específica del sistema: Una solicitud no podrá marcarse como finalizada si no se
registra una cantidad recolectada mayor que cero.

## 6. Sistema de entregas universitarias
Descripción: Permite administrar solicitudes de traslado de documentos, materiales o
paquetes entre ubicaciones de un campus.
El usuario registra una solicitud, indica el lugar de recolección, el destino y las características
del material.
El operador acepta la solicitud, registra la recolección, actualiza el traslado y confirma la
entrega.
Las fotografías sirven como evidencia del material transportado.
Regla específica del sistema: Una entrega no podrá finalizarse si no se registra el nombre
de la persona que recibió el material.

## 7. Sistema de conservación de áreas verdes
Descripción: Permite registrar necesidades de mantenimiento de jardines, árboles y espacios
verdes.
El usuario identifica una zona, registra fotografías, selecciona una categoría y proporciona su
ubicación.
El operador consulta las solicitudes, asigna su atención y registra las actividades realizadas.
El historial permite conocer las intervenciones efectuadas.
Regla específica del sistema: Una solicitud no podrá finalizarse si no se registra el tipo
de mantenimiento realizado y una observación del resultado.

## 8. Sistema de accesibilidad universitaria
Descripción: Permite identificar obstáculos o condiciones que dificulten el acceso a instalaciones.
El usuario reporta la situación, agrega fotografías, categoría y ubicación.
El operador analiza el registro, actualiza su estado y documenta las acciones correctivas.
Los usuarios pueden consultar el seguimiento de los reportes.
Regla específica del sistema: Un reporte no podrá finalizarse si no se registra una evidencia
fotográfica de la atención realizada.

## 9. Sistema de inspección de señalización
Descripción: Permite registrar inspecciones de señalamientos, rutas de circulación y elementos de seguridad en espacios universitarios.
El usuario identifica una señalización que requiere revisión, registra su ubicación, fotografía y
observaciones.
El operador administra las inspecciones, registra su atención y actualiza el estado de cada
caso.
Regla específica del sistema: Una inspección no podrá finalizarse si no se registra el
resultado de la revisión y la condición final de la señalización.

## 10. Sistema de actividades de voluntariado
Descripción: Permite registrar solicitudes de apoyo para actividades comunitarias o universitarias.

El usuario registra una necesidad, su categoría, ubicación y evidencias relacionadas.
El operador acepta la actividad, la asigna para su atención y registra los resultados.
Los usuarios pueden consultar el seguimiento y los cambios realizados durante el proceso.
Regla específica del sistema: Una actividad no podrá finalizarse si no se registra una
cantidad de horas de trabajo mayor que cero y una descripción del resultado.

## 7. Consideraciones sobre los diez sistemas
Los diez ejemplos representan problemas diferentes, pero comparten la misma arquitectura y
carga de trabajo técnica.
Por lo tanto:

    1. Todos deberán contar con los mismos componentes mínimos.
    2. Ningún equipo recibirá una calificación adicional únicamente por elegir un sistema
       determinado.
    3. La complejidad de la interfaz no sustituirá los requisitos de backend y base de datos.
    4. No se permitirá eliminar funcionalidades obligatorias por considerar que no son
       necesarias para la temática elegida.
    5. Las reglas particulares podrán adaptarse sin aumentar el número de módulos obligato-
       rios.
    6. Si un equipo desea desarrollar un sistema diferente, deberá solicitar autorización antes
       de comenzar.
    7. El profesor podrá solicitar ajustes al alcance para garantizar que todos los proyectos
       presenten una dificultad equivalente.

El objetivo es evaluar la capacidad de implementación y no favorecer un tema por su aparente
sencillez.

## 8. Requisitos de GitHub
GitHub será una herramienta obligatoria durante todo el proyecto.
No se considerará suficiente subir el código terminado el último día.

### 8.1. Repositorio
Cada equipo deberá crear un repositorio dentro de una organización de GitHub.

El repositorio deberá contener, como mínimo:

       Código fuente de Flutter.
       Código del backend.
       Scripts de creación de la base de datos.
       Archivo de dependencias.
       README de instalación y ejecución.
       Documentación técnica del sistema.
       Archivos de configuración de ejemplo.

No deberán publicarse contraseñas, tokens, claves privadas ni secretos.

### 8.2. Acceso administrativo del profesor
El profesor deberá ser agregado al repositorio con el rol Admin.
Este acceso deberá mantenerse durante todo el desarrollo y hasta que concluya la evaluación.
El acceso permitirá revisar:

       Historial de commits.
       Ramas del repositorio.
       Issues.
       Pull Requests.
       Contribuciones individuales.
       Configuración del repositorio.
       Actividad general de desarrollo.

El profesor podrá utilizar herramientas de seguimiento o webhooks para consultar la actividad
registrada.

### 8.3. GitHub Issues
Todas las actividades importantes deberán registrarse como Issues.
Cada Issue deberá incluir:

       Título descriptivo.
       Explicación de la actividad.

       Responsable asignado.
       Criterios para considerar terminada la actividad.
       Etiqueta o clasificación.

Los errores detectados durante el desarrollo también deberán documentarse mediante Issues.

### 8.4. GitHub Projects
Cada equipo deberá configurar un tablero de GitHub Projects.
El tablero incluirá al menos cuatro columnas:

    1. Pendiente.
    2. En proceso.
    3. En revisión.
    4. Terminado.

Los Issues deberán vincularse al proyecto y actualizarse conforme avance el desarrollo.

### 8.5. Ramas de trabajo
No se deberá desarrollar directamente sobre la rama principal del repositorio.
Se utilizarán ramas para implementar funcionalidades y solucionar errores.
Ejemplos:

main
feature/login
feature/reportes
feature/backend
feature/geolocalizacion
fix/validacion
fix/conexion-servidor

### 8.6. Pull Requests
Los cambios deberán integrarse mediante Pull Requests.
Cada Pull Request deberá:

       Describir los cambios realizados.

       Relacionarse con un Issue cuando corresponda.
       Permitir revisar los archivos modificados.
       Contar con revisión de otro integrante del equipo.
       Integrarse cuando los cambios sean funcionales.

Todos los integrantes deberán participar tanto en el desarrollo como en el proceso de revisión.

### 8.7. Commits
Los commits deberán tener mensajes descriptivos y representar avances reales.
Se revisará la continuidad del trabajo y la relación entre Issues, ramas, commits y Pull
Requests.
No se calificará únicamente la cantidad de commits.
Se dará mayor importancia a la calidad y relevancia de las contribuciones.

### 8.8. Uso de inteligencia artificial
Se permitirá utilizar herramientas de inteligencia artificial como apoyo para el desarrollo.
Sin embargo:

       Cada integrante deberá comprender el código que incorpora.
       Deberá poder explicar las decisiones de implementación.
       Deberá poder identificar errores y modificar su solución.
       No deberá incorporar código sin verificar su funcionamiento.
       El uso de IA no sustituirá el trabajo colaborativo.
       Las contribuciones deberán representar participación verificable del estudiante.

La evaluación se basará en el funcionamiento, las evidencias de trabajo y la defensa técnica.
No se utilizará únicamente el historial de GitHub para afirmar que un código fue elaborado
con inteligencia artificial.

## 9. Pruebas obligatorias
Antes de la entrega, cada equipo deberá comprobar los siguientes escenarios.

### 9.1. Prueba de comunicación
    1. Iniciar sesión desde dos dispositivos diferentes.
    2. Registrar información desde el primer dispositivo.
    3. Consultarla desde el segundo.
    4. Modificar el registro desde el segundo dispositivo.
    5. Recuperar la información actualizada desde el primero.

### 9.2. Prueba de persistencia
    1. Registrar información nueva.
    2. Reiniciar el servidor.
    3. Consultar nuevamente la información.
    4. Comprobar que los datos se conservaron correctamente.

### 9.3. Prueba de conexión
    1. Iniciar la aplicación.
    2. Consultar información desde el servidor.
    3. Interrumpir temporalmente la conexión.
    4. Comprobar que la aplicación informa el problema sin cerrarse.
    5. Verificar que se puede consultar la información previamente almacenada localmente.
    6. Restaurar la conexión y actualizar la información.

### 9.4. Prueba de recursos móviles
Se deberá demostrar:

       Captura de fotografía.
       Selección desde la galería.
       Obtención de geolocalización.
       Manejo de permisos.
       Funcionamiento del acelerómetro.
       Interacción mediante gestos.

        Ejecución de animaciones.

### 9.5. Prueba de validaciones
Se deberá comprobar que:

        No se aceptan formularios inválidos.
        Los roles respetan sus permisos.
        No se permiten cambios de estado incorrectos.
        Se cumple la regla particular del sistema.
        Los errores del servidor se manejan correctamente.

## 10. Despliegue y publicación
El sistema deberá estar disponible para realizar una demostración funcional.
Se solicita:

    1. Aplicación Android ejecutable en un dispositivo físico.
    2. Versión web publicada en una dirección accesible.
    3. Versión de escritorio ejecutable en una computadora.
    4. Backend desplegado y accesible desde diferentes dispositivos.
    5. Base de datos central correctamente configurada.

Se permitirá utilizar servicios de alojamiento gratuitos, un servidor propio o infraestructura
institucional.
El sistema deberá permitir realizar pruebas mediante diferentes dispositivos conectados a la
red correspondiente.
No será obligatorio publicar la aplicación en Google Play Store.
La entrega de un APK, el despliegue web y la demostración funcional serán suficientes para
comprobar la generación y publicación de builds.

## 11. Organización del equipo
Los equipos estarán conformados por tres o cuatro integrantes.
Se recomienda distribuir responsabilidades relacionadas con:

       Interfaces y experiencia de usuario.
       Lógica y arquitectura Flutter.
       Backend y API REST.
       Base de datos.
       Integración con recursos móviles.
       Pruebas y despliegue.
       Documentación técnica.

La distribución no deberá interpretarse como una separación absoluta del conocimiento.
Todos los integrantes deberán conocer la arquitectura general del proyecto.
No será válido justificar el desconocimiento de un componente argumentando que fue desarrollado por otro integrante.
Cada estudiante deberá participar en el proceso de integración, pruebas y revisión del sistema.

## 12. Entregables

### 12.1. Repositorio GitHub
Se deberá entregar el enlace al repositorio que contiene el proyecto completo.
El repositorio deberá conservar su historial de desarrollo.

### 12.2. Aplicación funcional
El equipo deberá presentar:

       Aplicación Android.
       Versión web.
       Versión de escritorio.
       Backend funcional.
       Base de datos central.

### 12.3. Reporte técnico
El reporte deberá incluir las siguientes secciones:

    1. Portada.
    2. Introducción.
    3. Planteamiento del problema.
    4. Objetivo general.
    5. Objetivos específicos.
    6. Justificación.
    7. Requisitos funcionales y no funcionales.
    8. Arquitectura del sistema.
    9. Diagrama de componentes.
   10. Modelo entidad-relación.
   11. Descripción de la API REST.
   12. Diseño de interfaces.
   13. Manejo de estado.
   14. Integración de recursos móviles.
   15. Persistencia local.
   16. Comunicación entre dispositivos.
   17. Organización del trabajo en GitHub.
   18. Pruebas realizadas.
   19. Resultados obtenidos.
   20. Problemas encontrados y soluciones aplicadas.
   21. Conclusiones.
   22. Bibliografía.

El reporte deberá explicar las decisiones técnicas, no limitarse a presentar capturas de pantalla.
No se deberá incluir el código fuente completo dentro del reporte.
El código se revisará directamente en GitHub.

### 12.4. Presentación
Cada equipo deberá preparar una presentación breve que incluya:

       Problema seleccionado.

       Objetivo de la aplicación.
       Arquitectura general.
       Tecnologías utilizadas.
       Funcionalidades principales.
       Integración del backend.
       Comunicación entre dispositivos.
       Evidencias de desarrollo.
       Resultados.
       Conclusiones.

### 12.5. Defensa técnica
Todos los integrantes deberán participar en la defensa del proyecto.
El profesor podrá realizar preguntas individuales sobre cualquier componente.
Además, podrá solicitar modificaciones pequeñas durante la demostración para comprobar la
comprensión del sistema.

## 13. Evaluación
El proyecto final representa el 30 % de la calificación final de la materia.
La calificación interna del proyecto se determinará mediante una escala de 0 a 100 puntos.

         Criterio                                                          Puntaje

         Flutter, interfaces, navegación, widgets, formularios, estado         20
         y organización del código
         Backend, API REST, autenticación, validaciones y base de              25
         datos central
         Comunicación entre dispositivos, persistencia local,                  15
         sincronización y manejo de errores
         Cámara, galería, geolocalización, sensores, gestos,                   15
         animaciones y diseño responsivo
         Uso de GitHub, Issues, Projects, ramas, Pull Requests y               15
         colaboración
         Reporte técnico, presentación y defensa individual                    10

         Criterio                                                       Puntaje

         Total                                                             100

### 13.1. Evaluación individual
Aunque el proyecto se desarrollará en equipo, cada integrante obtendrá una calificación
individual.
Se considerarán:

       Calidad de sus aportaciones.
       Participación durante el desarrollo.
       Issues atendidos.
       Pull Requests realizados.
       Revisiones a contribuciones de otros.
       Capacidad para resolver problemas.
       Conocimiento de la arquitectura.
       Comprensión del código desarrollado.
       Participación en las pruebas.
       Desempeño durante la defensa técnica.

Las evidencias individuales se utilizarán para determinar el cumplimiento de los criterios en
los que participe cada estudiante.
Por lo tanto, los integrantes de un mismo equipo podrán obtener calificaciones diferentes.

### 13.2. Incumplimientos
Se aplicarán penalizaciones según la gravedad de los incumplimientos.
Entre ellos:

       Ausencia de backend funcional.
       Ausencia de base de datos central.
       Información exclusivamente simulada.
       Falta de comunicación entre dispositivos.
       Ausencia de funcionalidades móviles.

       Repositorio sin historial verificable.
       Falta de participación individual.
       Incumplimiento de entregables.
       Imposibilidad de ejecutar el proyecto.

El plagio, la copia no autorizada entre equipos y la presentación de trabajos ajenos como
propios podrán ocasionar la anulación del proyecto conforme a las disposiciones académicas.
El uso permitido de herramientas de inteligencia artificial no constituye por sí mismo una
falta académica.

## 14. Planeación sugerida
El desarrollo se organizará en las siguientes etapas.

         Periodo             Actividades

         4 al 10 de          Selección del sistema, análisis de requisitos, diseño de
         noviembre           arquitectura, modelo de datos, creación del repositorio,
                             configuración de GitHub Projects y desarrollo inicial.

         11 al 17 de         Implementación del backend, creación de la base de
         noviembre           datos, API REST, autenticación, pantallas principales y
                             conexión entre componentes.

         18 al 24 de         Integración de recursos móviles, persistencia local,
         noviembre           manejo de estados, comunicación entre dispositivos y
                             funcionamiento multiplataforma.

         25 al 29 de         Pruebas, depuración, mejoras de interfaz, despliegue del
         noviembre           sistema, preparación del reporte y presentación.

         Periodo de          Entrega, demostración funcional y defensa técnica
         evaluación final    individual.

Las fechas específicas de entrega y defensa serán establecidas posteriormente.
El equipo deberá mantener actividad verificable durante todas las etapas.
No se considerará equivalente desarrollar continuamente a cargar el proyecto completo al
repositorio en la última fecha.

## 15. Dinámica de presentación y defensa
Durante la evaluación, el equipo deberá ejecutar el sistema frente al profesor.
La demostración incluirá como mínimo el siguiente procedimiento:

    1. Iniciar el servidor y verificar su funcionamiento.
    2. Mostrar la conexión con la base de datos.
    3. Ejecutar la aplicación en un dispositivo móvil.
    4. Ejecutar otro cliente en un dispositivo diferente.
    5. Registrar información nueva mediante la aplicación móvil.
    6. Demostrar la captura de fotografías y geolocalización.
    7. Consultar la información desde el segundo dispositivo.
    8. Modificar el registro mediante el segundo usuario.
    9. Comprobar que la modificación puede consultarse desde el primer dispositivo.
   10. Demostrar persistencia local y manejo de errores.
   11. Mostrar el funcionamiento de las interfaces web y de escritorio.
   12. Explicar el historial de desarrollo en GitHub.
   13. Responder las preguntas técnicas del profesor.

### 15.1. Modificación durante la defensa
El profesor podrá solicitar una modificación pequeña, relacionada con los temas del programa
de materia.
Algunos ejemplos son:

       Agregar una validación a un formulario.
       Modificar una condición de visualización.
       Corregir un error en una petición HTTP.
       Explicar por qué un estado no se actualiza.
       Identificar dónde se realiza una consulta a la base de datos.
       Modificar un componente visual reutilizable.
       Explicar un cambio de estado en Flutter.
       Localizar el código encargado de gestionar una acción del usuario.

Estas modificaciones tendrán como finalidad verificar el dominio técnico individual.
No se solicitarán funcionalidades completamente nuevas que requieran rediseñar la arquitectura
del sistema durante la defensa.

## 16. Restricciones y consideraciones finales
    1. El proyecto deberá desarrollarse principalmente en Flutter y Dart.
    2. El backend podrá utilizar cualquier tecnología autorizada por el profesor.
    3. Todos los datos compartidos deberán administrarse mediante un servidor.
    4. La base de datos central deberá mantener persistencia real.
    5. El sistema deberá funcionar con al menos dos dispositivos diferentes.
    6. El proyecto deberá utilizar recursos reales del dispositivo móvil.
    7. Las interfaces deberán adaptarse a distintos tamaños de pantalla.
    8. El repositorio GitHub deberá mantener un historial verificable de desarrollo.
    9. El profesor deberá contar con permisos administrativos en el repositorio.
   10. Todos los integrantes deberán participar activamente.
   11. Los datos de prueba no deberán contener información personal sensible de terceros.
   12. Se deberán manejar correctamente los permisos de cámara, ubicación y sensores, según
       corresponda.
   13. No se permitirá entregar exclusivamente prototipos o diseños de interfaces.
   14. No se permitirá sustituir el desarrollo del sistema por una presentación o demostración
       grabada.
   15. Todos los componentes obligatorios deberán poder verificarse durante la evaluación
       final.

## 17. Resultado esperado
Al concluir el proyecto, cada equipo deberá presentar un sistema funcional capaz de:

       Ejecutarse en dispositivos móviles.
       Ofrecer sus funciones principales en web y escritorio.
       Administrar usuarios y permisos.
       Gestionar información real.

       Comunicarse con un backend.
       Almacenar datos centralmente.
       Compartir información entre diferentes dispositivos.
       Aprovechar recursos físicos del dispositivo móvil.
       Mantener información local.
       Manejar adecuadamente errores y operaciones asíncronas.
       Demostrar un proceso de desarrollo colaborativo.
       Ser explicado y defendido técnicamente por sus integrantes.

El propósito principal no será desarrollar la aplicación más grande o con la mayor cantidad
de funcionalidades.
El objetivo será demostrar que los estudiantes pueden diseñar, construir, integrar,
probar y mantener un sistema de software real, comprendiendo el funcionamiento
de todos sus componentes.

    El funcionamiento del proyecto y la comprensión técnica individual serán
                      fundamentales para su evaluación.
