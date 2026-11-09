import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("migrations have unique versions and enforce tenant and active-user boundaries", async () => {
  const migrationDirectory = path.join(root, "supabase", "migrations");
  const files = (await readdir(migrationDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const versions = files.map((file) => file.match(/^(\d+)_/)?.[1]);

  assert.ok(versions.every(Boolean), "every migration must have a numeric version");
  assert.equal(new Set(versions).size, versions.length, "migration versions must be unique");

  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE SCHEMA storage;
      CREATE TABLE auth.users (
        id uuid PRIMARY KEY,
        email text,
        raw_user_meta_data jsonb DEFAULT '{}'::jsonb
      );
      CREATE TABLE storage.buckets (
        id text PRIMARY KEY,
        name text NOT NULL,
        public boolean NOT NULL DEFAULT false
      );
      CREATE TABLE storage.objects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id text,
        name text
      );
      CREATE FUNCTION auth.uid() RETURNS uuid
        LANGUAGE sql STABLE
        AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA public, auth, storage TO authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth TO authenticated;
    `);

    for (const file of files) {
      const sql = (await readFile(path.join(migrationDirectory, file), "utf8"))
        .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";?/gi, "");
      await db.exec(sql);
    }
    await db.exec(
      await readFile(
        path.join(migrationDirectory, "0085_manual_colaborador.sql"),
        "utf8",
      ),
    );

    await db.exec(`
      INSERT INTO public.empresas (id, nome, slug)
      VALUES
        ('10000000-0000-0000-0000-000000000001', 'Empresa A', 'empresa-a'),
        ('20000000-0000-0000-0000-000000000002', 'Empresa B', 'empresa-b');
      INSERT INTO auth.users (id, email)
      VALUES ('30000000-0000-0000-0000-000000000003', 'active@example.test');
      INSERT INTO public.cargos (id, empresa_id, nome, permissoes)
      VALUES (
        '40000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000001',
        'Colaborador',
        '{}'::jsonb
      );
      INSERT INTO public.perfis (id, empresa_id, cargo_id, nome_completo, email)
      VALUES (
        '30000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000004',
        'Pessoa Sintética',
        'active@example.test'
      );
      INSERT INTO public.vagas (id, empresa_id, titulo)
      VALUES (
        '50000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000001',
        'Vaga de teste'
      ), (
        '50000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000002',
        'Vaga de outro tenant'
      );
      INSERT INTO public.candidatos (id, empresa_id, nome)
      VALUES (
        '60000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000001',
        'Candidato Sintético'
      );
    `);

    await assert.rejects(
      db.query(`
        INSERT INTO public.candidaturas (empresa_id, vaga_id, candidato_id)
        VALUES (
          '10000000-0000-0000-0000-000000000001',
          '50000000-0000-0000-0000-000000000006',
          '60000000-0000-0000-0000-000000000006'
        )
      `),
      /fk_candidaturas_vaga_empresa/,
      "cross-tenant vacancy/candidate links must be rejected",
    );

    await db.exec(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth TO authenticated;
    `);
    await db.exec(`
      SET ROLE authenticated;
      SELECT set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', false);
    `);
    const activeVacancies = await db.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.vagas",
    );
    assert.equal(activeVacancies.rows[0]?.count, "1");

    await db.exec(
      "RESET ROLE; SELECT set_config('request.jwt.claim.sub', '', false); UPDATE public.perfis SET ativo = false WHERE id = '30000000-0000-0000-0000-000000000003'; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', false);",
    );
    const inactiveVacancies = await db.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.vagas",
    );
    assert.equal(inactiveVacancies.rows[0]?.count, "0");
  } finally {
    await db.close();
  }
});
