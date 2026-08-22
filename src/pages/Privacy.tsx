import { legalConfig } from '../data/legal'
import {
  LegalDocument,
  LegalList,
  LegalSection,
  MetadataLine,
  type TocItem,
} from '../components/legal/LegalDocument'

const privacyEmail = 'aristapartnerscl@gmail.com'
const publicWebsite = 'https://www.aristapartners.cl'

const toc: TocItem[] = [
  { id: 'responsable', label: 'Responsable del tratamiento' },
  { id: 'alcance', label: 'Alcance de la política' },
  { id: 'datos', label: 'Datos que pueden recopilarse' },
  { id: 'origen', label: 'Origen de los datos' },
  { id: 'finalidades', label: 'Finalidades del tratamiento' },
  { id: 'fundamentos', label: 'Bases o fundamentos' },
  { id: 'formularios', label: 'Datos recibidos por formularios' },
  { id: 'oportunidades', label: 'Oportunidades comerciales' },
  { id: 'proveedores', label: 'Proveedores tecnológicos' },
  { id: 'transferencias', label: 'Infraestructura internacional' },
  { id: 'conservacion', label: 'Conservación de datos' },
  { id: 'seguridad', label: 'Seguridad y confidencialidad' },
  { id: 'derechos', label: 'Derechos de las personas' },
  { id: 'procedimiento', label: 'Procedimiento para ejercer derechos' },
  { id: 'menores', label: 'Menores de edad' },
  { id: 'enlaces', label: 'Enlaces externos' },
  { id: 'cookies', label: 'Cookies y tecnologías similares' },
  { id: 'modificaciones', label: 'Modificaciones' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'vigencia', label: 'Vigencia y versión' },
]

