import { Link } from 'react-router-dom'
import { legalConfig } from '../data/legal'
import {
  LegalDocument,
  LegalList,
  LegalSection,
  MetadataLine,
  type TocItem,
} from '../components/legal/LegalDocument'

const publicWebsite = 'https://www.aristapartners.cl'
const contactEmail = 'aristapartnerscl@gmail.com'

const toc: TocItem[] = [
  { id: 'identificacion', label: 'Identificación del sitio' },
  { id: 'objeto', label: 'Objeto y alcance' },
  { id: 'aceptacion', label: 'Aceptación de los términos' },
  { id: 'naturaleza', label: 'Naturaleza informativa' },
  { id: 'servicios', label: 'Servicios presentados' },
  { id: 'solicitudes', label: 'Envío y evaluación' },
  { id: 'sin-contratacion', label: 'Sin contratación automática' },
  { id: 'formalizacion', label: 'Formalización comercial' },
  { id: 'obligaciones', label: 'Obligaciones del usuario' },
  { id: 'leads', label: 'Leads y bases comerciales' },
  { id: 'intermediacion', label: 'Intermediación y terceros' },
  { id: 'honorarios', label: 'Honorarios y comisiones' },
  { id: 'resultados', label: 'Sin garantía de resultados' },
  { id: 'informacion', label: 'Información y disponibilidad' },
  { id: 'propiedad', label: 'Propiedad intelectual' },
  { id: 'uso', label: 'Uso permitido' },
  { id: 'enlaces', label: 'Enlaces y terceros' },
  { id: 'seguridad', label: 'Disponibilidad y seguridad' },
  { id: 'alcance-responsable', label: 'Limitación responsable' },
  { id: 'privacidad', label: 'Datos personales' },
  { id: 'modificaciones', label: 'Modificaciones' },
  { id: 'legislacion', label: 'Legislación aplicable' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'vigencia', label: 'Vigencia y versión' },
]

