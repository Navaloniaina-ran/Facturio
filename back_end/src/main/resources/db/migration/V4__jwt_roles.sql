ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS platform_role VARCHAR(20) NOT NULL DEFAULT 'USER';

ALTER TABLE app_user
    DROP CONSTRAINT IF EXISTS ck_app_user_platform_role;

ALTER TABLE app_user
    ADD CONSTRAINT ck_app_user_platform_role
        CHECK (platform_role IN ('USER', 'SITE_ADMIN'));

ALTER TABLE organization_member
    DROP CONSTRAINT IF EXISTS ck_member_role;

ALTER TABLE organization_member
    ADD CONSTRAINT ck_member_role
        CHECK (member_role IN ('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'MEMBER', 'VIEWER'));
