create table public.represented_company_services (
  id uuid primary key default gen_random_uuid(),
  represented_company_id uuid not null references public.represented_companies(id) on delete cascade,
  name text not null,
  category text,
  priority text not null default 'C',
  is_active boolean not null default true,
  short_description text,
  problem_statement text,
  ideal_customer text,
  decision_makers text,
  opportunity_signals text,
  discovery_questions text,
  required_information text,
  suggested_pitch text,
  reference_price text,
  price_notes text,
  handoff_guidance text,
  restrictions text,
  display_order integer not null default 0,
  created_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint represented_company_services_name_check check (length(btrim(name)) > 0),
  constraint represented_company_services_priority_check check (priority in ('A', 'B', 'C', 'complementary'))
);

create index represented_company_services_company_idx
  on public.represented_company_services (represented_company_id, is_active, priority, display_order);

create unique index represented_company_services_company_name_unique_idx
  on public.represented_company_services (represented_company_id, lower(btrim(name)));

create trigger represented_company_services_set_updated_at
before update on public.represented_company_services
for each row execute function public.set_updated_at();

alter table public.represented_company_services enable row level security;
revoke all on public.represented_company_services from anon, authenticated;

create or replace function public.list_red_comercial_company_services(p_company_id uuid)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.is_red_comercial_admin() then to_jsonb(s)
    else to_jsonb(s) - 'reference_price' - 'price_notes'
  end
  from public.represented_company_services s
  where s.represented_company_id = p_company_id
    and (
      public.is_red_comercial_admin()
      or exists (
        select 1
        from public.represented_company_memberships m
        where m.represented_company_id = p_company_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
      )
    )
    and (public.is_red_comercial_admin() or s.is_active)
  order by
    case s.priority when 'A' then 1 when 'B' then 2 when 'C' then 3 else 4 end,
    s.display_order,
    s.name;
$$;

