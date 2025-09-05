import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {

  document.getElementById('logoutButton')?.addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    } catch (error) {
      console.error("Erro ao sair:", error.message);
    }
  });

  await verificarAdminParaAcesso();

  await loadTeamsAndUsersForAssignment();

  const createActivityForm = document.getElementById('createActivityForm');
  if (createActivityForm) {
    createActivityForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const activityName = document.getElementById('activityName').value;
      const activityDescription = document.getElementById('activityDescription').value;
      const activityStartDate = document.getElementById('activityStartDate').value;
      const activityDueDate = document.getElementById('activityDueDate').value;
      const assignedTeamId = document.getElementById('assignToTeam').value;
 
      const assignedUsersIds = Array.from(document.querySelectorAll('#assignToUsersCheckboxes input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
      
      const activityInitialStatus = document.getElementById('activityInitialStatus').value;


      if (!activityName || !activityStartDate || !activityDueDate) {
          alert('Por favor, preencha todos os campos obrigatórios: Nome, Data de Início e Data de Entrega.');
          return;
      }
      
      if (!assignedTeamId && assignedUsersIds.length === 0) {
          alert('A atividade deve ser atribuída a pelo menos uma equipe OU a pelo menos um usuário específico.');
          return;
      }

      try {
        const { data: newActivity, error: activityError } = await supabase
          .from('activities')
          .insert({
            name: activityName,
            description: activityDescription,
            start_date: activityStartDate,
            due_date: activityDueDate,
            status: activityInitialStatus
          })
          .select()
          .single();

        if (activityError) throw activityError;
        console.log("Atividade principal criada:", newActivity);

        if (assignedTeamId) {
            const { error: teamActivityError } = await supabase
              .from('team_activities')
              .insert({
                team_id: assignedTeamId,
                activity_id: newActivity.id,
              });

            if (teamActivityError) throw teamActivityError;
            console.log("Atividade atribuída à equipe:", assignedTeamId);
        } else {
            console.log("Nenhuma equipe atribuída diretamente à atividade.");
        }

        if (assignedUsersIds.length > 0) {
          const userActivityInserts = assignedUsersIds.map(userId => ({
            user_id: userId,
            activity_id: newActivity.id,
            progress: 0,
            status: activityInitialStatus
          }));

          const { error: userActivityError } = await supabase
            .from('user_activities')
            .insert(userActivityInserts);

          if (userActivityError) throw userActivityError;
          console.log("Atividade atribuída aos usuários:", assignedUsersIds);
        } else {
            alert("Nenhum usuário específico foi atribuído a esta atividade.");
        }

        alert("Atividade criada e atribuída com sucesso!");
        createActivityForm.reset();

      } catch (error) {
        alert("Erro ao criar atividade: " + error.message);
        console.error("Erro completo ao criar atividade e/ou atribuições:", error);
      }
    });
  }
});

async function verificarAdminParaAcesso() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Usuário não autenticado. Redirecionando para login.");
        window.location.href = "index.html";
        return;
    }
    const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    if (error || userProfile.role !== 'admin') {
        alert("Acesso restrito a administradores. Redirecionando para o painel principal.");
        window.location.href = "dashboard.html";
    }
}

async function loadTeamsAndUsersForAssignment() {
  const assignToTeamSelect = document.getElementById('assignToTeam');
  const assignToUsersCheckboxesContainer = document.getElementById('assignToUsersCheckboxes');

  if (!assignToTeamSelect || !assignToUsersCheckboxesContainer) {
      console.warn("Elementos de seleção de equipe ou contêiner de checkboxes de usuário não encontrados. Verifique o HTML.");
      return;
  }

  assignToTeamSelect.innerHTML = '<option value="">-- Selecione uma equipe --</option>';
  assignToUsersCheckboxesContainer.innerHTML = '<p class="text-muted text-center py-2">Carregando usuários...</p>';

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name');

  if (teamsError) {
    console.error("Erro ao carregar equipes:", teamsError);
    alert("Não foi possível carregar as equipes. Verifique suas políticas de RLS e conexão.");
  } else {
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = team.name;
      assignToTeamSelect.appendChild(option);
    });
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role');

  if (usersError) {
    console.error("Erro ao carregar usuários para atribuição:", usersError);
    assignToUsersCheckboxesContainer.innerHTML = '<p class="text-danger text-center py-2">Erro ao carregar usuários.</p>';
    alert("Não foi possível carregar os usuários para atribuição. Verifique suas políticas de RLS e conexão.");
  } else {
    assignToUsersCheckboxesContainer.innerHTML = '';
    if (users.length === 0) {
        assignToUsersCheckboxesContainer.innerHTML = '<p class="text-muted text-center py-2">Nenhum usuário disponível para atribuição.</p>';
    } else {
        users.forEach(user => {
            if (user.role !== 'admin' && (user.name || user.email)) {
                const userDisplayName = user.name ? `${user.name} (${user.email})` : user.email;
                const checkboxDiv = document.createElement('div');
                checkboxDiv.classList.add('form-check');

                checkboxDiv.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${user.id}" id="userCheckbox-${user.id}">
                    <label class="form-check-label" for="userCheckbox-${user.id}">
                        ${userDisplayName}
                    </label>
                `;
                assignToUsersCheckboxesContainer.appendChild(checkboxDiv);
            } else {
            }
        });
    }
  }
}