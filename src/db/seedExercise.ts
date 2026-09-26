// Contenido de la rutina de ejercicio en casa (migración v3, SPEC 03).
// ids de ejercicio = ids de free-exercise-db (github.com/yuhonas/free-exercise-db, Unlicense).

export const SEED_EXERCISES: { id: string; name: string; instructions: string }[] = [
  // Calentamiento
  { id: 'Arm_Circles', name: 'Círculos de brazos', instructions: 'De pie, brazos extendidos a los lados a la altura de los hombros. Haz círculos pequeños y ve agrandándolos; cambia de sentido a mitad.' },
  { id: 'Shoulder_Circles', name: 'Círculos de hombros', instructions: 'Brazos relajados a los lados. Sube los hombros hacia las orejas y gíralos hacia atrás en círculos amplios; luego hacia adelante.' },
  { id: 'Standing_Hip_Circles', name: 'Círculos de cadera', instructions: 'De pie sobre una pierna, apoyado en una pared si hace falta. Dibuja círculos amplios con la rodilla levantada; cambia de pierna a mitad.' },
  { id: 'Knee_Circles', name: 'Círculos de rodillas', instructions: 'Pies juntos, rodillas algo flexionadas y manos sobre ellas. Gira las rodillas en círculo hacia un lado y luego hacia el otro.' },
  { id: 'Single_Leg_Butt_Kick', name: 'Talones a glúteo', instructions: 'Trota en el sitio llevando los talones hacia los glúteos. Mantén el tronco erguido y los brazos activos.' },
  { id: 'Star_Jump', name: 'Saltos de estrella', instructions: 'Desde cuclillas, salta abriendo brazos y piernas en forma de estrella. Aterriza suave con las rodillas flexionadas.' },
  { id: 'Inchworm', name: 'Gusano', instructions: 'De pie, baja las manos al suelo y camina con ellas hasta la posición de plancha. Vuelve caminando los pies hacia las manos y sube.' },
  { id: 'Worlds_Greatest_Stretch', name: 'Estiramiento del mundo', instructions: 'Da una zancada larga, apoya la mano contraria al pie adelantado en el suelo y gira el tronco abriendo el otro brazo hacia el techo. Alterna lados.' },

  // A — Tren superior y core
  { id: 'Pushups', name: 'Flexiones', instructions: 'Manos algo más abiertas que los hombros, cuerpo recto de cabeza a talones. Baja el pecho casi al suelo y empuja para subir. Apoya rodillas si hace falta.' },
  { id: 'Superman', name: 'Superman', instructions: 'Boca abajo con brazos extendidos al frente. Eleva a la vez brazos, pecho y piernas, mantén 2 segundos y baja con control.' },
  { id: 'Push-Up_Wide', name: 'Flexiones abiertas', instructions: 'Como una flexión normal pero con las manos bastante más abiertas que los hombros. Baja con control y empuja.' },
  { id: 'Plank', name: 'Plancha', instructions: 'Apoya antebrazos y puntas de los pies, cuerpo recto. Aprieta abdomen y glúteos sin dejar caer la cadera.' },
  { id: 'Push-Ups_-_Close_Triceps_Position', name: 'Flexiones cerradas de tríceps', instructions: 'Manos juntas bajo el pecho y codos pegados al cuerpo. Baja y sube manteniendo el cuerpo recto. Apoya rodillas si hace falta.' },
  { id: 'Spider_Crawl', name: 'Gateo araña', instructions: 'En plancha alta, avanza llevando la rodilla hacia el codo del mismo lado en cada paso. Mantén la cadera baja.' },
  { id: 'Crunches', name: 'Abdominales', instructions: 'Boca arriba, rodillas flexionadas y manos detrás de la cabeza sin tirar del cuello. Eleva los hombros del suelo contrayendo el abdomen y baja lento.' },
  { id: 'Dead_Bug', name: 'Bicho muerto', instructions: 'Boca arriba, brazos al techo y rodillas a 90°. Extiende un brazo y la pierna contraria sin despegar la espalda baja del suelo; alterna.' },
  { id: 'Side_Bridge', name: 'Plancha lateral', instructions: 'De lado, apoyado en un antebrazo y el borde del pie. Eleva la cadera hasta formar una línea recta. Cambia de lado a mitad.' },
  { id: 'Reverse_Crunch', name: 'Abdominal inverso', instructions: 'Boca arriba, manos a los lados y rodillas flexionadas. Lleva las rodillas al pecho despegando la cadera del suelo y baja con control.' },
  { id: 'Flutter_Kicks', name: 'Patadas alternas', instructions: 'Boca arriba, manos bajo los glúteos y piernas estiradas algo elevadas. Sube y baja las piernas alternando, en movimientos cortos.' },
  { id: 'Cross-Body_Crunch', name: 'Abdominal cruzado', instructions: 'Boca arriba, manos detrás de la cabeza. Lleva un codo hacia la rodilla contraria mientras la acercas; alterna lados.' },
  { id: 'Childs_Pose', name: 'Postura del niño', instructions: 'De rodillas, siéntate sobre los talones y lleva el pecho hacia el suelo con los brazos estirados al frente. Respira lento.' },
  { id: 'Cat_Stretch', name: 'Estiramiento del gato', instructions: 'En cuatro apoyos, redondea la espalda hacia el techo metiendo la barbilla; luego arquéala mirando al frente. Alterna despacio.' },
  { id: 'Shoulder_Stretch', name: 'Estiramiento de hombro', instructions: 'Cruza un brazo estirado delante del pecho y acércalo con la otra mano. Cambia de brazo a mitad.' },
  { id: 'Triceps_Stretch', name: 'Estiramiento de tríceps', instructions: 'Lleva una mano detrás de la cabeza hacia la espalda y empuja suave el codo con la otra mano. Cambia de brazo a mitad.' },
  { id: 'Upper_Back_Stretch', name: 'Estiramiento de espalda alta', instructions: 'Entrelaza las manos al frente con brazos estirados y redondea la espalda alejando las manos del pecho.' },

  // B — Tren inferior y glúteo
  { id: 'Bodyweight_Squat', name: 'Sentadilla', instructions: 'Pies al ancho de hombros. Baja llevando la cadera atrás como para sentarte, rodillas en línea con los pies, y sube empujando con los talones.' },
  { id: 'Bodyweight_Walking_Lunge', name: 'Zancadas caminando', instructions: 'Da un paso largo al frente y baja hasta que ambas rodillas formen 90°. Empuja y avanza con la otra pierna. En espacio corto, alterna en el sitio.' },
  { id: 'Butt_Lift_Bridge', name: 'Puente de glúteo', instructions: 'Boca arriba, rodillas flexionadas y pies apoyados. Eleva la cadera apretando glúteos hasta alinear hombros y rodillas; baja lento.' },
  { id: 'Split_Squats', name: 'Sentadilla dividida', instructions: 'Un pie adelante y otro atrás. Baja la rodilla trasera hacia el suelo con el tronco erguido y sube. Cambia de pierna a mitad.' },
  { id: 'Glute_Kickback', name: 'Patada de glúteo', instructions: 'En cuatro apoyos, empuja una pierna hacia atrás y arriba con la rodilla flexionada, apretando el glúteo. Cambia de pierna a mitad.' },
  { id: 'Single_Leg_Glute_Bridge', name: 'Puente a una pierna', instructions: 'Como el puente de glúteo pero con una pierna estirada en el aire. Sube y baja la cadera con la pierna apoyada. Cambia a mitad.' },
  { id: 'Freehand_Jump_Squat', name: 'Sentadilla con salto', instructions: 'Haz una sentadilla y sube saltando con fuerza. Aterriza suave y enlaza con la siguiente sentadilla.' },
  { id: 'Side_Leg_Raises', name: 'Elevación lateral de pierna', instructions: 'Tumbado de lado, pierna de arriba estirada. Elévala sin girar la cadera y baja con control. Cambia de lado a mitad.' },
  { id: 'Mountain_Climbers', name: 'Escaladores', instructions: 'En plancha alta, lleva las rodillas al pecho alternando, a ritmo rápido. Mantén la cadera baja y los hombros sobre las manos.' },
  { id: 'Bent-Knee_Hip_Raise', name: 'Elevación de cadera con rodillas flexionadas', instructions: 'Boca arriba con rodillas flexionadas y pies elevados. Lleva las rodillas al pecho despegando la cadera y baja lento.' },
  { id: 'Hamstring_Stretch', name: 'Estiramiento de isquiotibiales', instructions: 'Boca arriba, eleva una pierna estirada y sujétala por detrás del muslo acercándola. Cambia de pierna a mitad.' },
  { id: 'On_Your_Side_Quad_Stretch', name: 'Estiramiento de cuádriceps de lado', instructions: 'Tumbado de lado, dobla la rodilla de arriba y lleva el talón al glúteo sujetando el pie. Cambia de lado a mitad.' },
  { id: 'Kneeling_Hip_Flexor', name: 'Flexor de cadera de rodillas', instructions: 'Con una rodilla en el suelo y el otro pie adelante, empuja la cadera hacia delante manteniendo el tronco recto. Cambia a mitad.' },
  { id: 'Calf_Stretch_Hands_Against_Wall', name: 'Estiramiento de pantorrilla en pared', instructions: 'Manos en la pared, una pierna atrás estirada con el talón apoyado. Inclínate hacia la pared hasta notar la pantorrilla. Cambia a mitad.' },

  // C — Cuerpo completo y cardio
  { id: 'Split_Jump', name: 'Zancada con salto', instructions: 'Desde una zancada, salta y cambia de pierna en el aire. Aterriza suave con ambas rodillas flexionadas.' },
  { id: 'Knee_Tuck_Jump', name: 'Salto con rodillas al pecho', instructions: 'Salta lo más alto que puedas llevando las rodillas hacia el pecho. Aterriza suave y repite.' },
  { id: 'Fast_Skipping', name: 'Skipping rápido', instructions: 'Corre en el sitio subiendo las rodillas a la altura de la cadera, a ritmo rápido y con los brazos activos.' },
  { id: 'Russian_Twist', name: 'Giro ruso', instructions: 'Sentado con rodillas flexionadas y el tronco inclinado atrás. Gira el tronco llevando las manos a un lado y al otro.' },
  { id: 'Scissors_Jump', name: 'Saltos de tijera', instructions: 'Con un pie adelante y otro atrás, salta cambiando la posición de los pies en el aire. Mantén un ritmo constante.' },
  { id: 'Standing_Lateral_Stretch', name: 'Estiramiento lateral de pie', instructions: 'De pie, lleva un brazo por encima de la cabeza e inclina el tronco hacia el lado contrario. Cambia de lado a mitad.' },
  { id: 'Runners_Stretch', name: 'Estiramiento del corredor', instructions: 'Con un pie adelante y la pierna trasera estirada, inclínate hacia la pierna delantera con manos en el suelo. Cambia a mitad.' },

  // D — Movilidad y estiramiento
  { id: 'Hip_Circles_prone', name: 'Círculos de cadera en cuadrupedia', instructions: 'En cuatro apoyos, eleva una rodilla hacia el lado y dibuja círculos amplios con ella. Cambia de pierna a mitad.' },
  { id: 'Groiners', name: 'Aperturas de ingle', instructions: 'En plancha alta, lleva un pie junto a la mano del mismo lado y vuelve. Alterna piernas a ritmo controlado.' },
  { id: 'Dynamic_Back_Stretch', name: 'Estiramiento dinámico de espalda', instructions: 'De pie, abre los brazos hacia atrás abriendo el pecho y luego crúzalos delante redondeando la espalda. Alterna con fluidez.' },
  { id: 'Upward_Stretch', name: 'Estiramiento hacia arriba', instructions: 'De pie, entrelaza las manos y estira los brazos por encima de la cabeza, alargando todo el cuerpo hacia el techo.' },
  { id: '90_90_Hamstring', name: 'Isquiotibiales 90/90', instructions: 'Boca arriba, sujeta un muslo con la rodilla a 90°. Estira la rodilla hacia el techo hasta notar el estiramiento. Cambia a mitad.' },
  { id: 'Seated_Floor_Hamstring_Stretch', name: 'Isquiotibiales sentado', instructions: 'Sentado con las piernas estiradas al frente, inclina el tronco desde la cadera hacia los pies con la espalda larga.' },
  { id: 'Knee_Across_The_Body', name: 'Rodilla cruzada', instructions: 'Boca arriba, lleva una rodilla flexionada hacia el lado contrario girando la cadera, hombros en el suelo. Cambia a mitad.' },
  { id: 'Hug_Knees_To_Chest', name: 'Rodillas al pecho', instructions: 'Boca arriba, abraza las dos rodillas y llévalas hacia el pecho. Relaja la espalda baja y respira lento.' },
  { id: 'Side_Lying_Groin_Stretch', name: 'Ingle de lado', instructions: 'Tumbado de lado, dobla la pierna de arriba y apoya el pie delante de la rodilla de abajo, abriendo la cadera. Cambia a mitad.' },
  { id: 'Chin_To_Chest_Stretch', name: 'Barbilla al pecho', instructions: 'Sentado o de pie, lleva la barbilla hacia el pecho y deja que el peso de las manos en la nuca alargue el cuello.' },
  { id: 'Side_Neck_Stretch', name: 'Cuello lateral', instructions: 'Inclina la cabeza llevando la oreja hacia el hombro, con el hombro contrario relajado. Cambia de lado a mitad.' },
];

