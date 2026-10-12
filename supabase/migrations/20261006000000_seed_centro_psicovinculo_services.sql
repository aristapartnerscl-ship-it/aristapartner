do $$
declare
  v_company_id uuid;
  v_company_count integer;
begin
  select count(*) into v_company_count
  from public.represented_companies
  where lower(btrim(name)) in (
    lower(btrim('Centro Psicovínculo')),
    lower(btrim('Centro psicovinculo'))
  );

  if v_company_count = 0 then
    raise exception 'Centro Psicovínculo not found';
  end if;

  if v_company_count > 1 then
    raise exception 'Centro Psicovínculo is ambiguous';
  end if;

  select id into v_company_id
  from public.represented_companies
  where lower(btrim(name)) in (
    lower(btrim('Centro Psicovínculo')),
    lower(btrim('Centro psicovinculo'))
  );

  insert into public.represented_company_services (
    represented_company_id,
    name,
    priority,
    short_description,
    problem_statement,
    discovery_questions,
    required_information,
    suggested_pitch,
    restrictions,
    display_order
  )
  select v_company_id, seed.name, seed.priority, seed.short_description, seed.problem_statement,
    seed.discovery_questions, seed.required_information, seed.suggested_pitch, seed.restrictions, seed.display_order
  from (values
    ('Reclutamiento y Selección', 'A', 'Apoyo desde la definición del perfil hasta la evaluación y presentación de candidatos.', 'Vacantes difíciles, procesos poco estructurados y contratación masiva.', E'¿Qué cargo necesitan cubrir?\n¿Cuántas vacantes son?\n¿Hace cuánto están buscando?\n¿Tienen descriptor de cargo?\n¿Quién participa en la decisión?\n¿Cómo realizan actualmente el reclutamiento?\n¿Cuándo necesitan cubrir la vacante?', NULL, 'Podemos apoyar desde la definición del perfil hasta la evaluación y presentación de candidatos, adaptándonos al proceso que ya tenga la empresa.', 'No ofrecer una garantía de 30 días sin confirmar sus condiciones exactas.', 10),
    ('Consultoría RR.HH. / RR.HH. externo', 'A', 'Intervención puntual o acompañamiento continuo para ordenar y fortalecer la gestión de personas.', 'RR.HH. poco estructurado, documentación dispersa, procesos manuales y ausencia de indicadores.', E'¿Tienen un equipo dedicado exclusivamente a RR.HH.?\n¿Cómo gestionan contratos, anexos y documentación?\n¿Cómo accederían hoy a antecedentes ante una auditoría?\n¿Tienen indicadores de RR.HH.?\n¿Qué proceso les genera mayor carga administrativa?', NULL, 'Psicovínculo puede intervenir en un proceso puntual o acompañar de manera continua la gestión de RR.HH., dependiendo de cuánto necesite la empresa.', NULL, 20),
    ('HR Tech + IA / Automatización', 'A', 'Transformación de procesos de RR.HH. en herramientas y automatizaciones trazables.', 'Excel, correos, documentos dispersos, seguimiento manual y herramientas desconectadas.', E'¿Qué proceso de RR.HH. les consume más tiempo manualmente?\n¿Quién participa?\n¿Qué herramientas utilizan?\n¿Cuántas veces realizan ese proceso?\n¿Qué les gustaría automatizar?\n¿Qué información debe manejar la solución?', NULL, 'Primero entendemos el proceso de RR.HH. y después evaluamos si conviene transformarlo en una herramienta o automatización propia.', 'No venderlo simplemente como desarrollo de software.', 30),
    ('Capacitaciones', 'B', 'Diseño y ejecución de instancias de capacitación adaptadas al contexto del cliente.', NULL, NULL, 'Antes de derivar levantar temática, cantidad de participantes, duración, modalidad y ciudad si es presencial.', NULL, NULL, 40),
    ('Desarrollo Organizacional', 'B', 'Acompañamiento en liderazgo, feedback, clima, cultura y desarrollo de equipos.', 'Liderazgo, feedback, clima, conflictos, cultura y brechas de equipos.', E'¿Han medido clima?\n¿Sus jefaturas han recibido formación?\n¿Cómo entregan feedback?\n¿Tienen definidos misión, visión y valores?\n¿Qué problemas se repiten dentro de los equipos?', NULL, NULL, NULL, 50),
    ('Inclusión Laboral', 'B', 'Apoyo en accesibilidad, puestos de trabajo, sensibilización y acompañamiento.', 'Necesidades de accesibilidad, adaptación de descriptores, sensibilización y capacitación.', NULL, NULL, NULL, 'No interpretar normativa laboral frente al cliente. Consultas legales o técnicas deben derivarse a Psicovínculo.', 60),
    ('Evaluaciones / PsicoMatch', 'complementary', 'Evaluaciones, entrevistas e informes para procesos de selección internos.', 'Necesidad de evaluar candidatos, cargos o etapas específicas del proceso de selección.', E'¿Cuál es la cantidad de candidatos?\n¿Qué cargos se evaluarán?\n¿Qué tipo de evaluación requieren?\n¿En qué etapa está el proceso?\n¿Cuál es la fecha requerida?', NULL, NULL, NULL, 70)
  ) as seed(name, priority, short_description, problem_statement, discovery_questions, required_information, suggested_pitch, restrictions, display_order)
  on conflict (represented_company_id, (lower(btrim(name)))) do nothing;
end;
$$;
