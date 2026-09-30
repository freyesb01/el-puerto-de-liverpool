import { formatPersonName } from './utils';

/**
 * Única fuente de verdad para identidad y presentación de jefes.
 * Las llaves son aliases observados en Sheets; los valores son el nombre canónico.
 */
export const MANAGER_DISPLAY_NAMES: Record<string, string> = {
  'ABIGAIL CORTEZ': 'Abigail Cortez',

  'AISHA MELENDEZ': 'Zeltzin Aisha Meléndez Bolaños',
  'MELENDEZ BOLANOS ZELTZIN AISHA': 'Zeltzin Aisha Meléndez Bolaños',
  'MELENDEZ BOLAÑOS ZELTZIN AISHA': 'Zeltzin Aisha Meléndez Bolaños',

  'JOSE ARTURO VELOZ': 'José Arturo Veloz Alcántar',
  'VELOZ ALCANTAR JOSE ARTURO': 'José Arturo Veloz Alcántar',

  'CARLOS GUILLEN': 'Carlos Guillén',
  'GUILLEN VILLALOBOS CARLOS': 'Carlos Guillén',
  'GUILLEN VILLLOBOS CARLOS': 'Carlos Guillén',

  'ARGELIA GUTIERREZ': 'Argelia Alicia Gutiérrez',
  'GUTIERREZ GONZALEZ ARGELIA ALICIA': 'Argelia Alicia Gutiérrez',

  'BRENDA EDITH GOMEZ': 'Brenda Edith Gómez García',
  'GOMEZ GARCIA BRENDA EDITH': 'Brenda Edith Gómez García',

  'MIGUEL ANGEL NARANJO': 'Miguel Ángel Naranjo Escorza',
  'MIGUEL ANGEL NARANJO ESCORZA': 'Miguel Ángel Naranjo Escorza',

  'CAROLINA BOJORQUEZ': 'Carolina Zurisadai Bojorges Vázquez',
  'CAROLINA BOJORGES': 'Carolina Zurisadai Bojorges Vázquez',
  'BOJORGES VAZQUEZ CAROLINA ZURISADAI': 'Carolina Zurisadai Bojorges Vázquez',

  'HORACIO ARTURO FIESCO': 'Horacio Arturo Fiesco Espinosa',
  'FIESCO ESPINOZA HORACIO ARTURO': 'Horacio Arturo Fiesco Espinosa',
  'FIESCO ESPINOSA HORACIO ARTURO': 'Horacio Arturo Fiesco Espinosa',

  'MINERVA SOTELO': 'Minerva Sotelo',

  'EMMANUEL CONTRERAS': 'Emmanuel Contreras Garnica',
  'CONTRERAS GARNICA EMMANUEL': 'Emmanuel Contreras Garnica',

  'JANET PEREZ GOPAR': 'Janneth Pérez Gopar',
  'JANNET PEREZ GOPAR': 'Janneth Pérez Gopar',
  'JANNETH PEREZ GOPAR': 'Janneth Pérez Gopar',
  'PEREZ GOPAR JANET': 'Janneth Pérez Gopar',
  'PEREZ GOPAR JANNET': 'Janneth Pérez Gopar',
  'PEREZ GOPAR JANNETH': 'Janneth Pérez Gopar',

  'PAUL NESTOR ZAVALA': 'Paul Néstor Zavala',

  'DANIEL GUZMAN': 'Daniel Guzmán',
  'GUZMAN TERRAZAS DANIEL': 'Daniel Guzmán',

  'MAGDALENA PORTILLA': 'María Magdalena Portilla Romero',
  'MARIA MAGDALENA PORTILLA': 'María Magdalena Portilla Romero',
  'PORTILLA ROMERO MARIA MAGDALENA': 'María Magdalena Portilla Romero',

  'MARIBEL MATEO': 'Maribel Mateo Roque',

  'JESSICA HDZ LANDA': 'Jessica Hernández Landa',
  'JESSICA HERNANDEZ LANDA': 'Jessica Hernández Landa',
  'HERNANDEZ LANDA JESSICA': 'Jessica Hernández Landa',

  'AQUILES HERNANDEZ': 'Aquiles Hernández Carretos',
  'HERNANDEZ CARRETO AQUILES': 'Aquiles Hernández Carretos',
  'HERNANDEZ CARRETOS AQUILES': 'Aquiles Hernández Carretos',
};

export const PROMOTER_DISPLAY_NAMES: Record<string, string> = {
  'PROMOTOR DE CRÉDITO': 'Promotores de Crédito',
  'PROMOTOR DE CREDITO': 'Promotores de Crédito',
  'PROMOTOR DE CREDI TO': 'Promotores de Crédito',
  'ABIGAIL CORTEZ': 'Asesores de Crédito',
};

const MANAGER_HEADER_LABELS = new Set([
  'NOMBRE JEFE',
  'NOMBRE DEL JEFE',
  'JEFE',
  'JEFE DE VENTAS',
  'NOMBRE',
  'TOTAL',
]);

export function personLookupKey(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('es-MX');
}

function makeLookup(names: Record<string, string>): Map<string, string> {
  return new Map(
    Object.entries(names).map(([alias, display]) => [personLookupKey(alias), display]),
  );
}

const managers = makeLookup(MANAGER_DISPLAY_NAMES);
const promoters = makeLookup(PROMOTER_DISPLAY_NAMES);

export function isManagerHeaderLabel(value: string | null | undefined): boolean {
  return MANAGER_HEADER_LABELS.has(personLookupKey(value));
}

/**
 * Devuelve el nombre canónico de un jefe. Los desconocidos conservan una
 * presentación segura en nombre propio, sin fuzzy matching que pueda mezclar personas.
 */
export function formatManagerName(value: string | null | undefined): string {
  if (!value || isManagerHeaderLabel(value)) return '';
  return managers.get(personLookupKey(value)) ?? formatPersonName(value);
}

/** Identidad estable para cruces entre hojas, rankings y vistas. */
export function getManagerIdentityKey(value: string | null | undefined): string {
  const display = formatManagerName(value);
  return display ? personLookupKey(display) : '';
}

export function sameManager(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const leftKey = getManagerIdentityKey(left);
  const rightKey = getManagerIdentityKey(right);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

export function formatPromoterLabel(value: string | null | undefined): string {
  if (!value) return '';
  return promoters.get(personLookupKey(value)) ?? formatPersonName(value);
}
