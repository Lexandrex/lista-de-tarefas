INSERT INTO public.task_statuses (id, name, description) VALUES
  (gen_random_uuid(), 'A Fazer', 'Tarefa ainda não iniciada'),
  (gen_random_uuid(), 'Em Progresso', 'Tarefa em andamento'),
  (gen_random_uuid(), 'Concluída', 'Tarefa finalizada')
ON CONFLICT DO NOTHING;
INSERT INTO public.task_types (id, name, description) VALUES
  (gen_random_uuid(), 'Bug', 'Correção de defeito'),
  (gen_random_uuid(), 'Funcionalidade', 'Nova funcionalidade'),
  (gen_random_uuid(), 'Melhoria', 'Aprimoramento de existente')
ON CONFLICT DO NOTHING;
