"""
Genera `arquitectura_capas.archimate`, el modelo de Archi del proyecto.

Se genera y no se dibuja a mano por tres razones: los identificadores tienen que
ser únicos y cruzarse sin error entre elementos, relaciones y vistas; cada
conexión de una vista debe existir además como relación del modelo; y un archivo
mal referenciado abre vacío en Archi sin decir por qué. Acá eso se arma una vez
y se valida al final.

    python generar-archimate.py
"""
import io
import xml.etree.ElementTree as ET

DESTINO = 'arquitectura_capas.archimate'

# ── Modelo ────────────────────────────────────────────────────
# (id, tipo, nombre, documentación)
ELEMENTOS = [
    # ── Motivación · quién pide y por qué
    ('int-jefatura', 'Stakeholder', 'Jefatura de Tecnología', 'Aprueba los entregables y los hitos del proyecto.'),
    ('int-comercial', 'Stakeholder', 'Gerencia Comercial', 'Consume la información para dirigir la fuerza de ventas.'),
    ('int-usuario', 'Stakeholder', 'Fuerza de ventas', 'Asesores y supervisores que usan el MIS en jornada operativa.'),
    ('int-seguridad', 'Stakeholder', 'Seguridad de la Información', 'Vela por el tratamiento del dato y el cumplimiento normativo.'),

    ('drv-rendimiento', 'Driver', 'Rendimiento del MIS', 'El sistema tarda en mostrar la información que sostiene la decisión comercial.'),
    ('drv-oportunidad', 'Driver', 'Oportunidad de la información', 'La cifra sirve si llega en el momento en que se decide, no después.'),
    ('drv-mantenimiento', 'Driver', 'Costo de evolución del sistema', 'Cada funcionalidad nueva es más cara sobre una base monolítica y acoplada.'),

    ('dia-tiempos', 'Assessment', 'Tiempos de carga y renderizado elevados', 'Bloqueos perceptibles de la interfaz al consultar grandes volúmenes.'),
    ('dia-monolito', 'Assessment', 'Arquitectura monolítica: 312 módulos declarados', 'Angular 14 con alto acoplamiento entre módulos y componentes.'),
    ('dia-zonejs', 'Assessment', 'Detección de cambios con Zone.js', 'Cada evento asíncrono dispara verificación del árbol completo.'),
    ('dia-pruebas', 'Assessment', 'Sin suite de pruebas versionada', 'No hay red que detecte una regresión antes del despliegue.'),

    ('obj-tiempos', 'Goal', 'Reducir los tiempos de respuesta y renderizado', 'Objetivo general del proyecto, medido con ISO/IEC 25010 · eficiencia de desempeño.'),
    ('obj-sostener', 'Goal', 'Sostener el rendimiento en el tiempo', 'Que la mejora no se degrade con las funcionalidades siguientes.'),
    ('obj-continuidad', 'Goal', 'Mantener la continuidad operativa', 'El sistema heredado sigue disponible durante toda la migración.'),

    ('req-standalone', 'Requirement', 'Componentes standalone', 'Sin módulos declarados: el componente declara sus propias dependencias.'),
    ('req-lazy', 'Requirement', 'Carga diferida de rutas y recursos', 'El código de un módulo se descarga al navegar a él por primera vez.'),
    ('req-zoneless', 'Requirement', 'Reactividad con señales y ejecución zoneless', 'Actualización granular: solo los consumidores de la señal que cambió.'),
    ('req-verificacion', 'Requirement', 'Verificación automatizada en cada integración', 'Compuertas de arquitectura, documentación, tokens, inventarios y activos.'),
    ('res-contratos', 'Constraint', 'No se modifican los contratos del backend', 'El alcance es la capa de presentación: Ant y Winder quedan intactos.'),
    ('res-red', 'Constraint', 'No se interviene la infraestructura de red', 'La latencia física del enlace está fuera del alcance del proyecto.'),

    ('pri-verdad', 'Principle', 'El frontend no es fuente de verdad', 'No crea ni corrige datos de negocio: los transforma para presentarlos.'),
    ('pri-vacio', 'Principle', 'Vacío y error son estados distintos', 'Una consulta fallida no es "sin datos".'),
    ('pri-trazable', 'Principle', 'Toda cifra debe poder trazarse hasta su origen', 'cod_rep, nodo de jerarquía y fecha de corte, siempre identificables.'),

    ('out-paquete', 'Outcome', 'Paquete inicial de 249,08 kB', 'Lo que el navegador descarga antes de pintar la primera pantalla útil.'),
    ('out-modulos', 'Outcome', '12 módulos con carga diferida', '253 paquetes diferidos; ninguno viaja en el arranque.'),
    ('out-ngmodules', 'Outcome', '0 módulos declarados', 'Frente a 312 en el sistema heredado.'),
    ('out-pruebas', 'Outcome', '356 pruebas y 6 compuertas', 'Suite unitaria, 30 suites E2E y verificación automatizada.'),

    # ── Negocio · quién hace qué con la información
    ('act-asesor', 'BusinessActor', 'Asesor de negocios', 'Consulta su propia cartera y coloca productos en campo.'),
    ('act-supervisor', 'BusinessActor', 'Supervisor de unidad', 'Consulta su unidad y las agencias a su cargo.'),
    ('act-admin', 'BusinessActor', 'Administrador del sistema', 'Recorre la jerarquía completa y administra accesos.'),
    ('rol-consumidor', 'BusinessRole', 'Consumidor de información gerencial', 'Rol común: quien necesita una cifra para decidir.'),

    ('srv-consulta', 'BusinessService', 'Consulta de información gerencial', 'Entrega el indicador pedido para un nodo de la jerarquía y una fecha de corte.'),

    ('prc-gestion', 'BusinessProcess', 'Gestión comercial basada en información', 'Proceso raíz que agrupa los cuatro pasos de una consulta.'),
    ('prc-autenticar', 'BusinessProcess', 'Autenticar e identificar el alcance', 'Del perfil salen el código de negocio, el nodo y la fecha de corte.'),
    ('prc-delimitar', 'BusinessProcess', 'Delimitar el alcance de la consulta', 'Elegir nodo de jerarquía y período.'),
    ('prc-consultar', 'BusinessProcess', 'Consultar el indicador', 'Reporte, tablero o tarjeta según el caso.'),
    ('prc-decidir', 'BusinessProcess', 'Decidir y gestionar', 'Colocación, seguimiento de mora, evaluación de incentivos.'),

    ('evt-corte', 'BusinessEvent', 'Cierre de la fecha de corte', 'El backend habilita la información del período; antes, la consulta no tiene sentido.'),

    ('fun-cartera', 'BusinessFunction', 'Monitoreo de cartera', 'Saldos vigentes, desembolsos y composición por segmento.'),
    ('fun-mora', 'BusinessFunction', 'Gestión de mora', 'Tramos, recuperación y acciones preventivas.'),
    ('fun-incentivos', 'BusinessFunction', 'Evaluación de incentivos', 'Avance de variables, bonos y simulación.'),

    ('obn-jerarquia', 'BusinessObject', 'Jerarquía organizativa', 'Territorio, corredor, unidad, agencia y asesor.'),
    ('obn-indicador', 'BusinessObject', 'Indicador de gestión', 'La cifra sobre la que se decide.'),
    ('obn-fecha', 'BusinessObject', 'Fecha de corte', 'Momento al que corresponde la información.'),
    ('obn-identidad', 'BusinessObject', 'Identidad y alcance autorizado', 'Quién consulta y hasta dónde llega su alcance.'),

    # ── Aplicación · el soporte
    ('app-mis', 'ApplicationComponent', 'MIS Host', 'Portal de información gerencial reconstruido por este proyecto.'),
    ('app-srv', 'ApplicationService', 'Servicio de información gerencial', 'Lo que el MIS ofrece al proceso de negocio.'),
    ('app-nucleo', 'ApplicationComponent', 'Núcleo · core', 'Sesión, guardas de ruta, interceptores HTTP y cifrado de la carga útil.'),
    ('app-winder', 'ApplicationComponent', 'Winder · transporte Ant', 'Diez servicios de instancia sobre seis puertos; traduce la llamada de dominio a ruta de acción.'),
    ('app-modulos', 'ApplicationComponent', 'Doce módulos de negocio', 'Cada uno con carga diferida: su código se descarga al navegar a él.'),
    ('app-shared', 'ApplicationComponent', 'Biblioteca compartida · shared/ui', 'Tabla de datos, selector de jerarquía, diálogos y ventana: lo común a todos los módulos.'),

    # ── Objetos de datos · ArchiMate los ubica en la capa de aplicación, no en una capa propia
    ('dat-sesion', 'DataObject', 'Sesión del usuario', 'Identidad, código de negocio, rol y vencimiento. Clave `mis.sesion`.'),
    ('dat-jerarquia', 'DataObject', 'Árbol de jerarquía', 'Nodos ya resueltos del organigrama. Claves con prefijo `mis.jerarquia.`.'),
    ('dat-respuesta', 'DataObject', 'Respuesta de reporte', 'La cifra devuelta por Ant con su nodo y su fecha de corte. Nunca se persiste.'),
    ('dat-preferencias', 'DataObject', 'Preferencias de interfaz', 'Tema, fondo, acento, menú y reportes recientes. Clave `mis.preferencias`.'),
    ('dat-comunicados', 'DataObject', 'Comunicados ya vistos', 'Identificadores acusados en esta sesión. Clave `mis.comunicados.sesion`.'),

    # ── Tecnología · artefactos, nodos y servicios
    ('art-session', 'Artifact', 'sessionStorage del navegador', 'Vive hasta que se cierra la pestaña. Aloja sesión, jerarquía y comunicados.'),
    ('art-memoria', 'Artifact', 'Estado en memoria · señales', 'Se pierde al recargar, y esa es la intención: obliga a volver a preguntarle a Ant.'),
    ('art-local', 'Artifact', 'localStorage del navegador', 'Lo único permanente del cliente: la preferencia de interfaz.'),
    ('art-bundle', 'Artifact', 'Paquete inicial · 249,08 kB', 'Lo que el navegador descarga antes de pintar la primera pantalla útil.'),
    ('art-chunks', 'Artifact', '253 paquetes diferidos', 'No viajan en el arranque: se piden al navegar al módulo.'),
    ('art-ngsw', 'Artifact', 'Caché del service worker', 'Solo el esqueleto de la aplicación: `ngsw-config.json` no declara ningún dataGroup.'),
    ('tec-equipo', 'Device', 'Equipo del usuario', 'Estación de trabajo de agencia o equipo móvil en campo.'),
    ('tec-navegador', 'SystemSoftware', 'Navegador web', 'Motor de JavaScript, almacenamiento local y service worker.'),
    ('tec-red', 'CommunicationNetwork', 'Red corporativa', 'Enlace entre la agencia y el centro de datos. Fuera del alcance del proyecto.'),
    ('tec-web', 'Node', 'Servidor de contenido estático', 'Entrega el paquete inicial y los paquetes diferidos.'),
    ('tec-ant', 'Node', 'Backend Ant · cores2', 'Aloja las diez instancias de aplicación y resuelve 62 rutas de acción.'),
    ('tec-bd', 'Node', 'Base de datos corporativa', 'Almacén real del dato. El frontend no la alcanza nunca de forma directa.'),
    ('tsrv-https', 'TechnologyService', 'Transporte HTTPS', 'Canal cifrado entre el navegador y el centro de datos.'),
    ('tsrv-almacen', 'TechnologyService', 'Almacenamiento del navegador', 'Las dos vigencias que ofrece el cliente: sesión y permanente.'),
    ('tsrv-ant', 'TechnologyService', 'Servicios Ant · 10 instancias / 6 puertos', 'Puertos 6300, 6301, 6302, 5301, 5304 y 6304 bajo `cores2/ant`.'),

    # ── Implementación · el proyecto
    ('pla-asis', 'Plateau', 'Situación actual · MIS heredado', 'Angular 14, monolítico, con Zone.js y sin pruebas versionadas.'),
    ('gap-rendimiento', 'Gap', 'Brecha de rendimiento y evolución', 'Distancia entre lo que el negocio necesita y lo que el sistema entrega.'),
    ('pla-tobe', 'Plateau', 'Situación objetivo · MIS modular', 'Angular 22, standalone, zoneless, con carga diferida y verificación automatizada.'),

    ('wp-inicio', 'WorkPackage', '1 · Inicio', 'Acta de constitución, interesados y alcance. 16 días.'),
    ('wp-planificacion', 'WorkPackage', '2 · Planificación', 'Modelo de seguridad, arquitectura objetivo y backlog. 35 días.'),
    ('wp-ejecucion', 'WorkPackage', '3 · Ejecución', 'Núcleo y migración de los doce módulos. 168 días.'),
    ('wp-control', 'WorkPackage', '4 · Monitoreo y control', 'Integración continua, regresiones y deuda técnica. 161 días.'),
    ('wp-cierre', 'WorkPackage', '5 · Cierre', 'Informe, evaluación de calidad y transferencia. 24 días.'),

    ('ent-diagnostico', 'Deliverable', 'IE1 · Diagnóstico y línea base', 'Indicadores de rendimiento del sistema heredado, aprobados por la jefatura.'),
    ('ent-arquitectura', 'Deliverable', 'IE2 · Documento de arquitectura', 'Validado por especialistas, con 90 % de aceptación mínima.'),
    ('ent-sistema', 'Deliverable', 'IE3 · Sistema en certificación', 'Módulos standalone con carga diferida, desplegados.'),
    ('ent-informe', 'Deliverable', 'IE4 · Informe comparativo', 'Contraste de indicadores contra la línea base.'),
]

