-- Facturio - schema PostgreSQL consolide V3
-- Baseline pour une base neuve : CREATE TABLE uniquement, sans trigger,
-- procedure, fonction personnalisee ni vue SQL.

-- ---------------------------------------------------------------------------
-- TABLES COMMUNES - utilisateurs, organisations et sessions
-- ---------------------------------------------------------------------------

CREATE TABLE app_user (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Peut rester vide quelques minutes si X ne renvoie pas l'email. Le profil
    -- impose ensuite sa saisie avant de terminer l'inscription.
    email               VARCHAR(320) UNIQUE,
    password_hash       VARCHAR(255),
    display_name        VARCHAR(160) NOT NULL,
    locale              VARCHAR(10) NOT NULL DEFAULT 'fr-FR',
    auth_provider       VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    enabled             BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    terms_accepted_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_app_user_provider CHECK (
        auth_provider IN ('LOCAL', 'GOOGLE', 'FACEBOOK', 'X', 'OIDC')
    )
);

-- Identites OAuth communes aux createurs et aux entreprises. Un utilisateur
-- peut lier plusieurs fournisseurs sans dupliquer son compte Facturio.
CREATE TABLE external_identity (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider            VARCHAR(20) NOT NULL,
    provider_subject    VARCHAR(255) NOT NULL,
    provider_email      VARCHAR(320),
    provider_username   VARCHAR(160),
    avatar_url          VARCHAR(1000),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_external_identity_provider CHECK (
        provider IN ('GOOGLE', 'FACEBOOK', 'X', 'OIDC')
    ),
    CONSTRAINT uq_external_identity_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uq_external_identity_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX ix_external_identity_user ON external_identity (user_id);

CREATE TABLE organization (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_type              VARCHAR(20) NOT NULL DEFAULT 'CREATOR',
    legal_name                  VARCHAR(200) NOT NULL,
    trading_name                VARCHAR(200),
    email                       VARCHAR(320),
    phone                       VARCHAR(40),
    country_code                CHAR(2) NOT NULL,
    currency_code               CHAR(3) NOT NULL DEFAULT 'EUR',
    timezone                    VARCHAR(60) NOT NULL DEFAULT 'Europe/Paris',

    -- Identite de facturation commune
    registration_number         VARCHAR(80),
    tax_id                      VARCHAR(80),
    vat_number                  VARCHAR(80),
    address_line_1              VARCHAR(255),
    address_line_2              VARCHAR(255),
    postal_code                 VARCHAR(30),
    city                        VARCHAR(120),

    -- Reglages de facturation
    iban                        VARCHAR(80),
    bic                         VARCHAR(20),
    payment_instructions        TEXT,
    default_payment_terms_days  SMALLINT NOT NULL DEFAULT 30,
    default_terms               TEXT,
    legal_mentions              TEXT,
    late_payment_mention        TEXT,
    vat_exemption_mention       TEXT,
    invoice_footer              TEXT,
    invoice_prefix              VARCHAR(20) NOT NULL DEFAULT 'FAC',
    quote_prefix                VARCHAR(20) NOT NULL DEFAULT 'PRO',
    credit_note_prefix          VARCHAR(20) NOT NULL DEFAULT 'AV',
    accent_color                VARCHAR(7) NOT NULL DEFAULT '#5B2FF0',
    logo_url                    VARCHAR(1000),
    reminder_mode               VARCHAR(10) NOT NULL DEFAULT 'MANUAL',

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at                 TIMESTAMPTZ,

    CONSTRAINT ck_organization_workspace CHECK (workspace_type IN ('CREATOR', 'BUSINESS')),
    CONSTRAINT ck_organization_reminder_mode CHECK (reminder_mode IN ('AUTO', 'MANUAL')),
    CONSTRAINT ck_organization_payment_terms CHECK (default_payment_terms_days BETWEEN 0 AND 365)
);

CREATE TABLE organization_member (
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    member_role     VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMPTZ,
    PRIMARY KEY (organization_id, user_id),
    CONSTRAINT ck_member_role CHECK (
        member_role IN ('OWNER', 'ADMIN', 'ACCOUNTANT', 'MEMBER', 'VIEWER')
    )
);

CREATE TABLE user_session (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    refresh_token_hash  CHAR(64) NOT NULL UNIQUE,
    expires_at          TIMESTAMPTZ NOT NULL,
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at          TIMESTAMPTZ,
    ip_address          INET,
    user_agent          VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Un seul espace par defaut pour chaque utilisateur.
CREATE UNIQUE INDEX uq_member_default_workspace
    ON organization_member (user_id)
    WHERE is_default;

CREATE INDEX ix_session_user ON user_session (user_id, expires_at DESC);

-- ---------------------------------------------------------------------------
-- TABLES COMMUNES - clients factures et projets
-- ---------------------------------------------------------------------------

-- Coordonnees minimales partagees par une marque createur et un client PME.
CREATE TABLE customer (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name                        VARCHAR(200) NOT NULL,
    contact_name                VARCHAR(160),
    email                       VARCHAR(320),
    phone                       VARCHAR(40),
    country_code                CHAR(2) NOT NULL,
    address_line_1              VARCHAR(255),
    address_line_2              VARCHAR(255),
    postal_code                 VARCHAR(30),
    city                        VARCHAR(120),
    payment_terms_days          SMALLINT NOT NULL DEFAULT 30,
    notes                       TEXT,
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_customer_payment_terms CHECK (payment_terms_days BETWEEN 0 AND 365)
);

CREATE INDEX ix_customer_organization ON customer (organization_id, name);

CREATE TABLE project (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    customer_id         UUID REFERENCES customer(id),
    project_type        VARCHAR(30) NOT NULL DEFAULT 'CAMPAIGN',
    name                VARCHAR(200) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    start_date          DATE,
    end_date            DATE,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_project_type CHECK (project_type IN ('CAMPAIGN', 'MISSION', 'PROJECT')),
    CONSTRAINT ck_project_status CHECK (
        status IN ('DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')
    )
);

CREATE INDEX ix_project_organization ON project (organization_id, status);

-- ---------------------------------------------------------------------------
-- TABLES COMMUNES - modeles de facture
-- ---------------------------------------------------------------------------

CREATE TABLE invoice_template (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name                VARCHAR(160) NOT NULL,
    description         TEXT,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    is_preset           BOOLEAN NOT NULL DEFAULT FALSE,
    current_version     INTEGER NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at         TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_default_invoice_template
    ON invoice_template (organization_id)
    WHERE is_default AND archived_at IS NULL;

CREATE TABLE invoice_template_version (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         UUID NOT NULL REFERENCES invoice_template(id) ON DELETE CASCADE,
    version             INTEGER NOT NULL,
    label               VARCHAR(80),
    template_json       JSONB NOT NULL,
    created_by          UUID REFERENCES app_user(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (template_id, version)
);

-- ---------------------------------------------------------------------------
-- TABLES COMMUNES - devis, factures, avoirs, lignes, taxes et paiements
-- ---------------------------------------------------------------------------

CREATE TABLE document_sequence (
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    document_type   VARCHAR(20) NOT NULL,
    sequence_year   SMALLINT NOT NULL,
    prefix          VARCHAR(20) NOT NULL,
    last_value      BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (organization_id, document_type, sequence_year),
    CONSTRAINT ck_sequence_type CHECK (document_type IN ('QUOTE', 'INVOICE', 'CREDIT_NOTE'))
);

CREATE TABLE billing_document (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organization(id),
    customer_id             UUID REFERENCES customer(id),
    project_id              UUID REFERENCES project(id),
    source_document_id      UUID REFERENCES billing_document(id),
    document_type           VARCHAR(20) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    document_number         VARCHAR(60),
    issue_date              DATE NOT NULL,
    due_date                DATE,
    valid_until             DATE,
    currency_code           CHAR(3) NOT NULL DEFAULT 'EUR',
    operation_nature        VARCHAR(20) NOT NULL DEFAULT 'SERVICES',
    vat_applicable          BOOLEAN NOT NULL DEFAULT TRUE,
    issuer_snapshot         JSONB NOT NULL DEFAULT '{}'::jsonb,
    customer_snapshot       JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_version_id     UUID REFERENCES invoice_template_version(id),
    global_discount_type    VARCHAR(10) NOT NULL DEFAULT 'PERCENT',
    global_discount_value   NUMERIC(19, 4) NOT NULL DEFAULT 0,
    subtotal_amount         NUMERIC(19, 4) NOT NULL DEFAULT 0,
    discount_amount         NUMERIC(19, 4) NOT NULL DEFAULT 0,
    tax_amount              NUMERIC(19, 4) NOT NULL DEFAULT 0,
    total_amount            NUMERIC(19, 4) NOT NULL DEFAULT 0,
    paid_amount             NUMERIC(19, 4) NOT NULL DEFAULT 0,
    deposit_percent         NUMERIC(7, 4) NOT NULL DEFAULT 0,
    terms                   TEXT,
    notes                   TEXT,
    pdf_url                 VARCHAR(1000),
    sent_at                 TIMESTAMPTZ,
    finalized_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, document_type, document_number),
    CONSTRAINT ck_document_type CHECK (document_type IN ('QUOTE', 'INVOICE', 'CREDIT_NOTE')),
    CONSTRAINT ck_document_status CHECK (
        status IN (
            'DRAFT', 'SENT', 'ACCEPTED', 'REFUSED', 'EXPIRED', 'INVOICED',
            'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'
        )
    ),
    CONSTRAINT ck_document_operation CHECK (operation_nature IN ('GOODS', 'SERVICES', 'MIXED')),
    CONSTRAINT ck_document_discount_type CHECK (global_discount_type IN ('PERCENT', 'AMOUNT'))
);

CREATE INDEX ix_document_organization_date
    ON billing_document (organization_id, issue_date DESC);
CREATE INDEX ix_document_organization_status
    ON billing_document (organization_id, status);

CREATE TABLE billing_document_line (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES billing_document(id) ON DELETE CASCADE,
    line_position       INTEGER NOT NULL,
    description         TEXT NOT NULL,
    item_type           VARCHAR(30) NOT NULL DEFAULT 'SERVICE',
    quantity            NUMERIC(19, 6) NOT NULL,
    unit_code           VARCHAR(20) NOT NULL DEFAULT 'UNIT',
    unit_price          NUMERIC(19, 6) NOT NULL,
    discount_type       VARCHAR(10) NOT NULL DEFAULT 'PERCENT',
    discount_value      NUMERIC(19, 4) NOT NULL DEFAULT 0,
    vat_rate            NUMERIC(7, 4) NOT NULL DEFAULT 0,
    net_amount          NUMERIC(19, 4) NOT NULL,
    tax_amount          NUMERIC(19, 4) NOT NULL,
    total_amount        NUMERIC(19, 4) NOT NULL,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (document_id, line_position),
    CONSTRAINT ck_line_discount_type CHECK (discount_type IN ('PERCENT', 'AMOUNT'))
);

CREATE TABLE billing_document_tax (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES billing_document(id) ON DELETE CASCADE,
    label           VARCHAR(160) NOT NULL,
    rate            NUMERIC(7, 4) NOT NULL,
    base_amount     NUMERIC(19, 4) NOT NULL,
    tax_amount      NUMERIC(19, 4) NOT NULL
);

CREATE TABLE payment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id),
    document_id         UUID NOT NULL REFERENCES billing_document(id),
    amount              NUMERIC(19, 4) NOT NULL,
    currency_code       CHAR(3) NOT NULL DEFAULT 'EUR',
    paid_on             DATE NOT NULL,
    payment_method      VARCHAR(30) NOT NULL,
    reference           VARCHAR(160),
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_payment_method CHECK (
        payment_method IN ('TRANSFER', 'MOBILE_MONEY', 'CARD', 'CASH', 'PAYPAL', 'CHECK', 'OTHER')
    )
);

CREATE INDEX ix_payment_document ON payment (document_id, paid_on);

-- ---------------------------------------------------------------------------
-- TABLES COMMUNES - relances, emails, abonnement et activite
-- ---------------------------------------------------------------------------

CREATE TABLE reminder_rule (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    label_key           VARCHAR(120) NOT NULL,
    step_position       INTEGER NOT NULL,
    offset_days         SMALLINT NOT NULL,
    channel             VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    template_key        VARCHAR(120) NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, step_position)
);