export function Privacy() {
  return (
    <LegalDocument
      eyebrow="Privacidad y datos personales"
      title="Política de Privacidad"
      intro="Esta política informa cómo Arista Partners SpA trata los datos personales que pueden entregarse mediante la web pública de Arista Partners, conforme al comportamiento actualmente implementado en el sitio."
      toc={toc}
    >
      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <dl className="grid gap-2 rounded-md bg-surface-muted p-4 text-sm">
          <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
            <dt className="font-semibold text-graphite">Responsable</dt>
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
            <dt className="font-semibold text-graphite">Contacto y privacidad</dt>
            <dd>
              <a className="font-semibold text-brand hover:text-graphite" href={`mailto:${privacyEmail}`}>
                {privacyEmail}
              </a>
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection id="alcance" title="2. Alcance de la política">
        <p>
          Esta política se aplica a la web pública de Arista Partners y a los formularios de contacto, compra, venta y
          proveedor disponibles en ella. La web es informativa y B2B: el envío de un formulario permite solicitar una
          evaluación o gestión comercial, pero no implica contratación, aceptación automática, pago ni cierre de
          operaciones directamente en el sitio.
        </p>
      </LegalSection>

      <LegalSection id="datos" title="3. Datos que pueden recopilarse">
        <p>Según el formulario utilizado y la información que entregue la persona solicitante, pueden recopilarse:</p>
        <LegalList
          items={[
            'Nombre.',
            'Empresa, organización, marca o actividad.',
            'Cargo o actividad.',
            'Correo electrónico.',
            'Telefono o WhatsApp.',
            'País, región y ciudad.',
            'Sitio web, Instagram o red social cuando el formulario lo solicita.',
            'Necesidades de compra, productos o servicios requeridos, volumen, presupuesto, moneda, plazo, lugar de entrega y existencia de cotizaciones.',
            'Productos o servicios ofrecidos, tipo de cliente buscado, cobertura, capacidad, precios o rangos referenciales, canales y diferenciadores.',
            'Información para proveedores, incluyendo categorías, cobertura, capacidad, venta mínima, emisión de factura, condiciones comerciales e información adicional.',
            'Mensajes, consultas, solicitudes, asunto, motivo de contacto y preferencia de contacto.',
            'Consentimiento de contacto, consentimiento opcional para recibir información relacionada con oportunidades y servicios, versión de la política aceptada, tipo de formulario y estado administrativo de la solicitud.',
            'Datos técnicos estrictamente necesarios para seguridad y operación, como token de verificación Turnstile, origen permitido, hostname validado por Turnstile y user agent limitado.',
          ]}
        />
        <p>
          El campo técnico reservado para hash de IP existe en la estructura de recepción, pero el código actualmente
          guarda ese valor como nulo.
        </p>
      </LegalSection>

      <LegalSection id="origen" title="4. Origen de los datos">
        <p>
          Los datos provienen principalmente de la información que la persona entrega voluntariamente al completar los
          formularios públicos. Adicionalmente, se tratan datos técnicos generados durante la operación del sitio y la
          verificación de seguridad del envío.
        </p>
      </LegalSection>

      <LegalSection id="finalidades" title="5. Finalidades del tratamiento">
        <LegalList
          items={[
            'Responder consultas.',
            'Evaluar solicitudes recibidas.',
            'Gestionar oportunidades comerciales de compra, venta o proveedor.',
            'Contactar al solicitante por el medio indicado o por los datos entregados.',
            'Organizar y hacer seguimiento de una solicitud.',
            'Prevenir abuso, spam y envíos automatizados.',
            'Mantener trazabilidad y seguridad operativa.',
            'Cumplir obligaciones legales o atender reclamaciones cuando corresponda.',
          ]}
        />
      </LegalSection>

      <LegalSection id="fundamentos" title="6. Bases o fundamentos del tratamiento">
        <p>
          El tratamiento se funda en la autorización entregada por la persona al enviar el formulario, en la necesidad de
          responder o evaluar la solicitud presentada, en intereses legítimos vinculados a seguridad, trazabilidad y
          gestión operativa, y en el cumplimiento de obligaciones legales cuando corresponda.
        </p>
        <p>
          La redacción considera la Ley N.º 19.628 sobre Protección de la Vida Privada, vigente a la fecha de esta
          versión, y la Ley N.º 21.719, que moderniza la protección de datos personales y entra en vigor el 1 de
          diciembre de 2026.
        </p>
      </LegalSection>

      <LegalSection id="formularios" title="7. Datos recibidos mediante formularios">
        <p>
          Los formularios públicos envían una solicitud a la función segura de Supabase denominada
          <span className="font-semibold text-graphite"> submit-public-form</span>. La solicitud incluye el tipo de
          formulario, el contenido del formulario, consentimiento de contacto, consentimiento opcional para información
          relacionada con oportunidades y servicios, versión de privacidad, token Turnstile y un campo honeypot vacío
          usado para detectar envíos automatizados.
        </p>
        <h3 className="text-lg font-semibold text-graphite">Validaciones implementadas</h3>
        <LegalList
          items={[
            'El consentimiento de contacto es obligatorio para enviar.',
            'El consentimiento opcional no viene marcado por defecto.',
            'Se validan campos obligatorios, formato de correo, teléfono, URL, moneda y largo máximo de textos.',
            'Los campos no permitidos son rechazados.',
            'Si el honeypot viene completo, la solicitud se trata como envío no deseado.',
          ]}
        />
      </LegalSection>

      <LegalSection id="oportunidades" title="8. Evaluación y gestión de oportunidades comerciales">
        <p>
          Las solicitudes recibidas se registran inicialmente como formularios en estado administrativo de recepción. En
          el panel privado pueden revisarse y, cuando corresponda, convertirse en contactos, consultas, oportunidades o
          perfiles de proveedor. Esta conversión no equivale a aceptación comercial, contratación ni cierre de una
          operación.
        </p>
      </LegalSection>

      <LegalSection id="proveedores" title="9. Proveedores tecnológicos">
        <p>La web utiliza o está preparada para utilizar los siguientes proveedores en funciones técnicas:</p>
        <LegalList
          items={[
            'Supabase: infraestructura de base de datos, autenticación, recepción segura mediante Edge Function y almacenamiento administrativo.',
            'Cloudflare Turnstile: prevención de bots, spam y abuso en formularios públicos cuando la recepción digital está habilitada.',
            'Vercel: alojamiento y distribución de la aplicación web.',
          ]}
        />
        <p>Las políticas oficiales de estos proveedores pueden revisarse en:</p>
        <ul className="grid gap-2">
          <li>
            <a className="font-semibold text-brand hover:text-graphite" href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Supabase
            </a>
          </li>
          <li>
            <a className="font-semibold text-brand hover:text-graphite" href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
              Política de privacidad de Cloudflare
            </a>
          </li>
          <li>
            <a className="font-semibold text-brand hover:text-graphite" href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">
              Aviso de privacidad de Vercel
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="transferencias" title="10. Transferencias y tratamiento mediante infraestructura internacional">
        <p>
          Los proveedores tecnológicos indicados pueden procesar información mediante infraestructura ubicada fuera de
          Chile, bajo sus propias condiciones, acuerdos y mecanismos de seguridad aplicables. Arista Partners no publica
          ubicaciones exactas de servidores porque no se encuentran definidas en el codigo del sitio.
        </p>
      </LegalSection>

      <LegalSection id="conservacion" title="11. Conservación de datos">
        <LegalList
          items={[
            'Formularios que no originen una relación u oportunidad comercial: hasta 24 meses desde la última interacción.',
            'Spam, pruebas, solicitudes rechazadas o datos innecesarios: pueden eliminarse o anonimizarse anticipadamente.',
            'Datos convertidos en contactos, consultas u oportunidades: durante la gestión comercial y posteriormente mientras exista finalidad contractual, trazabilidad, defensa jurídica u obligación legal.',
            'Registros técnicos y de seguridad: solo durante el periodo necesario para operación, prevención de abuso y cumplimiento.',
          ]}
        />
        <p>
          El código inspeccionado no implementa borrado automático de estos plazos. Los criterios anteriores son una
          política de conservación y su automatización técnica, si se requiere, deberá implementarse separadamente.
        </p>
        <p>
          Las solicitudes de eliminación se atenderán salvo que exista una obligación legal, contractual o necesidad
          legítima de conservación debidamente aplicable.
        </p>
      </LegalSection>

      <LegalSection id="seguridad" title="12. Seguridad y confidencialidad">
        <p>
          El sitio incorpora validaciones de formularios, control de origen permitido, verificación Turnstile cuando la
          recepción digital está habilitada, límites de tamaño y tipo de datos, almacenamiento en Supabase y acceso
          administrativo restringido mediante autenticación. Las personas que gestionen solicitudes deben tratar la
          información con confidencialidad y usarla solo para las finalidades indicadas.
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="13. Derechos de las personas">
        <p>Según la normativa aplicable, las personas pueden solicitar:</p>
        <LegalList
          items={[
            'Información y acceso a sus datos.',
            'Rectificación o actualización.',
            'Eliminación o cancelación cuando corresponda.',
            'Bloqueo u oposición cuando proceda.',
            'Retiro del consentimiento para tratamientos sustentados en él.',
            'Información sobre destinatarios y finalidad del tratamiento.',
          ]}
        />
      </LegalSection>

      <LegalSection id="procedimiento" title="14. Procedimiento para ejercer derechos">
        <p>
          Las solicitudes deben enviarse a{' '}
          <a className="font-semibold text-brand hover:text-graphite" href={`mailto:${privacyEmail}`}>
            {privacyEmail}
          </a>
          . La solicitud debe permitir verificar razonablemente la identidad de quien la presenta. Si fuera necesario
          para evitar entregar o modificar información de otra persona, Arista Partners podrá pedir antecedentes mínimos
          y proporcionales para confirmar la identidad o representación.
        </p>
      </LegalSection>

      <LegalSection id="menores" title="15. Menores de edad">
        <p>
          Los servicios están orientados a contactos profesionales, empresas y personas con capacidad para realizar
          solicitudes comerciales. Arista Partners no busca recopilar deliberadamente información de menores de edad.
        </p>
      </LegalSection>

      <LegalSection id="enlaces" title="16. Enlaces externos">
        <p>
          La web puede incluir enlaces a sitios externos. Esos sitios tienen sus propias políticas y prácticas, que no
          son controladas por Arista Partners.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="17. Cookies y tecnologías similares">
        <p>
          En el código inspeccionado no se incorporan Google Analytics, Meta Pixel, newsletter ni herramientas de
          publicidad personalizada. Sin embargo, pueden existir tecnologías estrictamente necesarias para seguridad,
          funcionamiento y prevención de abuso, incluyendo las asociadas a Cloudflare Turnstile, Supabase y Vercel.
        </p>
        <p>
          Si en el futuro se incorporan herramientas de analítica o publicidad, esta política se actualizará y se
          implementarán los mecanismos de información o consentimiento que correspondan antes de activarlas.
        </p>
      </LegalSection>

      <LegalSection id="modificaciones" title="18. Modificaciones de la política">
        <p>
          Arista Partners podrá actualizar esta política para reflejar cambios normativos, técnicos u operativos. La
          version vigente sera la publicada en esta pagina.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="19. Contacto">
        <p>
          Para consultas sobre esta política o sobre el tratamiento de datos personales, escribe a{' '}
          <a className="font-semibold text-brand hover:text-graphite" href={`mailto:${privacyEmail}`}>
            {privacyEmail}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="vigencia" title="20. Fecha de vigencia y version">
        <MetadataLine version={legalConfig.privacy.version} effectiveDate={legalConfig.privacy.effectiveDate} />
      </LegalSection>
    </LegalDocument>
  )
}
