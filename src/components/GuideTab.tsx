import type { Store } from '../app';
import { BEFORE_WORK_SEC, LIFTS, LIFT_IDS, MAX_WARMUP_JUMP, MIN_WARMUP_SETS, SET_SEC, Settings, WARMUP_SET_SEC, WorkoutType, estimateWorkoutSec, fmtKg, nextWeight } from '../program';
import { clock } from '../time';

const REFS = [
  {
    id: 1,
    text: 'StrongLifts. "Stronglifts 5×5 Workout Program: Quick Start Guide" (act. 2024).',
    url: 'https://stronglifts.com/stronglifts-5x5/workout-program/',
  },
  { id: 2, text: 'StrongLifts Support. "How does the StrongLifts warmup calculator work?"', url: 'https://support.stronglifts.com/article/87-warmup' },
  { id: 3, text: 'StrongLifts Support. "How do I use the rest timer on my phone?"', url: 'https://support.stronglifts.com/article/39-timer' },
  { id: 4, text: 'StrongLifts Support. "How to change increments".', url: 'https://support.stronglifts.com/article/71-increments' },
  {
    id: 5,
    text: 'American College of Sports Medicine. Position stand: Progression models in resistance training for healthy adults. Med Sci Sports Exerc. 2009;41(3):687–708.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/',
  },
  {
    id: 6,
    text: 'Currier BS, et al. ACSM Position Stand: Resistance training prescription for muscle function, hypertrophy, and physical performance in healthy adults: an overview of reviews. Med Sci Sports Exerc. 2026;58(4):851–872.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/',
  },
  {
    id: 7,
    text: 'Grgic J, Schoenfeld BJ, et al. Effects of rest interval duration in resistance training on measures of muscular strength: a systematic review. Sports Med. 2018;48(1):137–151.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28933024/',
  },
  {
    id: 8,
    text: 'de Salles BF, Simão R, et al. Rest interval between sets in strength training. Sports Med. 2009;39(9):765–777.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19691365/',
  },
  {
    id: 9,
    text: 'Ribeiro AS, Romanzini M, Schoenfeld BJ, et al. Effect of different warm-up procedures on the performance of resistance training exercises. Percept Mot Skills. 2014;119(1):133–145.',
    url: 'https://search.pedro.org.au/search-results/record-detail/41393',
  },
  {
    id: 10,
    text: 'Ribeiro B, et al. The effect of warm-up in resistance training and strength performance: a systematic review. Motricidade. 2021.',
    url: 'https://revistas.rcaap.pt/motricidade/article/view/21143',
  },
];

const Ref = ({ n }: { n: number }) => (
  <a href={`#ref-${n}`} class="cite">
    [{n}]
  </a>
);

const minutes = (type: WorkoutType, store: Store, settings: Settings) => Math.round(estimateWorkoutSec(type, store.history, settings) / 60);