CREATE TABLE reminder (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id),
    document_id         UUID NOT NULL REFERENCES billing_document(id) ON DELETE CASCADE,
    rule_id             UUID REFERENCES reminder_rule(id),
    scheduled_at        TIMESTAMPTZ NOT NULL,
    sent_at             TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    recipient_email     VARCHAR(320) NOT NULL,
    subject             VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_reminder_status CHECK (
        status IN ('SCHEDULED', 'AWAITING', 'SENT', 'CANCELLED', 'FAILED')
    )
);

CREATE INDEX ix_reminder_schedule ON reminder (organization_id, status, scheduled_at);

CREATE TABLE email_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id),
    document_id         UUID NOT NULL REFERENCES billing_document(id),
    recipient_email     VARCHAR(320) NOT NULL,
    subject             VARCHAR(255) NOT NULL,
    body                TEXT NOT NULL,
    with_outstanding    BOOLEAN NOT NULL DEFAULT FALSE,
    provider_message_id VARCHAR(255),
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
    plan_code               VARCHAR(20) NOT NULL DEFAULT 'FREE',
    status                  VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    billing_cycle           VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    start_date              DATE NOT NULL,
    trial_end_date          DATE,
    next_billing_date       DATE,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    provider_customer_id    VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_subscription_plan CHECK (plan_code IN ('FREE', 'PRO', 'STUDIO')),
    CONSTRAINT ck_subscription_status CHECK (
        status IN ('TRIAL', 'ACTIVE', 'UNPAID', 'SUSPENDED', 'CANCELLED')
    ),
    CONSTRAINT ck_subscription_cycle CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL'))
);