interface SeedSection {
  name: string;
  rounds: number;
  roundRestSec: number;
  workSec: number;
  restSec: number;
  exerciseIds: string[];
}

const WARMUP: SeedSection = {
  name: 'Calentamiento',
  rounds: 1,
  roundRestSec: 0,
  workSec: 45,
  restSec: 15,
  exerciseIds: [
    'Arm_Circles', 'Shoulder_Circles', 'Standing_Hip_Circles', 'Knee_Circles',
    'Single_Leg_Butt_Kick', 'Star_Jump', 'Inchworm', 'Worlds_Greatest_Stretch',
  ],
};

const circuit = (name: string, rounds: number, exerciseIds: string[]): SeedSection => ({
  name, rounds, roundRestSec: 60, workSec: 40, restSec: 20, exerciseIds,
});

const stretch = (name: string, exerciseIds: string[]): SeedSection => ({
  name, rounds: 1, roundRestSec: 0, workSec: 60, restSec: 0, exerciseIds,
});

export const SEED_ROUTINES: { id: string; name: string; description: string; sections: SeedSection[] }[] = [
  {
    id: 'A',
    name: 'Tren superior y core',
    description: 'Pecho, espalda, brazos y abdomen con el peso del cuerpo.',
    sections: [
      WARMUP,
      circuit('Circuito 1', 4, ['Pushups', 'Superman', 'Push-Up_Wide', 'Plank', 'Push-Ups_-_Close_Triceps_Position', 'Spider_Crawl']),
      circuit('Circuito 2', 3, ['Crunches', 'Dead_Bug', 'Side_Bridge', 'Reverse_Crunch', 'Flutter_Kicks', 'Cross-Body_Crunch']),
      stretch('Enfriamiento', ['Childs_Pose', 'Cat_Stretch', 'Shoulder_Stretch', 'Triceps_Stretch', 'Upper_Back_Stretch']),
    ],
  },
  {
    id: 'B',
    name: 'Tren inferior y glúteo',
    description: 'Piernas y glúteos con sentadillas, zancadas y puentes.',
    sections: [
      WARMUP,
      circuit('Circuito 1', 4, ['Bodyweight_Squat', 'Bodyweight_Walking_Lunge', 'Butt_Lift_Bridge', 'Split_Squats', 'Glute_Kickback', 'Single_Leg_Glute_Bridge']),
      circuit('Circuito 2', 3, ['Freehand_Jump_Squat', 'Side_Leg_Raises', 'Mountain_Climbers', 'Flutter_Kicks', 'Bent-Knee_Hip_Raise', 'Plank']),
      stretch('Enfriamiento', ['Hamstring_Stretch', 'On_Your_Side_Quad_Stretch', 'Kneeling_Hip_Flexor', 'Calf_Stretch_Hands_Against_Wall', 'Childs_Pose']),
    ],
  },
  {
    id: 'C',
    name: 'Cuerpo completo y cardio',
    description: 'Circuitos intensos que combinan fuerza y saltos.',
    sections: [
      WARMUP,
      circuit('Circuito 1', 4, ['Star_Jump', 'Pushups', 'Bodyweight_Squat', 'Mountain_Climbers', 'Split_Jump', 'Superman']),
      circuit('Circuito 2', 3, ['Knee_Tuck_Jump', 'Spider_Crawl', 'Fast_Skipping', 'Russian_Twist', 'Scissors_Jump', 'Plank']),
      stretch('Enfriamiento', ['Hamstring_Stretch', 'Childs_Pose', 'Standing_Lateral_Stretch', 'Runners_Stretch', 'Cat_Stretch']),
    ],
  },
  {
    id: 'D',
    name: 'Movilidad y estiramiento',
    description: 'Sesión suave de domingo para soltar articulaciones y recuperar.',
    sections: [
      WARMUP,
      {
        name: 'Flujo de movilidad',
        rounds: 5,
        roundRestSec: 60,
        workSec: 50,
        restSec: 10,
        exerciseIds: [
          'Worlds_Greatest_Stretch', 'Cat_Stretch', 'Inchworm', 'Hip_Circles_prone',
          'Groiners', 'Dynamic_Back_Stretch', 'Kneeling_Hip_Flexor', 'Upward_Stretch',
        ],
      },
      stretch('Estiramientos', [
        '90_90_Hamstring', 'Seated_Floor_Hamstring_Stretch', 'Knee_Across_The_Body', 'Hug_Knees_To_Chest',
        'Childs_Pose', 'Side_Lying_Groin_Stretch', 'Chin_To_Chest_Stretch', 'Side_Neck_Stretch',
      ]),
    ],
  },
];

// weekday = Date.getDay(): 0 = domingo … 6 = sábado.
export const SEED_ROUTINE_DAYS: [number, string][] = [
  [0, 'D'], [1, 'A'], [2, 'B'], [3, 'C'], [4, 'A'], [5, 'B'], [6, 'C'],
];
