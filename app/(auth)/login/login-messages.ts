const ERROR_OPENERS = [
  'Ups, aquí algo no coincidió.',
  'Mmm, esos datos no me cuadraron.',
  'Casi, pero todavía no pude abrirte la puerta.',
  'Creo que una credencial se nos fue de paseo.',
  'Me falta una coincidencia para dejarte pasar.',
  'Ese intento se quedó cerquita, pero no entró.',
  'Tengo una pequeña duda con esas credenciales.',
  'Parece que algo se escribió distinto esta vez.',
  'Todavía no logro reconocerte con esos datos.',
  'La puerta hizo clic, pero no terminó de abrir.',
  'Ese correo y contraseña no me dieron luz verde.',
  'Hoy esas credenciales vienen un poquito rebeldes.',
  'Tengo todo listo, pero esos datos no hicieron match.',
  'Algo pequeñito está frenando el acceso.',
  'No me convence del todo esa combinación todavía.',
  'Me parece que una tecla nos jugó una broma.',
  'Ese intento no pasó mi revisión de entrada.',
  'Estoy intentando ayudarte, pero esos datos no coinciden.',
  'La entrada sigue cerrada por un detallito.',
  'Parece que las credenciales necesitan otra mirada.',
] as const

const ERROR_HINTS = [
  'Revísalas con calma y probamos otra vez.',
  'Comprueba correo y contraseña y volvemos a intentarlo.',
  'Dales una mirada rápida; aquí me quedo esperándote.',
  'Verifica que no haya espacios o caracteres de más.',
  'Corrige lo que haga falta y hacemos otro intento.',
] as const

const SUCCESS_OPENERS = [
  '¡Listo, te reconocí!',
  '¡Perfecto, todo coincide!',
  '¡Ahora sí, puerta abierta!',
  '¡Credenciales confirmadas!',
  '¡Excelente, acceso aprobado!',
  '¡Todo en orden por aquí!',
  '¡Bienvenido, ya te tengo ubicado!',
  '¡Acceso correcto, misión cumplida!',
  '¡Luz verde, puedes continuar!',
  '¡Qué gusto verte, acceso confirmado!',
  '¡Todo cuadró a la primera!',
  '¡Validación completa y sin dramas!',
  '¡Hecho, tus datos están correctos!',
  '¡Entrada autorizada!',
  '¡El portal ya sabe que eres tú!',
  '¡Excelente combinación, acceso concedido!',
  '¡Perfecto, la llave digital funcionó!',
  '¡Todo coincide como debe!',
  '¡Acceso validado con éxito!',
  '¡Ya está, te abro el camino!',
] as const

const SUCCESS_ENDINGS = [
  'Estoy preparando tu portal.',
  'Enseguida te llevo a tus módulos.',
  'Todo está listo para continuar.',
  'Voy abriendo tu espacio de trabajo.',
  'Nos vemos del otro lado.',
] as const

export const LOGIN_ERROR_MESSAGES = ERROR_OPENERS.flatMap((opener) =>
  ERROR_HINTS.map((hint) => `${opener} ${hint}`),
)

export const LOGIN_SUCCESS_MESSAGES = SUCCESS_OPENERS.flatMap((opener) =>
  SUCCESS_ENDINGS.map((ending) => `${opener} ${ending}`),
)

export function pickLoginMessage(messages: readonly string[], previous = '') {
  const available = messages.length > 1 ? messages.filter((message) => message !== previous) : messages
  return available[Math.floor(Math.random() * available.length)] ?? ''
}