CREATE TABLE platform_invoice (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id),
    invoice_number      VARCHAR(60) NOT NULL UNIQUE,
    issue_date          DATE NOT NULL,
    plan_code           VARCHAR(20) NOT NULL,
    billing_cycle       VARCHAR(20) NOT NULL,
    currency_code       CHAR(3) NOT NULL DEFAULT 'EUR',
    amount              NUMERIC(19, 4) NOT NULL,
    status              VARCHAR(20) NOT NULL,
    pdf_url             VARCHAR(1000),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_platform_invoice_status CHECK (status IN ('PAID', 'UNPAID'))
);

CREATE TABLE activity_event (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    actor_user_id       UUID REFERENCES app_user(id),
    activity_type       VARCHAR(30) NOT NULL,
    aggregate_type      VARCHAR(50),
    aggregate_id        UUID,
    message_key         VARCHAR(160) NOT NULL,
    params              JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_activity_type CHECK (
        activity_type IN (
            'QUOTE', 'INVOICE', 'PAYMENT', 'REMINDER', 'BRAND', 'CAMPAIGN',
            'COLLABORATION', 'SUBSCRIPTION', 'EMAIL'
        )
    )
);

CREATE INDEX ix_activity_organization
    ON activity_event (organization_id, occurred_at DESC);

