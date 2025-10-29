SELECT n.nspname AS schema, c.relname AS table, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

SELECT schemaname AS schema, tablename AS table, polname AS policy, cmd AS command, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, polname;

SELECT tablename AS table, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

SELECT t.table_name AS table, r.policy_name AS policy_name
FROM information_schema.tables t
LEFT JOIN (
  SELECT tablename AS table_name, polname AS policy_name
  FROM pg_policies
  WHERE schemaname = 'public'
) r ON r.table_name = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, r.policy_name NULLS LAST;
