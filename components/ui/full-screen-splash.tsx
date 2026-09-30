'use client'



import React, { useState, useEffect, useRef } from 'react'

import { LiverpoolLogo } from '@/components/liverpool-logo'

import { SquareSpinner } from '@/components/ui/square-spinner'



export const SPLASH_PHRASES = [

  "Estoy analizando miles de celdas a la velocidad de la luz...",

"Estoy aplicando magia algorítmica a los datos de hoy...",

"Estoy conectando los cables virtuales del Master Hub...",

"Estoy sincronizando la nube corporativa...",

"Estoy despertando a los algoritmos de análisis...",

"Estoy procesando el ADN de los datos comerciales...",

"Estoy traduciendo el lenguaje de Google Sheets a gráficas de alto nivel...",

"Estoy afinando el motor de renderizado de Recharts...",

"Estoy calculando variables a velocidad turbo...",

"Estoy extrayendo inteligencia de las bases de datos...",

"Estoy optimizando los nodos de información...",

"Estoy compilando la realidad operativa en milisegundos...",

"Estoy activando los protocolos de visualización...",

"Estoy filtrando el ruido para encontrar los insights...",

"Estoy iniciando la secuencia de zipping de datos...",

"Estoy ensamblando los micro-charts de rendimiento...",

"Estoy transformando datos brutos en inteligencia de negocios...",

"Estoy calibrando los sensores de métricas...",

"Estoy conectando con el servidor central de operaciones...",

"Estoy ejecutando la limpieza de datos en segundo plano...",

"Estoy poniéndole la corbata a los reportes de rendimiento...",

"Estoy calculando metas y desviaciones operativas...",

"Estoy preparando el resumen ejecutivo para la dirección...",

"Estoy cuadrando los números para que todo coincida...",

"Estoy alineando los KPIs del trimestre...",

"Estoy preparando el tablero de control principal...",

"Estoy destilando la estrategia comercial en gráficas...",

"Estoy revisando el índice de efectividad anual...",

"Estoy consolidando el volumen de originación...",

"Estoy calculando la mezcla del portafolio financiero...",

"Estoy proyectando el plan contra el cumplimiento real...",

"Estoy generando el estado del arte de las ventas...",

"Estoy estructurando el análisis mensual...",

"Estoy auditando los resultados del equipo...",

"Estoy preparando la vista de helicóptero para los directivos...",

"Estoy calculando el rendimiento acumulado...",

"Estoy cruzando la información de los diferentes canales...",

"Estoy validando la distribución estratégica...",

"Estoy acomodando el ranking de productividad...",

"Estoy midiendo el pulso comercial del día...",

"Estoy despertando a los servidores y preparándoles un café...",

"Estoy buscando la aguja de los KPIs en el pajar de Google Sheets...",

"Estoy convenciendo a los números de que se porten bien...",

"Estoy haciendo que los datos confiesen la verdad...",

"Estoy buscando la celda ZZZ999...",

"Estoy planchando las gráficas para que no tengan arrugas...",

"Estoy alimentando a los hamsters que le dan energía al servidor...",

"Estoy pidiéndole amablemente a Google Sheets que colabore...",

"Estoy contando con los dedos... casi termino...",

"Estoy acomodando los ceros y los unos en su lugar...",

"Estoy buscando el cable que alguien desconectó...",

"Estoy traducir hojas de cálculo es mi pasión...",

"Estoy asegurando que el 2+2 siga siendo 4...",

"Estoy estirando las barras de progreso...",

"Estoy soplándole al servidor para que no se caliente...",

"Estoy peinando los datos para que salgan bien en la foto...",

"Estoy negociando con la base de datos...",

"Estoy tomando un respiro antes de mostrar estos números...",

"Estoy magia en progreso, por favor espere...",

"Estoy escondiendo las celdas vacías debajo de la alfombra...",

"Estoy alineando los píxeles corporativos...",

"Estoy sacándole brillo a los colores del semáforo...",

"Estoy trazando las líneas láser a 5 píxeles de grosor...",

"Estoy aplicando el estilo 'Corporate Flat' al dashboard...",

"Estoy calculando las curvas de animación de Recharts...",

"Estoy centrando los iconos milimétricamente...",

"Estoy preparando los tooltips interactivos...",

"Estoy ajustando el radio de las gráficas de radar...",

"Estoy puliendo las tarjetas de los indicadores...",

"Estoy renderizando el lienzo de datos...",

"Estoy inyectando suavidad a las animaciones...",

"Estoy verificando el contraste de los textos...",

"Estoy aplicando sombras nulas para un look más limpio...",

"Estoy cargando la paleta de colores institucional...",

"Estoy dibujando barras de progreso matemáticamente perfectas...",

"Estoy asegurando que ningún nombre largo se recorte...",

"Estoy construyendo la interfaz bloque a bloque...",

"Estoy sincronizando las micro-interacciones...",

"Estoy desplegando el diseño responsivo...",

"Estoy limpiando la interfaz para tu comodidad...",

"Estoy calculando el Top 3 de los mejores Jefes de Ventas...",

"Estoy mapeando el rendimiento de los Asesores de Crédito...",

"Estoy enfrentando a Promotores vs Asesores en la gráfica...",

"Estoy traducir nombres raros a nombres elegantes en proceso...",

"Estoy analizando el desempeño por departamento...",

"Estoy consolidando la sección operativa...",

"Estoy midiendo la efectividad de cada promotor...",

"Estoy descargando las cuotas de originación...",

"Estoy revisando quién llegó a la meta este mes...",

"Estoy filtrando el ruido para ver a los verdaderos líderes...",

"Estoy actualizando el ranking comercial...",

"Estoy verificando la participación por canal comercial...",

"Estoy calculando quién se lleva la medalla de oro hoy...",

"Estoy cruzando los datos de ventas cruzadas...",

"Estoy evaluando el desempeño en el piso de ventas...",

"Estoy conectando con el Master Hub de los Jefes...",

"Estoy acomodando el portafolio financiero...",

"Estoy extrayendo el valor real de los asesores...",

"Estoy evaluando la eficiencia operativa por sector...",

"Estoy casi listo... preparando tu Inteligencia de Negocios...",

]