-- ===========================================================================
-- TABLES RESERVEES AUX CREATEURS
-- Ces tables ne doivent contenir que des organization de type CREATOR.
-- Le backend controle ce type avant chaque creation ou modification.
-- ===========================================================================

CREATE TABLE creator_profile (
    organization_id     UUID PRIMARY KEY REFERENCES organization(id) ON DELETE CASCADE,
    handle              VARCHAR(120),
    profile_type        VARCHAR(30) NOT NULL DEFAULT 'CREATOR',
    niche               VARCHAR(120),
    platforms           JSONB NOT NULL DEFAULT '[]'::jsonb,
    vat_registered      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_creator_profile_type CHECK (
        profile_type IN ('INFLUENCER', 'CREATOR', 'FREELANCE')
    )
);

-- Une marque complete les coordonnees de la table commune customer.
CREATE TABLE creator_brand (
    customer_id         UUID PRIMARY KEY REFERENCES customer(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    reminders_paused    BOOLEAN NOT NULL DEFAULT FALSE
);

-- Une campagne complete un projet commun avec les donnees propres au createur.
CREATE TABLE creator_campaign (
    project_id          UUID PRIMARY KEY REFERENCES project(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    contract_url        VARCHAR(1000),
    contract_signed     BOOLEAN NOT NULL DEFAULT FALSE,
    deliverables        JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE creator_collaboration (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    brand_id            UUID NOT NULL REFERENCES creator_brand(customer_id),
    campaign_id         UUID REFERENCES creator_campaign(project_id),
    title               VARCHAR(200) NOT NULL,
    collaboration_type  VARCHAR(30) NOT NULL,
    stage               VARCHAR(30) NOT NULL DEFAULT 'PROSPECT',
    estimated_amount    NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency_code       CHAR(3) NOT NULL DEFAULT 'EUR',
    contact_date        DATE NOT NULL,
    next_step_date      DATE,
    next_step_note      TEXT,
    notes               TEXT,
    contract_url        VARCHAR(1000),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_creator_collaboration_type CHECK (
        collaboration_type IN ('SPONSORED', 'AMBASSADOR', 'UGC', 'EVENT', 'AFFILIATE')
    ),
    CONSTRAINT ck_creator_collaboration_stage CHECK (
        stage IN ('PROSPECT', 'NEGOTIATION', 'CONTRACT', 'IN_PROGRESS', 'DONE', 'LOST')
    )
);

CREATE INDEX ix_creator_collaboration_organization
    ON creator_collaboration (organization_id, stage);

-- ===========================================================================
-- TABLES RESERVEES AUX ENTREPRISES
-- Ces tables ne doivent contenir que des organization de type BUSINESS.
-- Le backend controle ce type avant chaque creation ou modification.
-- ===========================================================================

CREATE TABLE business_profile (
    organization_id     UUID PRIMARY KEY REFERENCES organization(id) ON DELETE CASCADE,
    legal_form          VARCHAR(40),
    siren               VARCHAR(20),
    siret               VARCHAR(20),
    vat_regime          VARCHAR(40) NOT NULL DEFAULT 'REEL_NORMAL',
    vat_on_debits       BOOLEAN NOT NULL DEFAULT FALSE,
    share_capital       NUMERIC(19, 4) NOT NULL DEFAULT 0,
    activity_code       VARCHAR(30),
    registry_city       VARCHAR(120),
    CONSTRAINT ck_business_legal_form CHECK (
        legal_form IS NULL OR legal_form IN ('EI', 'EURL', 'SARL', 'SAS', 'SASU', 'SA', 'SNC', 'SCI')
    ),
    CONSTRAINT ck_business_vat_regime CHECK (
        vat_regime IN ('REEL_NORMAL', 'REEL_SIMPLIFIE', 'FRANCHISE_BASE')
    )
);

-- Un client PME complete les coordonnees de la table commune customer.
CREATE TABLE business_customer (
    customer_id                 UUID PRIMARY KEY REFERENCES customer(id) ON DELETE CASCADE,
    organization_id             UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    customer_kind               VARCHAR(20) NOT NULL DEFAULT 'COMPANY',
    siren                       VARCHAR(20),
    siret                       VARCHAR(20),
    vat_number                  VARCHAR(80),
    legal_form                  VARCHAR(40),
    share_capital               NUMERIC(19, 4) NOT NULL DEFAULT 0,
    activity_code               VARCHAR(30),
    registry_city               VARCHAR(120),
    delivery_address_line_1     VARCHAR(255),
    delivery_address_line_2     VARCHAR(255),
    delivery_postal_code        VARCHAR(30),
    delivery_city               VARCHAR(120),
    delivery_country_code       CHAR(2),
    credit_limit                NUMERIC(19, 4) NOT NULL DEFAULT 0,
    CONSTRAINT ck_business_customer_kind CHECK (
        customer_kind IN ('COMPANY', 'INDIVIDUAL')
    )
);

-- Les fournisseurs n'existent que dans l'espace entreprise du front.
CREATE TABLE business_supplier (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    supplier_kind               VARCHAR(20) NOT NULL DEFAULT 'COMPANY',
    name                        VARCHAR(200) NOT NULL,
    contact_name                VARCHAR(160),
    email                       VARCHAR(320),
    phone                       VARCHAR(40),
    country_code                CHAR(2) NOT NULL,
    address_line_1              VARCHAR(255),
    address_line_2              VARCHAR(255),
    postal_code                 VARCHAR(30),
    city                        VARCHAR(120),
    siren                       VARCHAR(20),
    siret                       VARCHAR(20),
    vat_number                  VARCHAR(80),
    legal_form                  VARCHAR(40),
    share_capital               NUMERIC(19, 4) NOT NULL DEFAULT 0,
    activity_code               VARCHAR(30),
    registry_city               VARCHAR(120),
    payment_terms_days          SMALLINT NOT NULL DEFAULT 30,
    iban                        VARCHAR(80),
    default_operation_nature    VARCHAR(20) NOT NULL DEFAULT 'SERVICES',
    notes                       TEXT,
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_business_supplier_kind CHECK (
        supplier_kind IN ('COMPANY', 'INDIVIDUAL')
    ),
    CONSTRAINT ck_business_supplier_operation CHECK (
        default_operation_nature IN ('GOODS', 'SERVICES', 'MIXED')
    )
);

CREATE INDEX ix_business_supplier_organization
    ON business_supplier (organization_id, name);