export function GuideTab({ store }: { store: Store }) {
  const s = store.settings;
  const restOptions = [90, 120, 180];

  return (
    <div class="guide">
      <h1>Guía</h1>
      <p class="muted">Por qué la app usa cada número, y de dónde sale. Los valores en negrita son tu configuración actual.</p>

      <section class="card">
        <h2>Resumen</h2>
        <table class="summary">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>App</th>
              <th>Base</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Programa</td>
              <td>A/B alternados, 3 días por semana</td>
              <td>
                StrongLifts <Ref n={1} />
              </td>
            </tr>
            <tr>
              <td>Aumento por sesión</td>
              <td>
                <strong>
                  +{fmtKg(s.increments.squat)} kg (peso muerto +{fmtKg(s.increments.deadlift)})
                </strong>
              </td>
              <td>
                StrongLifts <Ref n={1} />, dentro del 2–10% del ACSM <Ref n={5} />
              </td>
            </tr>
            <tr>
              <td>Descarga</td>
              <td>
                <strong>
                  −{s.deloadPercent}% tras {s.failuresBeforeDeload} fallos
                </strong>
              </td>
              <td>
                Convención de StrongLifts <Ref n={4} />
              </td>
            </tr>
            <tr>
              <td>Descanso</td>
              <td>
                <strong>
                  {clock(s.restSuccessSec)} (hasta {clock(s.restHardSec)} si costó), {clock(s.restFailSec)} tras un fallo
                </strong>
              </td>
              <td>
                <Ref n={1} /> <Ref n={3} /> <Ref n={5} /> <Ref n={6} /> <Ref n={7} />
              </td>
            </tr>
            <tr>
              <td>Entrada en calor</td>
              <td>
                2×5 barra sola, luego saltos de hasta {MAX_WARMUP_JUMP} kg; peso muerto, mínimo {MIN_WARMUP_SETS.deadlift} series
              </td>
              <td>
                StrongLifts <Ref n={1} /> <Ref n={2} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Cómo registrar las series</h2>
        <p>Cada círculo es una serie de trabajo. Tocalo al terminar la serie:</p>
        <table>
          <tbody>
            <tr>
              <td>1 toque</td>
              <td>
                <span class="ok-chip">5</span> naranja: serie lograda (hiciste las 5).
              </td>
            </tr>
            <tr>
              <td>2 toques</td>
              <td>
                <span class="fail-chip">4</span> borde rojo: hiciste 4. Cada toque más resta una (3, 2, 1, 0).
              </td>
            </tr>
            <tr>
              <td>Tras el 0</td>
              <td>Vuelve a quedar vacío, como si no la hubieras hecho.</td>
            </tr>
          </tbody>
        </table>
        <p>Cómo cuenta la app una sesión de cada ejercicio:</p>
        <ul>
          <li>
            <strong>Lograda:</strong> todas las series en 5. La próxima vez sube el peso.
          </li>
          <li>
            <strong>Fallida:</strong> al menos una serie con menos de 5, o sin marcar al terminar. La próxima vez repetís el peso.
          </li>
          <li>
            <strong>Salteada:</strong> ninguna serie marcada. No cuenta como fallo y el peso no cambia.
          </li>
          <li>
            Después de <strong>{s.failuresBeforeDeload} sesiones fallidas seguidas</strong> con el mismo peso, baja un {s.deloadPercent}% (ver “Fallos y
            descarga”).
          </li>
        </ul>
        <p>
          Contá solo las repeticiones completas y con buena técnica. Si te equivocaste, abrí el entrenamiento en Historial y corregilo: los pesos siguientes se recalculan solos.
        </p>
        <p class="muted small">Al marcar una serie arranca el descanso: {clock(s.restSuccessSec)} si fue lograda, {clock(s.restFailSec)} si fue fallida.</p>
      </section>

      <section class="card">
        <h2>El programa</h2>
        <p>
          Dos rutinas que se alternan, tres veces por semana (por ejemplo lunes, miércoles y viernes) <Ref n={1} />:
        </p>
        <ul>
          <li>
            <strong>A:</strong> sentadilla 5×5, press de banca 5×5, remo con barra 5×5.
          </li>
          <li>
            <strong>B:</strong> sentadilla 5×5, press militar 5×5, peso muerto 1×5.
          </li>
        </ul>
        <p>
          El peso muerto es una sola serie porque es el ejercicio más pesado y ya se entrena la cadena posterior con la sentadilla en cada sesión <Ref n={1} />.
          El ACSM recomienda 2–3 sesiones semanales para principiantes <Ref n={5} />, y su actualización de 2026 pide al menos dos por semana con todos
          los grupos musculares <Ref n={6} />.
        </p>
      </section>

      <section class="card">
        <h2>Progresión: cuánto subir</h2>
        <p>
          Si completás 5×5 en un ejercicio, la próxima vez sube <strong>{fmtKg(s.increments.squat)} kg</strong> (peso muerto{' '}
          <strong>{fmtKg(s.increments.deadlift)} kg</strong>). Si fallás alguna repetición, se repite el peso.
        </p>
        <p>
          StrongLifts propone 2.5–5 kg para músculos grandes (sentadilla, peso muerto) y 1.25–2.5 kg para pequeños (banca, press militar, remo) <Ref n={1} />.
          El ACSM 2009 recomienda subir la carga un 2–10%, menos en ejercicios de músculos pequeños <Ref n={5} />.
        </p>
        <p class="verdict">
          Con tus pesos actuales:{' '}
          {LIFT_IDS.map((l) => {
            const w = nextWeight(l, store.history, s).weight;
            return `${LIFTS[l].name} ${fmtKg(w)} kg → +${Math.round((s.increments[l] / w) * 100)}%`;
          }).join(' · ')}
          . Por encima del 10%, el aumento es grande para ese ejercicio: si se estanca, bajá su incremento a 1.25 kg en Ajustes (necesitás discos de 0.625
          kg).
        </p>
        <p>
          Una diferencia honesta: el ACSM sube la carga recién cuando hacés 1–2 repeticiones de más en dos sesiones seguidas <Ref n={5} />. StrongLifts sube
          cada vez que completás las repeticiones. Es más agresivo, y funciona porque los principiantes progresan rápido <Ref n={1} />. Cuando dejes de
          progresar sesión a sesión, es señal de pasar a un programa intermedio.
        </p>
      </section>

      <section class="card">
        <h2>Fallos y descarga</h2>
        <p>
          Si fallás <strong>{s.failuresBeforeDeload} sesiones seguidas</strong> con el mismo peso, la siguiente baja un <strong>{s.deloadPercent}%</strong>{' '}
          (redondeado a 2.5 kg) <Ref n={4} />. Si saltás un ejercicio entero, no cuenta como fallo.
        </p>
        <p class="verdict">
          Esto es una convención del programa, no un resultado de investigación. Bajar el peso te da unas semanas para volver a subir con mejor técnica y
          menos fatiga acumulada. La actualización del ACSM de 2026 incluso dice que la progresión no es imprescindible para obtener beneficios <Ref n={6} />.
        </p>
      </section>

      <section class="card">
        <h2>Descanso entre series</h2>
        <p>Qué dicen las fuentes:</p>
        <ul>
          <li>
            <strong>StrongLifts:</strong> 1–2 min tras series fáciles, unos 3 min en general, 5 min si costó llegar a 5 <Ref n={1} />. La app oficial usa 3 min
            tras una serie lograda y 5 tras un fallo, y no descansa tras la última serie de un ejercicio <Ref n={3} />.
          </li>
          <li>
            <strong>ACSM 2009:</strong> al menos 2–3 min en ejercicios principales con carga pesada (sentadilla, banca), 1–2 min en accesorios <Ref n={5} />.
          </li>
          <li>
            <strong>Grgic et al. 2018</strong> (revisión, 23 estudios): con descansos cortos también se gana fuerza. En personas no entrenadas, 60–120 s
            alcanzan; en entrenadas, más de 2 min maximiza la fuerza <Ref n={7} />.
          </li>
          <li>
            <strong>de Salles et al. 2009:</strong> 3–5 min permiten más repeticiones en series múltiples con cargas del 50–90% del máximo <Ref n={8} />.
          </li>
          <li>
            <strong>ACSM 2026</strong> (revisión de revisiones): la fuerza no se vio afectada por descansos cortos (&lt;1 min) frente a largos (&gt;1 min). Los 2–3
            min aparecen como guía previa, no como recomendación actual <Ref n={6} />.
          </li>
        </ul>
        <p class="verdict">
          La app usa <strong>{clock(s.restSuccessSec)}</strong> por defecto: el piso del rango del ACSM 2009, el techo de lo suficiente para no entrenados
          según Grgic, y compatible con la evidencia más reciente. Si la serie costó, el temporizador avisa otra vez a <strong>{clock(s.restHardSec)}</strong>{' '}
          (lo que hace StrongLifts). Tras un fallo, <strong>{clock(s.restFailSec)}</strong>. Tras la última serie de un ejercicio no hay temporizador: la
          entrada en calor del siguiente hace de transición.
        </p>
        <p>
          Cuando las cargas sean realmente pesadas y empiecen los fallos, alargar el descanso a 3 min es lo que respaldan la mayoría de las fuentes <Ref n={1} />{' '}
          <Ref n={7} /> <Ref n={8} />.
        </p>
      </section>

      <section class="card">
        <h2>Entrada en calor</h2>
        <p>
          Método StrongLifts <Ref n={1} /> <Ref n={2} />:
        </p>
        <ul>
          <li>2 series de 5 con la barra sola (sentadilla, banca, press militar).</li>
          <li>Remo y peso muerto arrancan desde el piso con 30 y 40 kg, porque la barra sola queda demasiado baja.</li>
          <li>Luego series de 5 subiendo hasta {MAX_WARMUP_JUMP} kg por vez, hasta el peso de trabajo.</li>
          <li>Sin descanso entre series de calentamiento: cargás discos y seguís. Solo se descansa antes de la primera serie de trabajo.</li>
          <li>Si el peso de trabajo es la barra sola, no hay entrada en calor.</li>
          <li>
            <strong>Peso muerto: al menos {MIN_WARMUP_SETS.deadlift} series</strong>, repartidas en partes iguales desde 40 kg.
          </li>
        </ul>
        <p class="verdict">
          Las {MIN_WARMUP_SETS.deadlift} series del peso muerto son una elección de esta app, no de StrongLifts (que con saltos de 10–20 kg desde 40 kg usaría 2 o 3 con pesos medios{' '}
          <Ref n={1} />
          ). Como hay una sola serie de trabajo, la entrada en calor es la única práctica del movimiento en la sesión, y llegar con saltos chicos a un
          peso cercano al de trabajo es lo que la revisión de 2021 asocia con mejor rendimiento en fuerza máxima <Ref n={10} />. Cuesta unos 2 minutos
          más.
        </p>
        <p>Cuanto más pesado, más series de calentamiento. La app las calcula sola en “Entrada en calor y discos”, debajo de cada ejercicio.</p>
        <p class="verdict">
          La evidencia es mixta. Ribeiro et al. 2014 no encontraron diferencias en las repeticiones hechas con o sin entrada en calor específica <Ref n={9} />.
          Una revisión de 2021 sugiere que calentar cerca del peso máximo puede ayudar en fuerza máxima, sin consenso <Ref n={10} />. El ACSM 2026 no la trata{' '}
          <Ref n={6} />. Su valor práctico es ensayar la técnica con el patrón exacto del ejercicio. Por eso la app no agrega series de más.
        </p>
      </section>

      <section class="card">
        <h2>Duración estimada</h2>
        <p>
          Con tus pesos actuales: <strong>A ≈ {minutes('A', store, s)} min</strong>, <strong>B ≈ {minutes('B', store, s)} min</strong>.
        </p>
        <table>
          <thead>
            <tr>
              <th>Descanso</th>
              <th>Workout A</th>
              <th>Workout B</th>
            </tr>
          </thead>
          <tbody>
            {restOptions.map((r) => {
              const alt = { ...s, restSuccessSec: r };
              return (
                <tr key={r}>
                  <td>
                    {clock(r)}
                    {r === s.restSuccessSec && ' (actual)'}
                  </td>
                  <td>{minutes('A', store, alt)} min</td>
                  <td>{minutes('B', store, alt)} min</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p class="muted small">
          Supone {SET_SEC} s por serie de 5, {WARMUP_SET_SEC} s por serie de calentamiento (incluye cambiar discos), {BEFORE_WORK_SEC} s antes de la
          primera serie de trabajo, y que todas las series salen. Cada serie fallida suma {clock(s.restFailSec - s.restSuccessSec)}. Al subir los pesos hay
          más series de calentamiento, así que la duración crece de a poco.
        </p>
      </section>

      <section class="card">
        <h2>Fuentes</h2>
        <ol class="refs">
          {REFS.map((r) => (
            <li key={r.id} id={`ref-${r.id}`}>
              {r.text}{' '}
              <a href={r.url} target="_blank" rel="noreferrer">
                Enlace
              </a>
            </li>
          ))}
        </ol>
        <p class="muted small">
          {Object.values(LIFTS).length} ejercicios, 2 rutinas. Este programa es para adultos sanos; si tenés una lesión o condición médica, consultá a un
          profesional.
        </p>
      </section>
    </div>
  );
}