export const SPLASH_PHRASES_LOGOUT = [

  "Estoy guardando los resultados en la bóveda de datos...",

"Estoy apagando los algoritmos de análisis...",

"Estoy desconectando la nube corporativa...",

"Estoy durmiendo a los motores de renderizado...",

"Estoy cerrando los canales de streaming de datos...",

"Estoy enfriando los núcleos de procesamiento...",

"Estoy archivando la sesión en el historial seguro...",

"Estoy desactivando los protocolos de visualización...",

"Estoy plegando las gráficas en su estado de reposo...",

"Estoy liberando la memoria de los cálculos...",

"Estoy cerrando la conexión con el servidor central...",

"Estoy bloqueando los accesos de esta sesión...",

"Estoy encriptando los últimos movimientos del usuario...",

"Estoy apilando los datos en los anaqueles digitales...",

"Estoy devolviendo los números a su celda original...",

"Estoy rebobinando la cinta de los KPIs...",

"Estoy cerrando el libro de operaciones del día...",

"Estoy poniendo en standby los sensores de métricas...",

"Estoy silenciando las notificaciones del sistema...",

"Estoy cerrando el telón de la inteligencia de negocios...",

"Estoy cerrando el tablero de control principal...",

"Estoy archivando el resumen ejecutivo de hoy...",

"Estoy guardando los KPIs del trimestre en la bóveda...",

"Estoy cerrando el reporte de rendimiento...",

"Estoy devolviendo los números a su estado base...",

"Estoy finalizando la auditoría de resultados...",

"Estoy cerrando la vista de helicóptero directivo...",

"Estoy apagando los monitores de estrategia comercial...",

"Estoy cerrando el análisis mensual...",

"Estoy guardando el estado del arte de las ventas...",

"Estoy cerrando la sesión de inteligencia de negocios...",

"Estoy archivando las métricas de productividad...",

"Estoy cerrando el ranking comercial...",

"Estoy finalizando la consolidación de canales...",

"Estoy cerrando el monitoreo del pulso comercial...",

"Estoy guardando los resultados en el historial...",

"Estoy cerrando la sesión de seguimiento operativo...",

"Estoy finalizando la revisión de desviaciones...",

"Estoy cerrando el dashboard de la dirección...",

"Estoy apagando los radares de rendimiento...",

"Estoy mandando a los hamsters del servidor a dormir...",

"Estoy apagando la cafetera de los datos...",

"Estoy guardando los números en la caja fuerte...",

"Estoy desconectando el Excel de la corriente...",

"Estoy cerrando la pestaña maestra...",

"Estoy despidiendo a los píxeles de la pantalla...",

"Estoy apagando las luces del servidor...",

"Estoy cerrando el chiringuito de las gráficas...",

"Estoy dejando descansar a los algoritmos...",

"Estoy guardando los ceros y los unos en su cajita...",

"Estoy cerrando el circo de los datos...",

"Estoy apagando el proyector de KPIs...",

"Estoy cerrando el show de las métricas...",

"Estoy despidiendo a los promotores virtuales...",

"Estoy cerrando el expediente del día...",

"Estoy apagando el motor de los reportes...",

"Estoy guardando los secretos comerciales bajo llave...",

"Estoy cerrando la tienda de los números...",

"Estoy apagando la fiesta de las gráficas...",

"Estoy cerrando el telón del dashboard...",

"Estoy desmontando la interfaz bloque a bloque...",

"Estoy apagando los píxeles corporativos...",

"Estoy guardando la paleta de colores institucional...",

"Estoy desactivando las animaciones de Recharts...",

"Estoy cerrando el lienzo de datos...",

"Estoy apagando los tooltips interactivos...",

"Estoy desmontando las gráficas de radar...",

"Estoy cerrando las tarjetas de indicadores...",

"Estoy apagando las micro-interacciones...",

"Estoy cerrando el diseño responsivo...",

"Estoy guardando los estilos 'Corporate Flat'...",

"Estoy apagando las curvas de animación...",

"Estoy cerrando la sesión de perfeccionismo UI...",

"Estoy desmontando los iconos milimétricos...",

"Estoy apagando las sombras nulas...",

"Estoy cerrando la galería de gráficas...",

"Estoy guardando los textos centrados...",

"Estoy apagando el brillo de los colores del semáforo...",

"Estoy cerrando la exposición de datos...",

"Estoy apagando el renderizado de alto nivel...",

"Estoy cerrando el Top 3 de Jefes de Ventas...",

"Estoy apagando el mapeo de asesores de crédito...",

"Estoy cerrando el enfrentamiento Promotores vs Asesores...",

"Estoy guardando el desempeño por departamento...",

"Estoy apagando la sección operativa...",

"Estoy cerrando la medición de efectividad por promotor...",

"Estoy guardando las cuotas de originación...",

"Estoy apagando el ranking comercial...",

"Estoy cerrando la participación por canal...",

"Estoy guardando la medalla de oro del día...",

"Estoy apagando las ventas cruzadas...",

"Estoy cerrando el piso de ventas virtual...",

"Estoy desconectando el Master Hub de los Jefes...",

"Estoy guardando el portafolio financiero...",

"Estoy apagando la eficiencia operativa por sector...",

"Estoy cerrando la sesión de inteligencia de negocios...",

"Estoy guardando los resultados en la nube segura...",

"Estoy apagando los sensores de productividad...",

"Estoy cerrando el ciclo operativo del día...",

"Estoy hasta pronto... tu Inteligencia de Negocios te espera...",

]