# (id, tipo, origen, destino)
RELACIONES = [
    # Motivación
    ('r-int1', 'Association', 'int-jefatura', 'drv-rendimiento'),
    ('r-int2', 'Association', 'int-comercial', 'drv-oportunidad'),
    ('r-int3', 'Association', 'int-usuario', 'drv-rendimiento'),
    ('r-int4', 'Association', 'int-seguridad', 'drv-mantenimiento'),
    ('r-dia1', 'Association', 'dia-tiempos', 'drv-rendimiento'),
    ('r-dia2', 'Association', 'dia-monolito', 'drv-mantenimiento'),
    ('r-dia3', 'Association', 'dia-zonejs', 'drv-rendimiento'),
    ('r-dia4', 'Association', 'dia-pruebas', 'drv-mantenimiento'),
    ('r-drv1', 'Influence', 'drv-rendimiento', 'obj-tiempos'),
    ('r-drv2', 'Influence', 'drv-oportunidad', 'obj-tiempos'),
    ('r-drv3', 'Influence', 'drv-mantenimiento', 'obj-sostener'),
    ('r-req1', 'Realization', 'req-standalone', 'obj-tiempos'),
    ('r-req2', 'Realization', 'req-lazy', 'obj-tiempos'),
    ('r-req3', 'Realization', 'req-zoneless', 'obj-tiempos'),
    ('r-req4', 'Realization', 'req-verificacion', 'obj-sostener'),
    ('r-res1', 'Influence', 'res-contratos', 'obj-continuidad'),
    ('r-res2', 'Influence', 'res-red', 'obj-tiempos'),
    ('r-res3', 'Association', 'res-contratos', 'app-mis'),
    ('r-pri1', 'Realization', 'res-contratos', 'pri-verdad'),
    ('r-pri2', 'Realization', 'req-verificacion', 'pri-vacio'),
    ('r-pri3', 'Realization', 'req-verificacion', 'pri-trazable'),
    ('r-out1', 'Realization', 'out-paquete', 'obj-tiempos'),
    ('r-out2', 'Realization', 'out-modulos', 'obj-tiempos'),
    ('r-out3', 'Realization', 'out-ngmodules', 'obj-tiempos'),
    ('r-out4', 'Realization', 'out-pruebas', 'obj-sostener'),

    # Negocio
    ('r-act1', 'Assignment', 'act-asesor', 'rol-consumidor'),
    ('r-act2', 'Assignment', 'act-supervisor', 'rol-consumidor'),
    ('r-act3', 'Assignment', 'act-admin', 'rol-consumidor'),
    ('r-rol1', 'Assignment', 'rol-consumidor', 'prc-gestion'),
    ('r-srv1', 'Serving', 'srv-consulta', 'rol-consumidor'),
    ('r-prc0', 'Realization', 'prc-gestion', 'srv-consulta'),
    ('r-cmp1', 'Composition', 'prc-gestion', 'prc-autenticar'),
    ('r-cmp2', 'Composition', 'prc-gestion', 'prc-delimitar'),
    ('r-cmp3', 'Composition', 'prc-gestion', 'prc-consultar'),
    ('r-cmp4', 'Composition', 'prc-gestion', 'prc-decidir'),
    ('r-trg1', 'Triggering', 'prc-autenticar', 'prc-delimitar'),
    ('r-trg2', 'Triggering', 'prc-delimitar', 'prc-consultar'),
    ('r-trg3', 'Triggering', 'prc-consultar', 'prc-decidir'),
    ('r-evt1', 'Triggering', 'evt-corte', 'prc-consultar'),
    ('r-acc1', 'Access', 'prc-autenticar', 'obn-identidad'),
    ('r-acc2', 'Access', 'prc-delimitar', 'obn-jerarquia'),
    ('r-acc3', 'Access', 'prc-consultar', 'obn-indicador'),
    ('r-acc4', 'Access', 'prc-consultar', 'obn-fecha'),
    ('r-fun1', 'Serving', 'srv-consulta', 'fun-cartera'),
    ('r-fun2', 'Serving', 'srv-consulta', 'fun-mora'),
    ('r-fun3', 'Serving', 'srv-consulta', 'fun-incentivos'),

    # Aplicación
    ('r-app1', 'Realization', 'app-mis', 'app-srv'),
    ('r-app2', 'Serving', 'app-srv', 'prc-gestion'),
    ('r-app3', 'Realization', 'app-mis', 'req-standalone'),
    ('r-app4', 'Realization', 'app-mis', 'req-lazy'),
    ('r-app5', 'Realization', 'app-mis', 'req-zoneless'),
    ('r-app6', 'Realization', 'app-mis', 'req-verificacion'),
    ('r-cmp5', 'Composition', 'app-mis', 'app-nucleo'),
    ('r-cmp6', 'Composition', 'app-mis', 'app-winder'),
    ('r-cmp7', 'Composition', 'app-mis', 'app-modulos'),
    ('r-cmp8', 'Composition', 'app-mis', 'app-shared'),

    # Datos · el objeto de datos realiza al objeto de negocio, el artefacto realiza al objeto de datos
    ('r-dat1', 'Realization', 'dat-sesion', 'obn-identidad'),
    ('r-dat2', 'Realization', 'dat-jerarquia', 'obn-jerarquia'),
    ('r-dat3', 'Realization', 'dat-respuesta', 'obn-indicador'),
    ('r-dat4', 'Realization', 'dat-respuesta', 'obn-fecha'),
    ('r-art1', 'Realization', 'art-session', 'dat-sesion'),
    ('r-art2', 'Realization', 'art-session', 'dat-jerarquia'),
    ('r-art3', 'Realization', 'art-session', 'dat-comunicados'),
    ('r-art4', 'Realization', 'art-memoria', 'dat-respuesta'),
    ('r-art5', 'Realization', 'art-local', 'dat-preferencias'),

    # Tecnología
    ('r-tec1', 'Assignment', 'tec-equipo', 'tec-navegador'),
    ('r-tec2', 'Assignment', 'tec-navegador', 'art-ngsw'),
    ('r-tec3', 'Assignment', 'tec-navegador', 'tsrv-almacen'),
    ('r-tec4', 'Assignment', 'tec-web', 'art-bundle'),
    ('r-tec5', 'Assignment', 'tec-web', 'art-chunks'),
    ('r-tec6', 'Realization', 'tec-red', 'tsrv-https'),
    ('r-tec7', 'Assignment', 'tec-ant', 'tsrv-ant'),
    ('r-tec8', 'Serving', 'tec-bd', 'tec-ant'),
    ('r-tec9', 'Realization', 'art-bundle', 'app-mis'),
    ('r-tec10', 'Realization', 'art-chunks', 'app-modulos'),
    ('r-tec11', 'Serving', 'tsrv-https', 'app-winder'),
    ('r-tec12', 'Serving', 'tsrv-almacen', 'app-nucleo'),
    ('r-tec13', 'Serving', 'tsrv-ant', 'app-winder'),
    ('r-tec14', 'Assignment', 'tec-navegador', 'art-bundle'),

    # Implementación
    ('r-wp1', 'Triggering', 'wp-inicio', 'wp-planificacion'),
    ('r-wp2', 'Triggering', 'wp-planificacion', 'wp-ejecucion'),
    ('r-wp3', 'Triggering', 'wp-ejecucion', 'wp-cierre'),
    ('r-wp4', 'Triggering', 'wp-planificacion', 'wp-control'),
    ('r-ent1', 'Realization', 'wp-inicio', 'ent-diagnostico'),
    ('r-ent2', 'Realization', 'wp-planificacion', 'ent-arquitectura'),
    ('r-ent3', 'Realization', 'wp-ejecucion', 'ent-sistema'),
    ('r-ent4', 'Realization', 'wp-cierre', 'ent-informe'),
    ('r-pla1', 'Realization', 'ent-sistema', 'pla-tobe'),
    ('r-pla2', 'Realization', 'ent-informe', 'pla-tobe'),
    ('r-gap1', 'Association', 'pla-asis', 'gap-rendimiento'),
    ('r-gap2', 'Association', 'gap-rendimiento', 'pla-tobe'),
    ('r-mis1', 'Aggregation', 'pla-tobe', 'app-mis'),
]

