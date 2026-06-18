// Fuente única de verdad para constantes compartidas entre páginas y componentes

export const CATEGORIAS = [
  { id: 1, nombre: 'Baches y vías' },
  { id: 2, nombre: 'Alumbrado público' },
  { id: 3, nombre: 'Basura y aseo' },
  { id: 4, nombre: 'Agua y alcantarillado' },
  { id: 5, nombre: 'Semáforos y señalética' },
  { id: 6, nombre: 'Parques y espacios públicos' },
  { id: 7, nombre: 'Seguridad' },
  { id: 8, nombre: 'Ruido' },
  { id: 9, nombre: 'Otros' },
];

export const ZONAS = [
  { id: 1,  nombre: 'Andrés de Vera' },
  { id: 2,  nombre: 'Picoazá' },
  { id: 3,  nombre: '4 de Noviembre' },
  { id: 4,  nombre: 'San Pablo' },
  { id: 5,  nombre: 'El Florón' },
  { id: 6,  nombre: 'Colón' },
  { id: 7,  nombre: 'La Pradera' },
  { id: 8,  nombre: 'Ciudad Nueva' },
  { id: 9,  nombre: 'Ciudadela Universitaria' },
  { id: 10, nombre: 'Otra zona' },
];

export const ESTADO_LABEL = {
  pendiente:  'PENDIENTE',
  en_proceso: 'EN PROCESO',
  resuelto:   'RESUELTO',
};

export const ESTADO_COLOR = {
  pendiente:  'estado-pendiente',
  en_proceso: 'estado-en_proceso',
  resuelto:   'estado-resuelto',
};

export const GRAVEDAD_LABEL = {
  1: 'Baja',
  2: 'Moderada',
  3: 'Media',
  4: 'Alta',
  5: 'Crítica',
};

export const TIPO_APORTE_LABEL = {
  confirmacion: 'Confirma el problema',
  evidencia:    'Agrega evidencia',
  detalle:      'Agrega detalle',
  relacionado:  'Problema relacionado',
};
