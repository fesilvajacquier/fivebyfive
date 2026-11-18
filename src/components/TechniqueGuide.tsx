import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { LIFTS, LiftId } from '../program';
import { Ref as BaseRef } from './GuideTab';

const REFS = [
  { id: 1, text: 'StrongLifts. "How to Squat with Proper Form".', url: 'https://stronglifts.com/squat/' },
  { id: 2, text: 'StrongLifts. "How to Bench Press with Proper Form".', url: 'https://stronglifts.com/bench-press/' },
  { id: 3, text: 'StrongLifts. "How to Overhead Press with Proper Form".', url: 'https://stronglifts.com/overhead-press/' },
  { id: 4, text: 'StrongLifts. "How to Barbell Row with Proper Form".', url: 'https://stronglifts.com/barbell-row/' },
  { id: 5, text: 'StrongLifts. "How to Deadlift with Proper Form".', url: 'https://stronglifts.com/deadlift/' },
  {
    id: 6,
    text: 'Sands WA, Wurth JJ, Hewit JK. Basics of Strength and Conditioning Manual. National Strength and Conditioning Association (NSCA), 2012.',
    url: 'https://web.archive.org/web/20220212100135id_/https://www.nsca.com/uploadedFiles/NSCA/Resources/PDF/Publications/basics_of_strength_and_conditioning_manual.pdf',
  },
  {
    id: 7,
    text: 'NSCA. Lifting proficiencies for various strength movements (copia de Western Illinois University).',
    url: 'https://www.wiu.edu/coehs/healthwellness/documents/exercise_science/lift.pdf',
  },
  { id: 8, text: 'American Council on Exercise (ACE). Exercise Library: Back Squat.', url: 'https://acefitness.org/resources/everyone/exercise-library/11/back-squat/' },
  { id: 9, text: 'American Council on Exercise (ACE). Exercise Library: Chest Press.', url: 'https://acefitness.org/resources/everyone/exercise-library/5/chest-press' },
  {
    id: 10,
    text: 'Myer GD, et al. The back squat: a proposed assessment of functional deficits and technical factors that limit performance. Strength Cond J. 2014;36(6):4–27.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4262933/',
  },
  {
    id: 11,
    text: 'Hartmann H, Wirth K, Klusemann M. Analysis of the load on the knee joint and vertebral column with changes in squatting depth and weight load. Sports Med. 2013;43(10):993–1008.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23821469/',
  },
  {
    id: 12,
    text: 'Kubo K, Ikebukuro T, Yata H. Effects of squat training with different depths on lower limb muscle volumes. Eur J Appl Physiol. 2019;119(9):1933–1942.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31230110/',
  },
  {
    id: 13,
    text: 'Fry AC, Smith JC, Schilling BK. Effect of knee position on hip and knee torques during the barbell squat. J Strength Cond Res. 2003;17(4):629–633.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/14636100/',
  },
  {
    id: 14,
    text: 'Glassbrook DJ, et al. A review of the biomechanical differences between the high-bar and low-bar back-squat. J Strength Cond Res. 2017;31(9):2618–2634.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28570490/',
  },
  {
    id: 15,
    text: 'Wenning MR. The deadlift and its application to overall performance. NSCA TSAC Report, 2014.',
    url: 'https://web.archive.org/web/20260717181652/https://www.nsca.com/education/articles/tsac-report/the-deadlift-and-its-application-to-overall-performance/',
  },
  {
    id: 16,
    text: 'Noteboom L, et al. Effects of bench press technique variations on musculoskeletal shoulder loads and potential injury risk. Front Physiol. 2024;15:1393235.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38974522/',
  },
  {
    id: 17,
    text: 'Bartolomei S, et al. Comparison of the flat-back and arched-back bench press. J Strength Cond Res. 2024;38(7):1200–1205.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38551927/',
  },
  { id: 18, text: 'Jumbelic MI. Traumatic asphyxia in weightlifters. J Forensic Sci. 2007;52(3):702–705.', url: 'https://pubmed.ncbi.nlm.nih.gov/17456099/' },
  {
    id: 19,
    text: 'Fenwick CM, Brown SH, McGill SM. Comparison of different rowing exercises: trunk muscle activation and lumbar spine motion, load, and stiffness. J Strength Cond Res. 2009;23(5):1408–1417.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19620925/',
  },
  { id: 20, text: 'American Academy of Family Physicians. Weight-training and weight-lifting safety. Am Fam Physician. 2003;67(2):371–372.', url: 'https://www.aafp.org/pubs/afp/issues/2003/0115/p371.html' },
  {
    id: 21,
    text: 'Hackett DA, Chow CM. The Valsalva maneuver: its effect on intra-abdominal pressure and safety issues during resistance exercise. J Strength Cond Res. 2013;27(8):2338–2345.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23222073/',
  },
  {
    id: 22,
    text: 'Narloch JA, Brandstater ME. Influence of breathing technique on arterial blood pressure during heavy weight lifting. Arch Phys Med Rehabil. 1995;76(5):457–462.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/7741618/',
  },
  {
    id: 23,
    text: 'Paluch AE, et al. Resistance exercise training in individuals with and without cardiovascular disease: 2023 update. AHA Scientific Statement. Circulation. 2024;149(3):e217–e231.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11209834/',
  },
  {
    id: 24,
    text: 'Lander JE, Hundley JR, Simonton RL. The effectiveness of weight-belts during multiple repetitions of the squat exercise. Med Sci Sports Exerc. 1992;24(5):603–609.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1533266/',
  },
  {
    id: 25,
    text: 'Braun WA, Sforzo GA. ACSM Information On… Delayed Onset Muscle Soreness (DOMS). American College of Sports Medicine.',
    url: 'https://web.archive.org/web/20240531151515/https://www.acsm.org/docs/default-source/files-for-resource-library/delayed-onset-muscle-soreness-(doms).pdf',
  },
];