CARPETA = {
    'Stakeholder': 'motivation', 'Driver': 'motivation', 'Assessment': 'motivation',
    'Goal': 'motivation', 'Outcome': 'motivation', 'Requirement': 'motivation',
    'Constraint': 'motivation', 'Principle': 'motivation',
    'BusinessActor': 'business', 'BusinessRole': 'business', 'BusinessProcess': 'business',
    'BusinessFunction': 'business', 'BusinessService': 'business', 'BusinessObject': 'business',
    'BusinessEvent': 'business',
    'ApplicationComponent': 'application', 'ApplicationService': 'application',
    'DataObject': 'application',
    'Artifact': 'technology', 'Device': 'technology', 'SystemSoftware': 'technology',
    'Node': 'technology', 'CommunicationNetwork': 'technology', 'TechnologyService': 'technology',
    'WorkPackage': 'implementation_migration', 'Deliverable': 'implementation_migration',
    'Plateau': 'implementation_migration', 'Gap': 'implementation_migration',
}

# ── Vistas ────────────────────────────────────────────────────
# Cada vista: (id, nombre, documentación, [cajas], [grupos], [notas])
# caja: (id de elemento, x, y, ancho, alto)
W, H = 210, 66

VISTAS = [
    (
        'vw-motivacion', '01 · La idea del proyecto (motivación)',
        'Por qué existe el proyecto: quién lo pide, qué encontró el diagnóstico, qué objetivos persigue, '
        'con qué requisitos y restricciones, y qué resultados se obtuvieron.',
        [
            ('int-jefatura', 30, 90, W, 58), ('int-comercial', 30, 160, W, 58),
            ('int-usuario', 30, 230, W, 58), ('int-seguridad', 30, 300, W, 58),
            ('drv-rendimiento', 280, 110, W, 62), ('drv-oportunidad', 280, 190, W, 62),
            ('drv-mantenimiento', 280, 270, W, 62),
            ('dia-tiempos', 530, 80, 230, 62), ('dia-monolito', 530, 155, 230, 62),
            ('dia-zonejs', 530, 230, 230, 62), ('dia-pruebas', 530, 305, 230, 62),
            ('obj-tiempos', 800, 110, 230, 70), ('obj-sostener', 800, 200, 230, 62),
            ('obj-continuidad', 800, 280, 230, 62),
            ('req-standalone', 1070, 80, 240, 58), ('req-lazy', 1070, 150, 240, 58),
            ('req-zoneless', 1070, 220, 240, 58), ('req-verificacion', 1070, 290, 240, 58),
            ('res-contratos', 1350, 90, 240, 62), ('res-red', 1350, 165, 240, 62),
            ('pri-verdad', 1350, 250, 240, 58), ('pri-vacio', 1350, 320, 240, 58),
            ('pri-trazable', 1350, 390, 240, 58),
            ('out-paquete', 60, 480, 230, 62), ('out-modulos', 320, 480, 230, 62),
            ('out-ngmodules', 580, 480, 230, 62), ('out-pruebas', 840, 480, 230, 62),
        ],
        [
            ('g-int', 'Interesados', 20, 50, 230, 320, '#dfe6f2'),
            ('g-drv', 'Motivadores', 270, 50, 230, 320, '#dfe6f2'),
            ('g-dia', 'Diagnóstico del sistema actual', 520, 50, 250, 330, '#dfe6f2'),
            ('g-obj', 'Objetivos', 790, 50, 250, 330, '#dfe6f2'),
            ('g-req', 'Requisitos de la solución', 1060, 50, 260, 330, '#dfe6f2'),
            ('g-pri', 'Restricciones y principios', 1340, 50, 260, 410, '#dfe6f2'),
            ('g-out', 'Resultados obtenidos', 50, 440, 1030, 125, '#e3efe0'),
        ],
        [
            ('n-mot', 30, 600, 1050, 70,
             'El proyecto no interviene la red ni el backend. Optimiza el tiempo que la aplicación añade '
             'a la espera del servidor: descarga, análisis y ejecución de JavaScript, detección de cambios y renderizado.'),
        ],
    ),
    (
        'vw-negocio', '02 · Capa de negocio',
        'Quién consulta la información, con qué proceso, apoyado en qué servicio y sobre qué objetos de negocio.',
        [
            ('act-asesor', 40, 60, W, 58), ('act-supervisor', 270, 60, W, 58), ('act-admin', 500, 60, W, 58),
            ('rol-consumidor', 270, 160, W, 58),
            ('srv-consulta', 170, 260, 410, 62),
            ('prc-gestion', 40, 360, 670, 58),
            ('prc-autenticar', 40, 450, 230, 66), ('prc-delimitar', 290, 450, 230, 66),
            ('prc-consultar', 540, 450, 230, 66), ('prc-decidir', 790, 450, 230, 66),
            ('evt-corte', 790, 360, 230, 58),
            ('obn-identidad', 40, 570, 230, 58), ('obn-jerarquia', 290, 570, 230, 58),
            ('obn-indicador', 540, 570, 230, 58), ('obn-fecha', 790, 570, 230, 58),
            ('fun-cartera', 1070, 260, 230, 58), ('fun-mora', 1070, 330, 230, 58),
            ('fun-incentivos', 1070, 400, 230, 58),
        ],
        [
            ('g-fun', 'Funciones de negocio que el MIS sostiene', 1060, 220, 250, 250, '#fdf3d4'),
        ],
        [
            ('n-neg', 40, 660, 980, 60,
             'Las tres coordenadas de una cifra —qué reporte, de qué nodo de la jerarquía y de qué fecha de corte— '
             'quedan fijadas en los dos primeros pasos del proceso. Sin las tres, la cifra es plausible y equivocada.'),
        ],
    ),
    (
        'vw-datos', '03 · Capa de datos · realización del dato',
        'ArchiMate no tiene una capa de datos: el dato se modela como objeto de datos en la capa de aplicación '
        'y como artefacto en la de tecnología. Esta vista muestra esa cadena de realización de abajo hacia arriba, '
        'y con ella dónde reside realmente cada cosa y cuánto dura.',
        [
            ('obn-identidad', 40, 70, 230, 58), ('obn-jerarquia', 290, 70, 230, 58),
            ('obn-indicador', 540, 70, 230, 58), ('obn-fecha', 790, 70, 230, 58),
            ('dat-sesion', 40, 230, 230, 58), ('dat-jerarquia', 290, 230, 230, 58),
            ('dat-respuesta', 540, 230, 480, 58),
            ('dat-preferencias', 1070, 230, 230, 58), ('dat-comunicados', 1070, 310, 230, 58),
            ('art-session', 40, 400, 480, 58), ('art-memoria', 540, 400, 480, 58),
            ('art-local', 1070, 400, 230, 58),
        ],
        [
            ('g-obn', 'Objetos de negocio · lo que el negocio reconoce', 30, 50, 1010, 90, '#fdf3d4'),
            ('g-dat', 'Objetos de datos · capa de aplicación', 30, 210, 1290, 160, '#d6f2f2'),
            ('g-art', 'Artefactos · capa de tecnología', 30, 380, 1290, 100, '#dcefd0'),
        ],
        [
            ('n-dat', 30, 510, 1290, 78,
             'Ninguna cifra de negocio se persiste en el cliente: la respuesta de reporte vive en memoria y se pierde '
             'al recargar, lo que obliga a volver a pedirla con su fecha de corte. Lo único permanente es la preferencia '
             'de interfaz, que no tiene valor de negocio. El service worker cachea el esqueleto de la aplicación y '
             'ninguna respuesta: ngsw-config.json no declara dataGroups.'),
        ],
    ),
    (
        'vw-soporte', '04 · Capa de aplicación · cómo el MIS sostiene al negocio',
        'El puente entre el proceso de negocio y la aplicación: qué servicio lo sirve, qué componente lo realiza '
        'y qué requisitos del proyecto materializa ese componente.',
        [
            ('prc-gestion', 300, 60, 420, 62),
            ('srv-consulta', 300, 160, 420, 58),
            ('app-srv', 300, 260, 420, 58),
            ('app-mis', 300, 370, 420, 70),
            ('req-standalone', 810, 350, 240, 58), ('req-lazy', 810, 420, 240, 58),
            ('req-zoneless', 810, 490, 240, 58), ('req-verificacion', 810, 560, 240, 58),
            ('res-contratos', 30, 260, 240, 62),
            ('rol-consumidor', 30, 60, 240, 62),
        ],
        [],
        [
            ('n-sop', 30, 660, 1020, 60,
             'La reingeniería alcanza únicamente a la capa de presentación: el backend, sus contratos y el cálculo '
             'de los indicadores permanecen sin modificación durante todo el proyecto.'),
        ],
    ),
    (
        'vw-tecnologia', '05 · Capa de tecnología',
        'Sobre qué se ejecuta el MIS: el equipo del usuario y su navegador, la red corporativa y el centro de datos '
        'con el servidor de contenido y el backend Ant. A la derecha, los componentes de aplicación que esa '
        'infraestructura sostiene.',
        [
            ('tec-equipo', 40, 80, 260, 58),
            ('tec-navegador', 40, 160, 260, 62),
            ('art-ngsw', 40, 250, 260, 58),
            ('tsrv-almacen', 40, 330, 260, 58),
            ('tec-red', 370, 160, 240, 62),
            ('tsrv-https', 370, 250, 240, 58),
            ('tec-web', 680, 80, 260, 58),
            ('art-bundle', 680, 160, 260, 58),
            ('art-chunks', 680, 230, 260, 58),
            ('tec-ant', 680, 330, 260, 62),
            ('tsrv-ant', 680, 410, 260, 58),
            ('tec-bd', 680, 490, 260, 58),
            ('app-mis', 1010, 80, 250, 58),
            ('app-nucleo', 1010, 160, 250, 58),
            ('app-modulos', 1010, 240, 250, 58),
            ('app-winder', 1010, 330, 250, 58),
            ('app-shared', 1010, 410, 250, 58),
        ],
        [
            ('g-cli', 'Cliente', 30, 50, 280, 340, '#dcefd0'),
            ('g-red', 'Red corporativa', 360, 50, 260, 340, '#dcefd0'),
            ('g-srv', 'Centro de datos', 670, 50, 280, 500, '#dcefd0'),
            ('g-apl', 'Componentes de aplicación sostenidos', 1000, 50, 270, 420, '#d6f2f2'),
        ],
        [
            ('n-tec', 30, 580, 1240, 78,
             'El proyecto no interviene ninguno de estos nodos: ni la red, ni el backend Ant, ni la base de datos. '
             'Actúa solo sobre lo que se ejecuta dentro del navegador —cuánto código se descarga, cuándo y cuánto '
             'trabajo cuesta renderizarlo—, y por eso la restricción "no se interviene la infraestructura de red" '
             'delimita desde el inicio qué parte de la espera es optimizable.'),
        ],
    ),
    (
        'vw-integrada', '06 · Vista integrada en capas',
        'Las cinco capas apiladas y una traza completa que las cruza: el paquete inicial realiza el componente, '
        'el componente realiza el servicio de aplicación, el servicio sirve al proceso de negocio y el proceso '
        'realiza el servicio que consume el rol. En paralelo, la carga diferida realiza el objetivo de reducir tiempos.',
        [
            ('drv-rendimiento', 60, 75, 250, 58), ('obj-tiempos', 340, 75, 250, 58), ('req-lazy', 620, 75, 250, 58),
            ('rol-consumidor', 60, 195, 250, 58), ('srv-consulta', 340, 195, 250, 58),
            ('prc-gestion', 620, 195, 250, 58), ('obn-indicador', 900, 195, 250, 58),
            ('app-srv', 60, 325, 250, 58), ('app-mis', 340, 325, 250, 58),
            ('app-nucleo', 620, 325, 190, 58), ('app-winder', 830, 325, 190, 58),
            ('dat-respuesta', 1040, 325, 190, 58),
            ('art-bundle', 60, 455, 250, 58), ('tec-navegador', 340, 455, 250, 58),
            ('tsrv-https', 620, 455, 250, 58), ('tsrv-ant', 900, 455, 250, 58),
            ('pla-asis', 60, 580, 250, 58), ('gap-rendimiento', 340, 580, 250, 58), ('pla-tobe', 620, 580, 250, 58),
        ],
        [
            ('g-b1', 'Motivación', 30, 50, 1240, 100, '#dfe6f2'),
            ('g-b2', 'Negocio', 30, 170, 1240, 110, '#fdf3d4'),
            ('g-b3', 'Aplicación', 30, 300, 1240, 110, '#d6f2f2'),
            ('g-b4', 'Tecnología', 30, 430, 1240, 110, '#dcefd0'),
            ('g-b5', 'Implementación y migración', 30, 560, 1240, 100, '#f6e0e0'),
        ],
        [
            ('n-int', 30, 690, 1240, 60,
             'Se lee de abajo hacia arriba: cada capa realiza o sirve a la de encima. Una decisión técnica solo se '
             'justifica si esa cadena llega hasta un objetivo de la capa de motivación.'),
        ],
    ),
    (
        'vw-proyecto', '07 · Hoja de ruta del proyecto',
        'De la situación actual a la situación objetivo: paquetes de trabajo, entregables e indicadores de éxito.',
        [
            ('pla-asis', 40, 70, 260, 70),
            ('gap-rendimiento', 400, 70, 260, 70),
            ('pla-tobe', 760, 70, 260, 70),
            ('wp-inicio', 40, 230, 200, 66), ('wp-planificacion', 260, 230, 200, 66),
            ('wp-ejecucion', 480, 230, 200, 66), ('wp-control', 260, 330, 200, 66),
            ('wp-cierre', 700, 230, 200, 66),
            ('ent-diagnostico', 40, 450, 200, 66), ('ent-arquitectura', 260, 450, 200, 66),
            ('ent-sistema', 480, 450, 200, 66), ('ent-informe', 700, 450, 200, 66),
            ('app-mis', 960, 230, 220, 66),
        ],
        [
            ('g-wp', 'Paquetes de trabajo · 243 días', 30, 190, 890, 230, '#f6e0e0'),
            ('g-ent', 'Entregables · indicadores de éxito', 30, 430, 890, 110, '#f6e0e0'),
        ],
        [
            ('n-pro', 30, 570, 1150, 60,
             'Presupuesto total S/ 213 884,44 con 10 % de reserva de contingencia. El monitoreo y control corre en '
             'paralelo con la ejecución, no como fase posterior: solo tiene sentido mientras hay código entrando.'),
        ],
    ),
]


