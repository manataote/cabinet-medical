
-- 1. Table des actes orthopediques
create table public.actes_orthopediques (
  id uuid not null default gen_random_uuid (),
  code_lppr character varying(50) not null,
  libelle_interne text not null,
  libelle_facture text not null,
  quantite integer not null,
  tarif_base numeric(10, 2) not null,
  tarif_base_lppr numeric(10, 2) not null,
  taux_applique numeric(5, 2) not null,
  regime character varying(50) not null,
  total numeric(10, 2) not null,
  part_cps numeric(10, 2) not null,
  part_patient numeric(10, 2) not null,
  actif boolean null default true,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint actes_orthopediques_pkey primary key (id),
  constraint actes_orthopediques_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint actes_orthopediques_regime_check check (
    (
      (regime)::text = any (
        (
          array[
            'maladie'::character varying,
            'longue-maladie'::character varying,
            'maternite'::character varying,
            'arret-travail'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

-- 2. Table des actes_soins
create table public.actes_soins (
  id uuid not null default gen_random_uuid (),
  code character varying(50) not null,
  libelle text not null,
  tarif numeric(10, 2) not null,
  coefficient numeric(10, 2) not null,
  actif boolean null default true,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint actes_soins_pkey primary key (id),
  constraint actes_soins_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id)
) TABLESPACE pg_default;

-- 3. Table des bordereaux
create table public.bordereaux (
  id uuid not null default gen_random_uuid (),
  numero_bordereau character varying(255) not null,
  date date not null,
  type character varying(50) not null,
  montant_total numeric(10, 2) not null,
  modele_utilise character varying(255) null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bordereaux_pkey primary key (id),
  constraint bordereaux_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint bordereaux_type_check check (
    (
      (type)::text = any (
        (
          array[
            'feuilles-soins'::character varying,
            'rejet-feuilles-soins'::character varying,
            'semelles-orthopediques'::character varying,
            'rejet-semelles-orthopediques'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

-- 4. Table des cabinets
create table public.cabinets (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  address text null,
  phone character varying(50) null,
  email character varying(255) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cabinets_pkey primary key (id)
) TABLESPACE pg_default;

-- 5. Table des factures_semelles
create table public.factures_semelles (
  id uuid not null default gen_random_uuid (),
  numero_facture character varying(255) not null,
  date_facture date not null,
  montant_total numeric(10, 2) not null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  patient_id uuid null,
  medecin_id uuid null,
  bordereau_id uuid null,
  constraint factures_semelles_pkey primary key (id),
  constraint factures_semelles_bordereau_id_fkey foreign KEY (bordereau_id) references bordereaux (id) on delete set null,
  constraint factures_semelles_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint factures_semelles_medecin_id_fkey foreign KEY (medecin_id) references medecins (id) on update CASCADE on delete CASCADE,
  constraint factures_semelles_patient_id_fkey foreign KEY (patient_id) references patients (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

-- 6. Table des factures_semelles_actes_orthopediques
create table public.factures_semelles_actes_orthopediques (
  id uuid not null default gen_random_uuid (),
  facture_semelles_id uuid not null,
  acte_orthopedique_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint factures_semelles_actes_orthopediques_pkey primary key (id),
  constraint factures_semelles_actes_orthopediques_acte_orthopedique_id_fkey foreign KEY (acte_orthopedique_id) references actes_orthopediques (id) on delete CASCADE,
  constraint factures_semelles_actes_orthopediques_facture_semelles_id_fkey foreign KEY (facture_semelles_id) references factures_semelles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_factures_semelles_actes_orthopediques_facture_semelles_id on public.factures_semelles_actes_orthopediques using btree (facture_semelles_id) TABLESPACE pg_default;

create index IF not exists idx_factures_semelles_actes_orthopediques_acte_orthopedique_id on public.factures_semelles_actes_orthopediques using btree (acte_orthopedique_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_factures_semelles_actes_orthopediques_unique on public.factures_semelles_actes_orthopediques using btree (facture_semelles_id, acte_orthopedique_id) TABLESPACE pg_default;

create trigger update_factures_semelles_actes_orthopediques_updated_at BEFORE
update on factures_semelles_actes_orthopediques for EACH row
execute FUNCTION update_updated_at_column ();

-- 7. Table des feuilles_soins
create table public.feuilles_soins (
  id uuid not null default gen_random_uuid (),
  numero_feuille character varying(255) not null,
  date_soins date not null,
  medecin_prescripteur uuid null,
  date_prescription date not null,
  montant_total numeric(10, 2) not null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  patient_id uuid not null,
  dap character varying null,
  is_parcours_soins boolean not null default false,
  is_longue_maladie boolean not null default false,
  is_atmp boolean not null default false,
  is_maternite boolean not null default false,
  is_urgence boolean not null default false,
  is_autres_derogations boolean not null default false,
  panier_soins text null,
  rsr text null,
  autres_derogations text null,
  numero_atmp bigint null,
  bordereau_id uuid null,
  constraint feuilles_soins_pkey primary key (id),
  constraint feuilles_soins_bordereau_id_fkey foreign KEY (bordereau_id) references bordereaux (id) on delete set null,
  constraint feuilles_soins_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint feuilles_soins_medecin_prescripteur_fkey foreign KEY (medecin_prescripteur) references medecins (id),
  constraint feuilles_soins_patient_id_fkey foreign KEY (patient_id) references patients (id) on update CASCADE on delete CASCADE,
  constraint feuilles_soins_dap_check check (
    (
      (dap is null)
      or (
        length(
          regexp_replace((dap)::text, '[^0-9]'::text, ''::text, 'g'::text)
        ) = 8
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_feuilles_soins_bordereau_id on public.feuilles_soins using btree (bordereau_id) TABLESPACE pg_default;

-- 8. Table des feuilles_soins_actes_soins
create table public.feuilles_soins_actes_soins (
  id uuid not null default gen_random_uuid (),
  feuille_soins_id uuid not null,
  acte_soins_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint feuilles_soins_actes_soins_pkey primary key (id),
  constraint feuilles_soins_actes_soins_acte_soins_id_fkey foreign KEY (acte_soins_id) references actes_soins (id) on delete CASCADE,
  constraint feuilles_soins_actes_soins_feuille_soins_id_fkey foreign KEY (feuille_soins_id) references feuilles_soins (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_feuilles_soins_actes_soins_feuille_soins_id on public.feuilles_soins_actes_soins using btree (feuille_soins_id) TABLESPACE pg_default;

create index IF not exists idx_feuilles_soins_actes_soins_acte_soins_id on public.feuilles_soins_actes_soins using btree (acte_soins_id) TABLESPACE pg_default;

create unique INDEX IF not exists idx_feuilles_soins_actes_soins_unique on public.feuilles_soins_actes_soins using btree (feuille_soins_id, acte_soins_id) TABLESPACE pg_default;

create trigger update_feuilles_soins_actes_soins_updated_at BEFORE
update on feuilles_soins_actes_soins for EACH row
execute FUNCTION update_updated_at_column ();

-- 9. Table des medecins
create table public.medecins (
  id uuid not null default gen_random_uuid (),
  nom character varying(255) not null,
  prenom character varying(255) not null,
  specialite character varying(255) null,
  numero_rpps character varying(50) null,
  identification_prescripteur character varying(255) not null,
  adresse text null,
  telephone character varying(50) null,
  email character varying(255) null,
  actif boolean null default true,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint medecins_pkey primary key (id),
  constraint medecins_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id)
) TABLESPACE pg_default;

-- 10. Table des ordonnances
create table public.ordonnances (
  id uuid not null default gen_random_uuid (),
  numero_ordonnance character varying(255) not null,
  date_ordonnance date not null,
  medecin_prescripteur uuid null,
  contenu text not null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  patient_id uuid null,
  type character varying(20) null,
  duree_soins integer null default 0,
  quantite integer null default 1,
  fichier_url text null,
  nom_fichier character varying(255) null,
  type_fichier character varying(100) null,
  taille_fichier bigint null,
  date_import timestamp with time zone null default now(),
  commentaire text null,
  constraint ordonnances_pkey primary key (id),
  constraint ordonnances_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint ordonnances_medecin_prescripteur_fkey foreign KEY (medecin_prescripteur) references medecins (id),
  constraint ordonnances_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE,
  constraint ordonnances_type_check check (
    (
      (type)::text = any (
        (
          array[
            'soins'::character varying,
            'semelles'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ordonnances_patient_id on public.ordonnances using btree (patient_id) TABLESPACE pg_default;

create index IF not exists idx_ordonnances_type on public.ordonnances using btree (type) TABLESPACE pg_default;

create index IF not exists idx_ordonnances_date on public.ordonnances using btree (date_ordonnance) TABLESPACE pg_default;

-- 11. Table des patients_notes
create table public.patient_notes (
  id uuid not null default gen_random_uuid (),
  patient_id uuid null,
  contenu text not null,
  paramed_id uuid null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint patient_notes_pkey primary key (id),
  constraint patient_notes_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint patient_notes_paramed_id_fkey foreign KEY (paramed_id) references users (id) on update CASCADE,
  constraint patient_notes_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE
) TABLESPACE pg_default;

-- 12. Table des patients
create table public.patients (
  id uuid not null default gen_random_uuid (),
  numero_facture character varying(255) not null,
  nom character varying(255) not null,
  prenom character varying(255) not null,
  dn character varying(7) not null,
  date_naissance date not null,
  adresse text null,
  telephone character varying(50) null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  assure_nom character varying(255) null,
  assure_prenom character varying(255) null,
  assure_dn character varying(7) null,
  assure_date_naissance date null,
  assure_adresse text null,
  assure_telephone character varying(50) null,
  constraint patients_pkey primary key (id),
  constraint patients_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id)
) TABLESPACE pg_default;

-- 13. Table des todos
create table public.todos (
  id uuid not null default gen_random_uuid (),
  titre character varying(255) not null,
  description text null,
  priorite character varying(20) not null,
  statut character varying(20) not null,
  paramed_id uuid null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null default gen_random_uuid (),
  completed_by uuid null,
  constraint todos_pkey primary key (id),
  constraint todos_completed_by_fkey foreign KEY (completed_by) references users (id),
  constraint todos_created_by_fkey foreign KEY (created_by) references users (id),
  constraint todos_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id),
  constraint todos_paramed_id_fkey foreign KEY (paramed_id) references users (id),
  constraint todos_priorite_check check (
    (
      (priorite)::text = any (
        (
          array[
            'normal'::character varying,
            'urgent'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint todos_statut_check check (
    (
      (statut)::text = any (
        (
          array[
            'pending'::character varying,
            'completed'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

-- 14. Table des users
create table public.users (
  id uuid not null,
  email character varying(255) not null,
  role character varying(50) not null,
  cabinet_id uuid null,
  created_at timestamp with time zone null default now(),
  nom text null,
  prenom text null,
  numero_ident text null,
  config_calculs jsonb null,
  config_formats jsonb null,
  config_positionnements_pdf jsonb null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_cabinet_id_fkey foreign KEY (cabinet_id) references cabinets (id) on update CASCADE on delete CASCADE,
  constraint users_numero_ident_check check ((length(numero_ident) <= 5)),
  constraint users_role_check check (
    (
      (role)::text = any (
        (
          array[
            'admin'::character varying,
            'medecin'::character varying,
            'secretaire'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;