const R = ({ n }: { n: number }) => <BaseRef n={n} prefix="tref" />;

function Lift({ id, children }: { id: LiftId; children: ComponentChildren }) {
  return (
    <section class="card" id={`tec-${id}`}>
      <h2>{LIFTS[id].name}</h2>
      {children}
    </section>
  );
}

function Faq({ q, children }: { q: string; children: ComponentChildren }) {
  return (
    <details class="faq">
      <summary>{q}</summary>
      {children}
    </details>
  );
}

export function TechniqueGuide({ focus }: { focus?: LiftId }) {
  useEffect(() => {
    if (focus) document.getElementById(`tec-${focus}`)?.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [focus]);

  return (
    <>
      <p class="muted">
        Puntos clave de cada ejercicio, según StrongLifts (la fuente del programa), la NSCA y el ACE (organizaciones que certifican entrenadores) y
        estudios publicados. Cuando las fuentes no coinciden, se dice. No reemplaza a alguien que te vea entrenar.
      </p>

      <Lift id="squat">
        <ul>
          <li>
            <strong>Pies:</strong> talones al ancho de los hombros, puntas un poco hacia afuera <R n={1} /> <R n={7} />. Talones apoyados todo el tiempo{' '}
            <R n={7} />.
          </li>
          <li>
            <strong>Barra:</strong> sobre la parte alta de la espalda. Más baja (sobre los deltoides) inclina más el torso; más alta
            (base del cuello) lo deja más vertical. Las dos son válidas <R n={7} /> <R n={14} />.
          </li>
          <li>
            <strong>Profundidad:</strong> bajá hasta que las caderas queden por debajo de las rodillas <R n={1} /> <R n={8} />. Ver preguntas frecuentes.
          </li>
          <li>
            <strong>Rodillas:</strong> en la misma dirección que los pies, sin que se cierren hacia adentro <R n={7} /> <R n={10} />. Pueden pasar la punta
            de los pies <R n={10} /> <R n={13} />.
          </li>
          <li>
            <strong>Espalda:</strong> neutra, sin redondearla ni arquearla de más, con el ángulo del torso estable <R n={1} /> <R n={7} /> <R n={10} />.
          </li>
          <li>
            <strong>Respiración:</strong> tomá aire arriba, retenelo mientras bajás y subís, soltalo arriba <R n={1} />.
          </li>
        </ul>
        <p class="verdict">
          Difieren: la NSCA pide bajar hasta muslos paralelos al piso; StrongLifts y el ACE, caderas por debajo de las rodillas <R n={1} /> <R n={7} />{' '}
          <R n={8} />. StrongLifts gira las puntas 30° y mira al piso delante; Myer et al. recomiendan no más de 10° y mirar al frente o un poco arriba, y la
          NSCA, la cabeza levemente hacia arriba <R n={1} /> <R n={7} /> <R n={10} />.
        </p>
      </Lift>

      <Lift id="bench">
        <ul>
          <li>
            <strong>Cinco apoyos:</strong> cabeza, hombros y espalda alta, glúteos en el banco, y los dos pies planos en el piso <R n={6} />.
          </li>
          <li>
            <strong>Agarre:</strong> con el pulgar rodeando la barra, manos un poco más abiertas que los hombros <R n={6} /> <R n={9} />. Nunca sin pulgar <R n={2} /> <R n={6} />.
          </li>
          <li>
            <strong>Muñecas:</strong> rectas, encima de los codos <R n={2} /> <R n={6} />.
          </li>
          <li>
            <strong>Escápulas:</strong> juntalas y llevalas hacia atrás <R n={2} />. En un modelo biomecánico, juntar las escápulas y
            no abrir las manos más de 1,5 veces el ancho de hombros redujo la carga sobre el hombro <R n={16} />.
          </li>
          <li>
            <strong>Recorrido:</strong> bajá la barra a la mitad del pecho y tocá sin rebotar <R n={2} /> <R n={6} />.
          </li>
          <li>
            <strong>Seguridad:</strong> siempre con barras de seguridad en la jaula o con alguien que te asista <R n={2} /> <R n={6} />. Ver “Seguridad”.
          </li>
        </ul>
        <p class="verdict">
          Difieren en el arco lumbar: la NSCA pide la espalda baja apoyada en el banco; StrongLifts, arquearla para mantener el pecho alto <R n={2} />{' '}
          <R n={6} />. Los estudios solo comparan rendimiento y encuentran ambas válidas <R n={17} />. Tampoco hay acuerdo en el ángulo de los codos
          (StrongLifts dice unos 75°, el ACE solo “hacia los lados”) y no se encontró evidencia para fijar un número <R n={2} /> <R n={9} />.
        </p>
      </Lift>

      <Lift id="row">
        <ul>
          <li>
            <strong>Torso:</strong> paralelo al piso. Si se levanta más de 15°, el peso es demasiado <R n={4} /> <R n={6} />.
          </li>
          <li>
            <strong>Espalda:</strong> plana durante todo el movimiento <R n={4} /> <R n={6} />. Es el remo con más carga lumbar entre los estudiados, así que
            la técnica importa <R n={19} />.
          </li>
          <li>
            <strong>Hacia dónde:</strong> llevá la barra a la parte baja del pecho o alta del abdomen <R n={4} /> <R n={6} />.
          </li>
          <li>
            <strong>Sin impulso:</strong> no ayudes con las piernas ni la cadera <R n={4} /> <R n={6} />.
          </li>
        </ul>
        <p class="verdict">
          Difieren: StrongLifts apoya la barra en el piso en cada repetición; la NSCA y el ACE la mantienen colgando entre repeticiones <R n={4} />{' '}
          <R n={6} />. La app sigue a StrongLifts.
        </p>
      </Lift>

      <Lift id="ohp">
        <ul>
          <li>
            <strong>Pies:</strong> al ancho de la cadera <R n={3} /> <R n={6} />.
          </li>
          <li>
            <strong>Agarre:</strong> apenas por fuera de los hombros, antebrazos verticales <R n={3} /> <R n={6} />.
          </li>
          <li>
            <strong>Tronco:</strong> abdomen y glúteos apretados, hombros sobre las caderas. No te inclines hacia atrás ni arquees la espalda baja para
            terminar la repetición <R n={3} /> <R n={6} />.
          </li>
          <li>
            <strong>Recorrido:</strong> corré la cabeza un poco hacia atrás para dejar pasar la barra y volvé adelante cuando pasó la frente <R n={3} />.
          </li>
          <li>
            <strong>Arriba:</strong> codos extendidos, barra en línea con hombros, caderas y talones <R n={3} /> <R n={6} />.
          </li>
        </ul>
        <p class="verdict">
          El recorrido de la cabeza es indicación de StrongLifts; las organizaciones consultadas no lo describen <R n={3} />.
        </p>
      </Lift>

      <Lift id="deadlift">
        <ul>
          <li>
            <strong>Posición inicial:</strong> barra sobre el medio del pie, a unos 3 cm de las tibias <R n={5} /> <R n={7} />. Caderas más altas que en una
            sentadilla paralela y más bajas que los hombros; hombros sobre la barra o un poco delante <R n={5} /> <R n={7} />.
          </li>
          <li>
            <strong>Espalda:</strong> neutra, nunca redondeada en la zona lumbar <R n={5} /> <R n={7} />.
          </li>
          <li>
            <strong>Barra pegada a las piernas:</strong> cuanto más se aleja, más trabaja la espalda baja <R n={7} /> <R n={15} />.
          </li>
          <li>
            <strong>Arriba:</strong> terminá erguido, sin tirarte hacia atrás <R n={5} /> <R n={7} />.
          </li>
          <li>
            <strong>Bajada:</strong> controlada, llevando la cadera atrás primero, con la espalda plana <R n={5} /> <R n={7} />.
          </li>
          <li>
            <strong>Cada repetición desde el piso, quieta:</strong> sin rebotar <R n={5} />.
          </li>
        </ul>
        <p class="verdict">
          Agarre: la NSCA usa agarre mixto (una palma hacia adelante y otra hacia atrás); StrongLifts empieza con las dos palmas hacia vos <R n={5} />{' '}
          <R n={7} />. Lo de no rebotar es solo de StrongLifts; no se encontró una fuente de organizaciones al respecto.
        </p>
      </Lift>

      <section class="card">
        <h2>Seguridad</h2>
        <ul>
          <li>
            En sentadilla y banca, usá una jaula con las barras de seguridad a la altura correcta <R n={2} /> <R n={6} />. En la sentadilla, justo por debajo
            de tu profundidad <R n={1} />.
          </li>
          <li>
            Poné trabas en la barra para que los discos no se deslicen <R n={1} /> <R n={20} />.
          </li>
          <li>
            Si fallás solo: en la sentadilla, bajá hasta apoyar la barra en los seguros; en la banca, bajala al pecho y aplaná la espalda para apoyarla en
            los seguros <R n={1} /> <R n={2} />. Esto lo describe StrongLifts; no se encontró guía de organizaciones.
          </li>
          <li>
            Hacer banca solo y sin seguros es peligroso: hay muertes registradas por la barra sobre el cuello <R n={18} />.
          </li>
        </ul>
      </section>

      <section class="card">
        <h2>Preguntas frecuentes</h2>
        <Faq q="¿Cuánto tengo que bajar en la sentadilla?">
          <p>
            Hasta que la cadera quede por debajo de las rodillas, como piden StrongLifts y el ACE <R n={1} /> <R n={8} />. La NSCA se conforma con muslos
            paralelos <R n={7} />.
          </p>
          <p>
            Bajar profundo no es más riesgoso para rodillas ni columna; las medias sentadillas con mucho peso sí pueden favorecer el desgaste{' '}
            <R n={11} />. Y la sentadilla completa desarrolla más los músculos de las piernas que la media <R n={12} />.
          </p>
        </Faq>
        <Faq q="¿Las rodillas pueden pasar la punta de los pies?">
          <p>
            Sí. Frenarlas hace que la cadera cargue mucho más (de 28 a 303 N·m en un estudio) <R n={13} />. Lo importante es que
            sigan la dirección de los pies <R n={10} />.
          </p>
        </Faq>
        <Faq q="¿Cómo respiro? ¿Está bien aguantar el aire?">
          <p>
            Retener el aire unos segundos (maniobra de Valsalva) es inevitable con cargas pesadas, y sus riesgos para la salud no están confirmados{' '}
            <R n={21} />. Pero la presión arterial sube mucho: 311/284 mmHg en promedio, contra 198/175 soltando el aire despacio <R n={22} />.
          </p>
          <p>
            Si tenés presión alta, consultá antes: la American Heart Association avala el entrenamiento de fuerza de intensidad baja a moderada con la
            presión controlada <R n={23} />, y un 5×5 pesado va más allá de eso.
          </p>
        </Faq>
        <Faq q="¿Necesito cinturón?">
          <p>
            No para empezar. El cinturón aumenta la presión abdominal un 25–40% <R n={24} />, pero ninguna organización consultada lo recomienda para
            principiantes. StrongLifts lo sugiere solo para las series pesadas <R n={1} />.
          </p>
        </Faq>
        <Faq q="¿Cómo distingo dolor de agujetas?">
          <p>
            Las agujetas aparecen 12–24 h después, son peores a las 24–72 h y duran 3–5 días <R n={25} />. El dolor <em>durante</em> el ejercicio indica un
            problema (demasiado peso, mala técnica): pará <R n={25} />. Consultá a un médico si el dolor te incapacita, hay mucha hinchazón o la orina se pone
            oscura <R n={25} />.
          </p>
        </Faq>
        <Faq q="¿Cómo sé si lo estoy haciendo bien?">
          <p>
            Filmate de costado y miralo entre series <R n={1} /> <R n={10} />. Compará con los puntos de arriba: profundidad, espalda neutra, barra pegada al
            cuerpo.
          </p>
        </Faq>
        <Faq q="No llego a la profundidad, ¿qué hago?">
          <p>
            Si los talones se levantan, suele faltar movilidad de tobillo; si no llegás abajo, rigidez de cadera y aductores <R n={10} />. StrongLifts sugiere
            abrir los pies al ancho de hombros con las puntas hacia afuera <R n={1} />.
          </p>
        </Faq>
      </section>

      <section class="card">
        <h2>Fuentes</h2>
        <ol class="refs">
          {REFS.map((r) => (
            <li key={r.id} id={`tref-${r.id}`}>
              {r.text}{' '}
              <a href={r.url} target="_blank" rel="noreferrer">
                Enlace
              </a>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