def sangrar(elem, nivel=0):
    """Indentación legible: el archivo se versiona y se revisa en diff."""
    espacio = '\n' + '  ' * nivel
    if len(elem):
        if not (elem.text or '').strip():
            elem.text = espacio + '  '
        for hijo in elem:
            sangrar(hijo, nivel + 1)
        if not (hijo.tail or '').strip():
            hijo.tail = espacio
    if nivel and not (elem.tail or '').strip():
        elem.tail = espacio


def construir():
    ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')
    ET.register_namespace('archimate', 'http://www.archimatetool.com/archimate')
    XSI = '{http://www.w3.org/2001/XMLSchema-instance}type'

    modelo = ET.Element(
        '{http://www.archimatetool.com/archimate}model',
        {'name': 'MIS Host · idea del proyecto y arquitectura de negocio',
         'id': 'id-modelo-mis', 'version': '4.9.0'},
    )
    ET.SubElement(modelo, 'purpose').text = (
        'Modelo de arquitectura empresarial del proyecto de reingeniería del Sistema de Información Gerencial '
        '(MIS) de una entidad microfinanciera. El alcance de este modelo es la idea del proyecto y el negocio '
        'al que sirve: por qué se hace, para quién, con qué objetivos y restricciones, y con qué hoja de ruta.'
    )

    carpetas = {}
    for nombre, tipo in [('Strategy', 'strategy'), ('Business', 'business'), ('Application', 'application'),
                         ('Technology & Physical', 'technology'), ('Motivation', 'motivation'),
                         ('Implementation & Migration', 'implementation_migration'), ('Other', 'other'),
                         ('Relations', 'relations'), ('Views', 'diagrams')]:
        carpetas[tipo] = ET.SubElement(modelo, 'folder', {'name': nombre, 'id': f'id-folder-{tipo}', 'type': tipo})

    for eid, tipo, nombre, doc in ELEMENTOS:
        destino = carpetas[CARPETA[tipo]]
        el = ET.SubElement(destino, 'element', {XSI: f'archimate:{tipo}', 'name': nombre, 'id': eid})
        if doc:
            ET.SubElement(el, 'documentation').text = doc

    for rid, tipo, origen, destino in RELACIONES:
        attrs = {XSI: f'archimate:{tipo}Relationship', 'id': rid, 'source': origen, 'target': destino}
        if tipo == 'Access':
            attrs['accessType'] = '1'      # lectura
        ET.SubElement(carpetas['relations'], 'element', attrs)

    rel_por_par = {(o, d): (rid, t) for rid, t, o, d in RELACIONES}

    for vid, nombre, doc, cajas, grupos, notas in VISTAS:
        vista = ET.SubElement(carpetas['diagrams'], 'element',
                              {XSI: 'archimate:ArchimateDiagramModel', 'name': nombre, 'id': vid})
        ET.SubElement(vista, 'documentation').text = doc

        for gid, gnombre, x, y, w, h, color in grupos:
            g = ET.SubElement(vista, 'child', {XSI: 'archimate:Group', 'id': f'{vid}-{gid}',
                                               'name': gnombre, 'fillColor': color})
            ET.SubElement(g, 'bounds', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h)})

        objeto_de = {}
        nodos = {}
        for eid, x, y, w, h in cajas:
            oid = f'{vid}-o-{eid}'
            objeto_de[eid] = oid
            nodos[eid] = ET.SubElement(vista, 'child', {XSI: 'archimate:DiagramObject', 'id': oid,
                                                        'archimateElement': eid})
            ET.SubElement(nodos[eid], 'bounds', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h)})

        entrantes = {}
        for (origen, destino), (rid, _tipo) in rel_por_par.items():
            if origen in objeto_de and destino in objeto_de:
                cid = f'{vid}-c-{rid}'
                ET.SubElement(nodos[origen], 'sourceConnection',
                              {XSI: 'archimate:Connection', 'id': cid,
                               'source': objeto_de[origen], 'target': objeto_de[destino],
                               'archimateRelationship': rid})
                entrantes.setdefault(destino, []).append(cid)

        for destino, ids in entrantes.items():
            nodos[destino].set('targetConnections', ' '.join(ids))

        for nid, x, y, w, h, texto in notas:
            n = ET.SubElement(vista, 'child', {XSI: 'archimate:Note', 'id': f'{vid}-{nid}',
                                               'textAlignment': '1', 'fillColor': '#ffffff'})
            ET.SubElement(n, 'bounds', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h)})
            ET.SubElement(n, 'content').text = texto

    return modelo