create or replace function public.create_red_comercial_company_service(p_company_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user_id is null or not public.is_red_comercial_admin() then
    raise exception 'REDCOM_ADMIN_REQUIRED';
  end if;
  if not exists (select 1 from public.represented_companies where id = p_company_id) then
    raise exception 'REDCOM_COMPANY_NOT_FOUND';
  end if;
  if nullif(btrim(p_payload->>'name'), '') is null then
    raise exception 'REDCOM_SERVICE_NAME_REQUIRED';
  end if;

  insert into public.represented_company_services (
    represented_company_id, name, category, priority, is_active,
    short_description, problem_statement, ideal_customer, decision_makers,
    opportunity_signals, discovery_questions, required_information,
    suggested_pitch, reference_price, price_notes, handoff_guidance,
    restrictions, display_order, created_by
  ) values (
    p_company_id, btrim(p_payload->>'name'), nullif(btrim(p_payload->>'category'), ''),
    coalesce(nullif(p_payload->>'priority', ''), 'C'),
    coalesce((p_payload->>'is_active')::boolean, true),
    nullif(btrim(p_payload->>'short_description'), ''), nullif(btrim(p_payload->>'problem_statement'), ''),
    nullif(btrim(p_payload->>'ideal_customer'), ''), nullif(btrim(p_payload->>'decision_makers'), ''),
    nullif(btrim(p_payload->>'opportunity_signals'), ''), nullif(btrim(p_payload->>'discovery_questions'), ''),
    nullif(btrim(p_payload->>'required_information'), ''), nullif(btrim(p_payload->>'suggested_pitch'), ''),
    nullif(btrim(p_payload->>'reference_price'), ''), nullif(btrim(p_payload->>'price_notes'), ''),
    nullif(btrim(p_payload->>'handoff_guidance'), ''), nullif(btrim(p_payload->>'restrictions'), ''),
    coalesce(nullif(p_payload->>'display_order', '')::integer, 0), v_user_id
  ) returning id into v_id;

  return (select to_jsonb(s) from public.represented_company_services s where s.id = v_id);
end;
$$;

create or replace function public.update_red_comercial_company_service(p_service_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.represented_company_services%rowtype;
begin
  if v_user_id is null or not public.is_red_comercial_admin() then
    raise exception 'REDCOM_ADMIN_REQUIRED';
  end if;

  update public.represented_company_services
  set
    name = coalesce(nullif(btrim(p_payload->>'name'), ''), name),
    category = case when p_payload ? 'category' then nullif(btrim(p_payload->>'category'), '') else category end,
    priority = coalesce(nullif(p_payload->>'priority', ''), priority),
    is_active = case when p_payload ? 'is_active' then (p_payload->>'is_active')::boolean else is_active end,
    short_description = case when p_payload ? 'short_description' then nullif(btrim(p_payload->>'short_description'), '') else short_description end,
    problem_statement = case when p_payload ? 'problem_statement' then nullif(btrim(p_payload->>'problem_statement'), '') else problem_statement end,
    ideal_customer = case when p_payload ? 'ideal_customer' then nullif(btrim(p_payload->>'ideal_customer'), '') else ideal_customer end,
    decision_makers = case when p_payload ? 'decision_makers' then nullif(btrim(p_payload->>'decision_makers'), '') else decision_makers end,
    opportunity_signals = case when p_payload ? 'opportunity_signals' then nullif(btrim(p_payload->>'opportunity_signals'), '') else opportunity_signals end,
    discovery_questions = case when p_payload ? 'discovery_questions' then nullif(btrim(p_payload->>'discovery_questions'), '') else discovery_questions end,
    required_information = case when p_payload ? 'required_information' then nullif(btrim(p_payload->>'required_information'), '') else required_information end,
    suggested_pitch = case when p_payload ? 'suggested_pitch' then nullif(btrim(p_payload->>'suggested_pitch'), '') else suggested_pitch end,
    reference_price = case when p_payload ? 'reference_price' then nullif(btrim(p_payload->>'reference_price'), '') else reference_price end,
    price_notes = case when p_payload ? 'price_notes' then nullif(btrim(p_payload->>'price_notes'), '') else price_notes end,
    handoff_guidance = case when p_payload ? 'handoff_guidance' then nullif(btrim(p_payload->>'handoff_guidance'), '') else handoff_guidance end,
    restrictions = case when p_payload ? 'restrictions' then nullif(btrim(p_payload->>'restrictions'), '') else restrictions end,
    display_order = case when p_payload ? 'display_order' then coalesce(nullif(p_payload->>'display_order', '')::integer, display_order) else display_order end,
    updated_at = now()
  where id = p_service_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'REDCOM_SERVICE_NOT_FOUND';
  end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.list_red_comercial_company_services(uuid) from public;
revoke all on function public.create_red_comercial_company_service(uuid, jsonb) from public;
revoke all on function public.update_red_comercial_company_service(uuid, jsonb) from public;
grant execute on function public.list_red_comercial_company_services(uuid) to authenticated;
grant execute on function public.create_red_comercial_company_service(uuid, jsonb) to authenticated;
grant execute on function public.update_red_comercial_company_service(uuid, jsonb) to authenticated;

do $$
declare
  v_company_count integer;
begin
  select count(*) into v_company_count
  from public.represented_companies
  where lower(btrim(name)) = lower(btrim('Centro Psicovínculo'));

  if v_company_count > 1 then
    raise exception 'Centro Psicovínculo is ambiguous';
  end if;
end;
$$;

insert into public.represented_company_services (
  represented_company_id, name, priority, short_description, problem_statement,
  discovery_questions, suggested_pitch, restrictions, display_order
)
select c.id, seed.name, seed.priority, seed.short_description, seed.problem_statement,
  replace(seed.discovery_questions, '\n', pg_catalog.chr(10)), seed.suggested_pitch, seed.restrictions, seed.display_order
from public.represented_companies c
cross join (values
  ('Reclutamiento y Selección', 'A', 'Apoyo desde la definición del perfil hasta la evaluación y presentación de candidatos.', 'Vacantes difíciles, procesos poco estructurados y contratación masiva.', '¿Qué cargo necesitan cubrir?\n¿Cuántas vacantes son?\n¿Hace cuánto están buscando?\n¿Tienen descriptor de cargo?\n¿Quién participa en la decisión?\n¿Cómo realizan actualmente el reclutamiento?\n¿Cuándo necesitan cubrir la vacante?', 'Podemos apoyar desde la definición del perfil hasta la evaluación y presentación de candidatos, adaptándonos al proceso que ya tenga la empresa.', 'No ofrecer una garantía de 30 días sin confirmar sus condiciones exactas.', 10),
  ('Consultoría RR.HH. / RR.HH. externo', 'A', 'Intervención puntual o acompañamiento continuo para ordenar y fortalecer la gestión de personas.', 'RR.HH. poco estructurado, documentación dispersa, procesos manuales y ausencia de indicadores.', '¿Tienen un equipo dedicado exclusivamente a RR.HH.?\n¿Cómo gestionan contratos, anexos y documentación?\n¿Cómo accederían hoy a antecedentes ante una auditoría?\n¿Tienen indicadores de RR.HH.?\n¿Qué proceso les genera mayor carga administrativa?', 'Psicovínculo puede intervenir en un proceso puntual o acompañar de manera continua la gestión de RR.HH., dependiendo de cuánto necesite la empresa.', null, 20),
  ('HR Tech + IA / Automatización', 'A', 'Transformación de procesos de RR.HH. en herramientas y automatizaciones trazables.', 'Excel, correos, documentos dispersos, seguimiento manual y herramientas desconectadas.', '¿Qué proceso de RR.HH. les consume más tiempo manualmente?\n¿Quién participa?\n¿Qué herramientas utilizan?\n¿Cuántas veces realizan ese proceso?\n¿Qué les gustaría automatizar?\n¿Qué información debe manejar la solución?', 'Primero entendemos el proceso de RR.HH. y después evaluamos si conviene transformarlo en una herramienta o automatización propia.', 'No venderlo simplemente como desarrollo de software.', 30),
  ('Capacitaciones', 'B', 'Diseño y ejecución de instancias de capacitación adaptadas al contexto del cliente.', null, null, null, 'Antes de derivar levantar temática, cantidad de participantes, duración, modalidad y ciudad si es presencial.', 40),
  ('Desarrollo Organizacional', 'B', 'Acompañamiento en liderazgo, feedback, clima, cultura y desarrollo de equipos.', 'Liderazgo, feedback, clima, conflictos, cultura y brechas de equipos.', '¿Han medido clima?\n¿Sus jefaturas han recibido formación?\n¿Cómo entregan feedback?\n¿Tienen definidos misión, visión y valores?\n¿Qué problemas se repiten dentro de los equipos?', null, null, 50),
  ('Inclusión Laboral', 'B', 'Apoyo en accesibilidad, puestos de trabajo, sensibilización y acompañamiento.', 'Necesidades de accesibilidad, adaptación de descriptores, sensibilización y capacitación.', null, null, 'No interpretar normativa laboral frente al cliente. Consultas legales o técnicas deben derivarse a Psicovínculo.', 60),
  ('Evaluaciones / PsicoMatch', 'complementary', 'Evaluaciones, entrevistas e informes para procesos de selección internos.', 'Necesidad de evaluar candidatos, cargos o etapas específicas del proceso de selección.', '¿Cuál es la cantidad de candidatos?\n¿Qué cargos se evaluarán?\n¿Qué tipo de evaluación requieren?\n¿En qué etapa está el proceso?\n¿Cuál es la fecha requerida?', null, null, 70)
) as seed(name, priority, short_description, problem_statement, discovery_questions, suggested_pitch, restrictions, display_order)
where lower(c.name) = lower('Centro Psicovínculo')
  and not exists (
    select 1 from public.represented_company_services s
    where s.represented_company_id = c.id and lower(btrim(s.name)) = lower(btrim(seed.name))
  );