function shufflePhrases(phraseList: string[], previous?: string): string[] {

  const shuffled = [...phraseList]

  for (let i = shuffled.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1))

    const current = shuffled[i]

    shuffled[i] = shuffled[j]

    shuffled[j] = current

  }

  if (previous && shuffled.length > 1 && shuffled[0] === previous) {

    const first = shuffled[0]

    shuffled[0] = shuffled[1]

    shuffled[1] = first

  }

  return shuffled

}



export type SplashMode = 'login' | 'logout'



interface FullScreenSplashProps {

  userName?: string

  ready: boolean

  mode?: SplashMode

  onComplete?: () => void

}



function formatDisplayName(value?: string): string {

  if (!value?.trim()) return "Usuario"



    return value

    .trim()

    .toLocaleLowerCase('es-MX')

    .split(/\s+/)

    .map(part =>

    part ? part.charAt(0).toLocaleUpperCase('es-MX') + part.slice(1) : part

    )

    .join(' ')

}



export function FullScreenSplash({ userName, ready, mode = 'login', onComplete }: FullScreenSplashProps) {

  const [sequence, setSequence] = useState<{ phrases: string[]; index: number }>({ phrases: [], index: 0 })

  const completed = useRef(false)



  useEffect(() => {

    const list = mode === 'logout' ? SPLASH_PHRASES_LOGOUT : SPLASH_PHRASES

    setSequence({ phrases: shufflePhrases(list), index: 0 })

  }, [mode])



  useEffect(() => {

    if (ready || sequence.phrases.length === 0) return

    // Solo cambia el texto. El tiempo de lectura no controla la salida del splash.

    const timer = window.setTimeout(() => {

      setSequence(prev => prev.index + 1 < prev.phrases.length

        ? { ...prev, index: prev.index + 1 }

        : { phrases: shufflePhrases(mode === 'logout' ? SPLASH_PHRASES_LOGOUT : SPLASH_PHRASES, prev.phrases[prev.index]), index: 0 })

    }, 1800)

    return () => window.clearTimeout(timer)

  }, [ready, mode, sequence.index, sequence.phrases.length])



  useEffect(() => {

    if (ready && !completed.current) {

      completed.current = true

      onComplete?.()

    }

  }, [ready, onComplete])



  if (ready) return null



    const displayName = formatDisplayName(userName)

    const phrasesList = mode === 'logout' ? SPLASH_PHRASES_LOGOUT : SPLASH_PHRASES

    const currentPhrase = sequence.phrases[sequence.index] || phrasesList[0]

    const greeting = mode === 'logout' ? `Hasta pronto, ${displayName}.` : `Hola, ${displayName}.`



    return (

      <div

      className="fixed inset-0 z-50 min-h-screen w-full overflow-hidden select-none"

      style={{ backgroundColor: "#833177" }}

      >

      <div className="absolute inset-0 flex items-center justify-center px-4">

      <div className="flex flex-col items-center text-center gap-6 -translate-y-4">

      <LiverpoolLogo className="w-44 h-auto text-white shrink-0" />



      <SquareSpinner

        className="h-8 w-8 text-white"

        label={mode === 'logout' ? 'Cerrando sesión' : 'Cargando dashboard'}

      />

      </div>

      </div>



      <div className="absolute inset-x-4 bottom-10 sm:bottom-12 flex justify-center">

      <p className="w-full max-w-2xl text-[10px] leading-[12.5px] tracking-[-0.01em] text-white font-normal text-center transition-all duration-300">

      <span className="font-normal text-white">{greeting}</span>

      <span className="ml-[2px] text-white/90">{currentPhrase}</span>

      </p>

      </div>

      </div>

    )

}