def validar(modelo):
    """Integridad referencial: un id suelto abre la vista vacía sin avisar."""
    XSI = '{http://www.w3.org/2001/XMLSchema-instance}type'
    ids = {e.get('id') for e in modelo.iter('element')}
    problemas = []

    for e in modelo.iter('element'):
        for attr in ('source', 'target'):
            ref = e.get(attr)
            if ref and ref not in ids:
                problemas.append(f'relación {e.get("id")}: {attr} inexistente ({ref})')

    for hijo in modelo.iter('child'):
        ref = hijo.get('archimateElement')
        if ref and ref not in ids:
            problemas.append(f'objeto {hijo.get("id")}: elemento inexistente ({ref})')

    objetos = {c.get('id') for c in modelo.iter('child')}
    for con in modelo.iter('sourceConnection'):
        for attr in ('source', 'target'):
            if con.get(attr) not in objetos:
                problemas.append(f'conexión {con.get("id")}: {attr} no es un objeto de la vista')
        if con.get('archimateRelationship') not in ids:
            problemas.append(f'conexión {con.get("id")}: relación inexistente')

    duplicados = len(list(modelo.iter('element'))) - len(ids)
    if duplicados:
        problemas.append(f'{duplicados} identificador(es) duplicado(s)')

    return problemas


modelo = construir()
errores = validar(modelo)
if errores:
    for e in errores:
        print('ERROR:', e)
    raise SystemExit(1)

sangrar(modelo)
xml = ET.tostring(modelo, encoding='unicode')
io.open(DESTINO, 'w', encoding='utf-8', newline='\n').write('<?xml version="1.0" encoding="UTF-8"?>\n' + xml + '\n')

print(f'OK  {DESTINO}')
print(f'  {len(ELEMENTOS)} elementos · {len(RELACIONES)} relaciones · {len(VISTAS)} vistas')
for vid, nombre, *_ in VISTAS:
    print(f'    {nombre}')