export function Terms() {
  return (
    <LegalDocument
      eyebrow="Condiciones de uso"
      title="Términos y Condiciones"
      intro="Estos términos regulan el uso de la web pública de Arista Partners y la recepción de consultas o antecedentes para evaluación comercial. No constituyen el contrato completo de representación, intermediación o gestión comercial."
      toc={toc}
    >
      <LegalSection id="identificacion" title="1. Identificación del sitio">
        <dl className="grid gap-2 rounded-md bg-surface-muted p-4 text-sm">
          <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
            <dt className="font-semibold text-graphite">Prestador</dt>
            <dd>Arista Partners SpA</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
            <dt className="font-semibold text-graphite">Sitio web</dt>
            <dd>
              <a className="font-semibold text-brand hover:text-graphite" href={publicWebsite}>
                {publicWebsite}
              </a>
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
            <dt className="font-semibold text-graphite">Correo</dt>
            <dd>
              <a className="font-semibold text-brand hover:text-graphite" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection id="objeto" title="2. Objeto y alcance">
        <p>
          Estos términos establecen condiciones generales para navegar la web, revisar la información publicada y enviar
          consultas o antecedentes para una evaluación inicial. Las condiciones económicas, operativas y comerciales de
          una eventual gestión deberán acordarse posteriormente en documentos separados.
        </p>
      </LegalSection>

      <LegalSection id="aceptacion" title="3. Aceptación de los términos">
        <p>
          Al usar el sitio o enviar un formulario, la persona declara conocer estos términos en lo que resulte aplicable
          a esa interacción. Si actúa por una empresa u organización, declara contar con facultades o autorización
          suficiente para entregar los antecedentes correspondientes.
        </p>
      </LegalSection>

      <LegalSection id="naturaleza" title="4. Naturaleza informativa de la web">
        <p>
          La web es informativa y está orientada principalmente a relaciones comerciales B2B. Permite enviar consultas y
          antecedentes para evaluación, pero no permite contratar automáticamente, no procesa pagos, no formaliza acuerdos
          comerciales y no garantiza aceptación de solicitudes.
        </p>
      </LegalSection>

      <LegalSection id="servicios" title="5. Servicios presentados">
        <p>El sitio describe, de manera general, servicios y capacidades efectivamente presentados en la web pública:</p>
        <LegalList
          items={[
            'Representación e intermediación comercial.',
            'Búsqueda, evaluación y comparación de proveedores.',
            'Desarrollo comercial y desarrollo de oportunidades B2B.',
            'Exploración o conversión de ofertas B2C hacia canales empresariales.',
            'Gestión, seguimiento, negociación y apoyo comercial según el alcance acordado.',
            'Gestión y cierre comercial como parte posible de una representación o gestión acordada, no como una promesa autónoma de resultado.',
          ]}
        />
      </LegalSection>

      <LegalSection id="solicitudes" title="6. Envío y evaluación de solicitudes">
        <p>
          Los formularios de contacto, compra, venta y proveedor permiten presentar antecedentes para revisión. Arista
          Partners puede solicitar información adicional, priorizar, rechazar, archivar o no continuar una solicitud
          cuando no exista encaje comercial, información suficiente o condiciones razonables para avanzar.
        </p>
      </LegalSection>

      <LegalSection id="sin-contratacion" title="7. Ausencia de contratación automática">
        <p>El envío de un formulario no debe considerarse:</p>
        <LegalList
          items={[
            'Contratación.',
            'Aceptación de una propuesta.',
            'Mandato comercial.',
            'Representación automática.',
            'Exclusividad.',
            'Reserva de capacidad.',
            'Garantía de resultados.',
            'Obligación de iniciar gestiones.',
            'Acuerdo sobre honorarios o comisiones.',
          ]}
        />
      </LegalSection>

      <LegalSection id="formalizacion" title="8. Proceso de formalización comercial">
        <p>
          Toda relación comercial deberá formalizarse posteriormente mediante propuesta, cotización, orden de servicio,
          contrato o acuerdo comercial separado, según corresponda. Ese documento podrá definir alcance, actividades,
          responsabilidades, confidencialidad, condiciones económicas, atribución, exclusividad, plazos y forma de
          término.
        </p>
      </LegalSection>

      <LegalSection id="obligaciones" title="9. Obligaciones de quien envía información">
        <LegalList
          items={[
            'Proporcionar información verdadera, actualizada y pertinente.',
            'Tener autorización para compartir datos de empresas, contactos o terceros.',
            'No suplantar identidades ni atribuirse representación inexistente.',
            'No enviar malware, spam, contenido ilícito o información sensible innecesaria.',
            'No utilizar la web para extracción automatizada, abuso o interferencia técnica.',
            'Actualizar o corregir antecedentes relevantes cuando sea necesario.',
          ]}
        />
      </LegalSection>

      <LegalSection id="leads" title="10. Tratamiento de leads, prospectos y bases comerciales">
        <p>
          Entregar un contacto, prospecto o base comercial no significa que los registros sean leads calificados ni que
          Arista Partners deba iniciar gestiones sobre ellos.
        </p>
        <h3 className="text-lg font-semibold text-graphite">Tipos de antecedentes comerciales</h3>
        <LegalList
          items={[
            'Contacto frío: registro identificado sin validación suficiente de interés, necesidad o disposición comercial.',
            'Contacto identificado: registro con datos básicos y posible relación con una oportunidad, pendiente de revisión.',
            'Lead calificado: antecedente que, tras revisión, presenta mejor encaje con una necesidad, oferta o gestión concreta.',
          ]}
        />
        <h3 className="text-lg font-semibold text-graphite">Procedencia y autorización</h3>
        <LegalList
          items={[
            'Quien proporciona una base debe contar con autorización, fundamento o legitimidad suficiente para recopilarla y compartirla.',
            'No deben entregarse datos obtenidos ilícitamente, datos sensibles innecesarios ni información que vulnere derechos de terceros.',
            'Arista puede rechazar antecedentes cuya procedencia, calidad o autorización no pueda verificarse razonablemente.',
            'La evaluación de datos no obliga a iniciar gestiones.',
            'El alcance, priorización y tratamiento comercial se acordarán por separado.',
          ]}
        />
      </LegalSection>

      <LegalSection id="intermediacion" title="11. Intermediación y participación de terceros">
        <p>
          Arista Partners puede participar como intermediario activo, representante o gestor, según el acuerdo particular.
          Los compradores, vendedores, proveedores y demás terceros conservan responsabilidad por sus productos,
          servicios, precios, información, capacidad y cumplimiento.
        </p>
        <LegalList
          items={[
            'Arista no se convierte automáticamente en fabricante, vendedor, comprador, importador, distribuidor, empleador, socio ni apoderado jurídico de terceros.',
            'La verificación técnica, financiera, tributaria, sanitaria, regulatoria o jurídica de una operación dependerá del alcance pactado.',
            'Ninguna presentación o contacto implica recomendación absoluta o garantía sobre un tercero.',
          ]}
        />
      </LegalSection>

      <LegalSection id="honorarios" title="12. Honorarios, fees y comisiones">
        <p>
          No existen porcentajes públicos fijos. Honorarios, fee mensual, comisión, moneda, impuestos, hitos, atribución,
          exclusividad y forma de pago se definen por escrito según cada caso.
        </p>
        <h3 className="text-lg font-semibold text-graphite">Criterios que pueden considerarse</h3>
        <LegalList
          items={[
            'Ticket o valor esperado de la oportunidad.',
            'Volumen, complejidad y carga de trabajo.',
            'Origen, calidad y madurez de la oportunidad.',
            'Dificultad del cierre y nivel de seguimiento requerido.',
          ]}
        />
        <p>Ninguna cifra o condición económica se considera acordada hasta quedar formalizada por escrito.</p>
      </LegalSection>

      <LegalSection id="resultados" title="13. Ausencia de garantía de resultados">
        <p>
          Las gestiones comerciales dependen de factores fuera del control de Arista Partners, incluyendo decisiones de
          terceros, disponibilidad, precios, condiciones comerciales, tiempos de respuesta y evaluaciones internas de las
          partes. Por eso no se garantizan ventas, contratos, compradores, proveedores, cotizaciones, reuniones,
          respuestas ni resultados económicos.
        </p>
      </LegalSection>

      <LegalSection id="informacion" title="14. Información, cotizaciones y disponibilidad">
        <p>
          La información publicada en el sitio es general y puede cambiar. Cualquier cotización, disponibilidad,
          condición técnica o comercial de terceros deberá confirmarse antes de tomar decisiones o formalizar una
          operación. Arista puede ordenar o transmitir antecedentes, pero cada parte debe revisar la información que le
          resulte relevante.
        </p>
      </LegalSection>

      <LegalSection id="propiedad" title="15. Propiedad intelectual">
        <LegalList
          items={[
            'Salvo contenido de terceros, la marca, logo, textos, diseño, estructura, gráficos y materiales de Arista están protegidos.',
            'La visita al sitio no concede licencias de explotación sobre esos contenidos.',
            'Se permite visualizar el sitio y compartir enlaces para fines legítimos.',
            'No se permite copiar, explotar, alterar o presentar contenido como propio sin autorización.',
            'Los materiales entregados por usuarios o terceros continúan perteneciendo a sus respectivos titulares.',
          ]}
        />
      </LegalSection>

      <LegalSection id="uso" title="16. Uso permitido y conductas prohibidas">
        <p>El sitio debe utilizarse de manera lícita, razonable y compatible con su finalidad informativa y comercial.</p>
        <LegalList
          items={[
            'No interferir con la seguridad, disponibilidad o funcionamiento del sitio.',
            'No intentar acceder a áreas privadas, sistemas administrativos o datos no destinados al público.',
            'No enviar formularios automatizados, abusivos, falsos o engañosos.',
            'No usar el sitio para actividades ilícitas, spam, scraping abusivo o vulneración de derechos de terceros.',
          ]}
        />
      </LegalSection>

      <LegalSection id="enlaces" title="17. Enlaces y servicios de terceros">
        <p>
          El sitio puede contener enlaces a páginas o servicios de terceros. Arista Partners no controla sus contenidos,
          disponibilidad, políticas ni prácticas, por lo que cada persona debe revisar las condiciones aplicables al sitio
          externo que visite.
        </p>
      </LegalSection>

      <LegalSection id="seguridad" title="18. Disponibilidad y seguridad del sitio">
        <p>
          Arista Partners puede modificar, suspender o interrumpir temporalmente el sitio por mantenimiento, mejoras,
          fallas técnicas o razones de seguridad. Se aplican medidas razonables para operar la web y prevenir abuso, sin
          prometer disponibilidad permanente o seguridad absoluta.
        </p>
      </LegalSection>

      <LegalSection id="alcance-responsable" title="19. Limitación responsable de alcance">
        <p>
          Arista Partners responderá conforme a la legislación aplicable y a los acuerdos específicos que celebre. Estos
          términos no buscan excluir derechos irrenunciables ni responsabilidades que no puedan limitarse legalmente. La
          información del sitio no sustituye asesoría legal, tributaria, financiera, técnica, sanitaria o regulatoria
          especializada.
        </p>
      </LegalSection>

      <LegalSection id="privacidad" title="20. Protección de datos personales">
        <p>
          El tratamiento de datos personales se rige por la{' '}
          <Link to="/privacidad" className="font-semibold text-brand hover:text-graphite">
            Política de Privacidad
          </Link>
          . Estos términos no duplican esa política y deben leerse de forma complementaria con los consentimientos de los
          formularios públicos.
        </p>
      </LegalSection>

      <LegalSection id="modificaciones" title="21. Modificaciones de los términos">
        <p>
          Arista Partners podrá actualizar estos términos para reflejar cambios normativos, técnicos, comerciales u
          operativos. La versión vigente será la publicada en esta página. Los cambios no alterarán retroactivamente
          acuerdos específicos ya formalizados, salvo aceptación de las partes o fundamento legal aplicable.
        </p>
      </LegalSection>

      <LegalSection id="legislacion" title="22. Legislación aplicable">
        <p>
          Estos términos se rigen por la legislación chilena. Las controversias se someterán a los tribunales competentes
          conforme a las reglas aplicables, sin renunciar a derechos irrenunciables que pudieran corresponder legalmente.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="23. Contacto">
        <p>
          Para consultas sobre estos términos, escribe a{' '}
          <a className="font-semibold text-brand hover:text-graphite" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="vigencia" title="24. Vigencia y versión">
        <MetadataLine version={legalConfig.terms.version} effectiveDate={legalConfig.terms.effectiveDate} />
      </LegalSection>
    </LegalDocument>
  )
}
