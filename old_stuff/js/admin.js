import { supabase } from './supabase.js';

/**
 * @param {string} targetUserId
 */
window.promoverParaAdmin = async (targetUserId) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || (await supabase.from('users').select('role').eq('id', currentUser.id).single()).data?.role !== 'admin') {
      alert("Ação restrita a administradores.");
      return;
    }

    try {
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', targetUserId);

        if (updateError) throw updateError;

        alert("Usuário promovido a administrador com sucesso!");
        await carregarUsuarios();
    } catch (error) {
        alert("Erro ao promover usuário: " + error.message);
        console.error("Erro ao promover usuário:", error);
    }
};

/**
 * @param {string} targetUserId
 */
window.excluirUsuarioComum = async (targetUserId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) {
        return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || (await supabase.from('users').select('role').eq('id', currentUser.id).single()).data?.role !== 'admin') {
      alert("Ação restrita a administradores.");
      return;
    }

    const { data: targetUserProfile, error: targetUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', targetUserId)
        .single();

    if (targetUserError || (targetUserProfile && targetUserProfile.role === 'admin')) {
        alert("Não é possível excluir um administrador ou usuário não encontrado.");
        console.error("Erro ao verificar usuário para exclusão ou tentando excluir admin:", targetUserError);
        return;
    }

    try {
        await supabase.from('user_activities').delete().eq('user_id', targetUserId);
        const { error: deleteProfileError } = await supabase
            .from('users')
            .delete()
            .eq('id', targetUserId);
        if (deleteProfileError) throw deleteProfileError;

        alert("Usuário excluído com sucesso!");
        await carregarUsuarios();
    } catch (error) {
        alert("Erro ao excluir usuário: " + error.message);
        console.error("Erro na exclusão do usuário:", error);
    }
};

/**
 * @param {string} teamId
 * @param {string} teamName
 */
window.editarEquipe = async (teamId, teamName) => {
    const modalElement = document.getElementById('editTeamModal');
    const modal = new bootstrap.Modal(modalElement);

    document.getElementById('editTeamId').value = teamId;
    document.getElementById('editTeamName').value = teamName;

    const editTeamMembersCheckboxesContainer = document.getElementById('editTeamMembersCheckboxes');
    editTeamMembersCheckboxesContainer.innerHTML = '<p class="text-muted text-center py-2">Carregando usuários...</p>';
    const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .neq('role', 'admin');

    if (usersError) {
        console.error("Erro ao carregar todos os usuários para edição de equipe:", usersError);
        editTeamMembersCheckboxesContainer.innerHTML = '<p class="text-danger text-center py-2">Erro ao carregar usuários.</p>';
        return;
    }

    const { data: currentMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

    if (membersError) {
        console.error("Erro ao carregar membros atuais da equipe:", membersError);
        editTeamMembersCheckboxesContainer.innerHTML = '<p class="text-danger text-center py-2">Erro ao carregar membros.</p>';
        return;
    }

    const currentMemberIds = new Set(currentMembers.map(m => m.user_id));
    
    editTeamMembersCheckboxesContainer.innerHTML = '';
    if (allUsers.length === 0) {
        editTeamMembersCheckboxesContainer.innerHTML = '<p class="text-muted text-center py-2">Nenhum usuário disponível para atribuição.</p>';
    } else {
        allUsers.forEach(user => {
            if (user.role !== 'admin' && (user.name || user.email)) {
                const userDisplayName = user.name ? `${user.name} (${user.email})` : user.email;
                const checkboxDiv = document.createElement('div');
                checkboxDiv.classList.add('form-check');

                const isChecked = currentMemberIds.has(user.id) ? 'checked' : '';
                checkboxDiv.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${user.id}" id="editUserCheckbox-${user.id}" ${isChecked}>
                    <label class="form-check-label" for="editUserCheckbox-${user.id}">
                        ${userDisplayName}
                    </label>
                `;
                editTeamMembersCheckboxesContainer.appendChild(checkboxDiv);
            }
        });
    }

    modal.show();
};

/**
 * @param {string} teamId
 */
window.excluirEquipe = async (teamId) => {
    if (!confirm('Tem certeza que deseja excluir esta equipe? Isso também removerá suas atribuições de atividades e membros.')) {
      return;
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || (await supabase.from('users').select('role').eq('id', currentUser.id).single()).data?.role !== 'admin') {
      alert("Ação restrita a administradores.");
      return;
    }
    try {
      await supabase.from('team_activities').delete().eq('team_id', teamId);
      await supabase.from('team_members').delete().eq('team_id', teamId);

      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;

      alert("Equipe excluída com sucesso!");
      await carregarEquipes();
    } catch (error) {
      alert("Erro ao excluir equipe: " + error.message);
      console.error("Erro ao excluir equipe:", error);
    }
};

/**
 * @param {string} activityId
 */
window.editarAtividadeAdministrativa = async (activityId) => {
    const modalElement = document.getElementById('editActivityModal');
    const modal = new bootstrap.Modal(modalElement);

    const { data: activity, error } = await supabase
        .from('activities')
        .select(`
            id,
            name,
            description,
            start_date,
            due_date,
            status,
            user_activities(users(id, name, email))
        `)
        .eq('id', activityId)
        .single();

    if (error) {
        console.error("Erro ao buscar atividade para edição:", error);
        alert("Não foi possível carregar os detalhes da atividade.");
        return;
    }

    document.getElementById('editActivityId').value = activity.id;
    document.getElementById('editActivityName').value = activity.name;
    document.getElementById('editActivityDescription').value = activity.description;
    document.getElementById('editActivityStartDate').value = activity.start_date;
    document.getElementById('editActivityDueDate').value = activity.due_date;
    document.getElementById('editActivityStatus').value = activity.status;

    const editActivityAssignedUsersSelect = document.getElementById('editActivityAssignedUsers');
    editActivityAssignedUsersSelect.innerHTML = '<option value="">Carregando usuários...</option>';

    const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .neq('role', 'admin');

    if (usersError) {
        console.error("Erro ao carregar usuários para modal de edição de atividade:", usersError);
        editActivityAssignedUsersSelect.innerHTML = '<option value="">Erro ao carregar usuários.</option>';
        return;
    }

    const currentAssignedUserIds = new Set(activity.user_activities.map(ua => ua.users.id));

    editActivityAssignedUsersSelect.innerHTML = '';
    allUsers.forEach(user => {
        if (user.role !== 'admin' && (user.name || user.email)) {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name ? `${user.name} (${user.email})` : user.email;
            if (currentAssignedUserIds.has(user.id)) {
                option.selected = true;
            }
            editActivityAssignedUsersSelect.appendChild(option);
        }
    });

    modal.show();
};

/**
 * @param {string} activityId
 */
window.excluirAtividadeAdministrativa = async (activityId) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade? Isso removerá todas as suas atribuições.')) {
        return;
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || (await supabase.from('users').select('role').eq('id', currentUser.id).single()).data?.role !== 'admin') {
      alert("Ação restrita a administradores.");
      return;
    }
    try {
        await supabase.from('team_activities').delete().eq('activity_id', activityId);
        await supabase.from('user_activities').delete().eq('activity_id', activityId);
        const { error } = await supabase.from('activities').delete().eq('id', activityId);
        if (error) throw error;
        alert("Atividade excluída com sucesso!");
        await carregarAtividadesAdministrativas();
    } catch (error) {
        alert("Erro ao excluir atividade: " + error.message);
        console.error("Erro ao excluir atividade:", error);
    }
};

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
  document.getElementById('equipes-tab')?.addEventListener('click', async () => {
    await carregarEquipes();
    await carregarUsuariosParaSelecaoDeEquipe();
  });

  document.getElementById('atividades-tab')?.addEventListener('click', async () => {
    await carregarAtividadesAdministrativas();
  });

  document.getElementById('atribuicoes-tab')?.addEventListener('click', async () => {
    await carregarEquipesParaAtribuicao();
    await carregarAtividadesParaAtribuicao();
  });

  document.getElementById('usuarios-tab')?.addEventListener('click', () => {
    carregarUsuarios();
  });

  const defaultActiveTab = document.querySelector('.nav-link.active');
  if (defaultActiveTab) {

      const tabLoadFunctions = {
          'atividades-tab': carregarAtividadesAdministrativas,
          'equipes-tab': async () => { await carregarEquipes(); await carregarUsuariosParaSelecaoDeEquipe(); },
          'atribuicoes-tab': async () => { await carregarEquipesParaAtribuicao(); await carregarAtividadesParaAtribuicao(); },
          'usuarios-tab': carregarUsuarios
      };
      const loadFunction = tabLoadFunctions[defaultActiveTab.id];
      if (loadFunction) {
          await loadFunction();
      }
  }

  document.getElementById('createTeamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamName = document.getElementById('teamName').value;
    const selectedUserIds = Array.from(document.querySelectorAll('#teamMembersCheckboxes input[type="checkbox"]:checked')).map(checkbox => checkbox.value);

    if (!teamName) {
      alert("Por favor, insira o nome da equipe.");
      return;
    }

    try {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert([{ name: teamName }])
        .select()
        .single();

      if (teamError) throw teamError;
      if (selectedUserIds.length > 0) {
        const teamMemberInserts = selectedUserIds.map(userId => ({
          team_id: newTeam.id,
          user_id: userId
        }));
        const { error: memberError } = await supabase
          .from('team_members')
          .insert(teamMemberInserts);
        if (memberError) throw memberError;
      }

      alert("Equipe criada com sucesso!");
      document.getElementById('createTeamForm').reset();
      document.querySelectorAll('#teamMembersCheckboxes input[type="checkbox"]:checked').forEach(checkbox => {
          checkbox.checked = false;
      });
      await carregarEquipes();
    } catch (error) {
      alert("Erro ao criar equipe: " + error.message);
      console.error("Erro ao criar equipe:", error);
    }
  });

  document.getElementById('updateTeamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamId = document.getElementById('editTeamId').value;
    const newTeamName = document.getElementById('editTeamName').value;
    const selectedMembersIds = Array.from(document.querySelectorAll('#editTeamMembersCheckboxes input[type="checkbox"]:checked')).map(checkbox => checkbox.value);

    if (!newTeamName) {
      alert("Por favor, insira o nome da equipe.");
      return;
    }

    try {
      const { error: updateNameError } = await supabase
        .from('teams')
        .update({ name: newTeamName })
        .eq('id', teamId);
      if (updateNameError) throw updateNameError;

      const { data: currentMembers, error: currentMembersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);
      if (currentMembersError) throw currentMembersError;

      const currentMemberIds = new Set(currentMembers.map(m => m.user_id));
      const newMemberIds = new Set(selectedMembersIds);
      const membersToRemove = Array.from(currentMemberIds).filter(id => !newMemberIds.has(id));
      if (membersToRemove.length > 0) {
        const { error: deleteMembersError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .in('user_id', membersToRemove);
        if (deleteMembersError) throw deleteMembersError;
      }

      const membersToAdd = Array.from(newMemberIds).filter(id => !currentMemberIds.has(id));
      if (membersToAdd.length > 0) {
        const insertData = membersToAdd.map(userId => ({
          team_id: teamId,
          user_id: userId
        }));
        const { error: addMembersError } = await supabase
          .from('team_members')
          .insert(insertData);
        if (addMembersError) throw addMembersError;
      }

      alert("Equipe atualizada com sucesso!");
      bootstrap.Modal.getInstance(document.getElementById('editTeamModal')).hide();
      await carregarEquipes();
    } catch (error) {
      alert("Erro ao atualizar equipe: " + error.message);
      console.error("Erro ao atualizar equipe:", error);
    }
  });

  document.getElementById('updateActivityForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const activityId = document.getElementById('editActivityId').value;
      const name = document.getElementById('editActivityName').value;
      const description = document.getElementById('editActivityDescription').value;
      const start_date = document.getElementById('editActivityStartDate').value;
      const due_date = document.getElementById('editActivityDueDate').value;
      const status = document.getElementById('editActivityStatus').value;
      const newAssignedUserIds = Array.from(document.getElementById('editActivityAssignedUsers').selectedOptions).map(option => option.value);

      try {
          const { error: updateActivityError } = await supabase
              .from('activities')
              .update({ name, description, start_date, due_date, status })
              .eq('id', activityId);
          if (updateActivityError) throw updateActivityError;
          const { data: currentAssignedUsers, error: currentUsersError } = await supabase
            .from('user_activities')
            .select('user_id')
            .eq('activity_id', activityId);
          if (currentUsersError) throw currentUsersError;

          const currentAssignedUserIdsSet = new Set(currentAssignedUsers.map(u => u.user_id));
          const newAssignedUserIdsSet = new Set(newAssignedUserIds);
          const usersToRemove = Array.from(currentAssignedUserIdsSet).filter(id => !newAssignedUserIdsSet.has(id));
          if (usersToRemove.length > 0) {
              await supabase.from('user_activities').delete().eq('activity_id', activityId).in('user_id', usersToRemove);
          }

          const usersToAdd = Array.from(newAssignedUserIdsSet).filter(id => !currentAssignedUserIdsSet.has(id));
          if (usersToAdd.length > 0) {
              const insertData = usersToAdd.map(userId => ({
                  activity_id: activityId,
                  user_id: userId,
                  progress: 0,
                  status: 'pending'
              }));
              await supabase.from('user_activities').insert(insertData);
          }

          alert("Atividade atualizada com sucesso!");
          bootstrap.Modal.getInstance(document.getElementById('editActivityModal')).hide();
          carregarAtividadesAdministrativas();
      } catch (error) {
          alert("Erro ao atualizar atividade: " + error.message);
          console.error("Erro ao atualizar atividade:", error);
      }
  });
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

async function carregarEquipes() {
  const teamsList = document.getElementById('teamsList');
  if (!teamsList) return;

  teamsList.innerHTML = '<li class="list-group-item text-muted">Carregando equipes...</li>';

  const { data: teams, error } = await supabase.from('teams').select('*');
  if (error) {
    console.error("Erro ao carregar equipes:", error);
    teamsList.innerHTML = '<li class="list-group-item text-danger">Erro ao carregar equipes: ' + error.message + '</li>';
    return;
  }

  teamsList.innerHTML = '';
  if (teams.length === 0) {
    teamsList.innerHTML = '<li class="list-group-item text-muted">Nenhuma equipe criada ainda.</li>';
    return;
  }

  teams.forEach(team => {
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    listItem.innerHTML = `
      <span>${team.name}</span>
      <div>
        <button class="btn btn-sm btn-info me-2" onclick="editarEquipe('${team.id}', '${team.name}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirEquipe('${team.id}')">Excluir</button>
      </div>
    `;
    teamsList.appendChild(listItem);
  });
}


async function carregarUsuariosParaSelecaoDeEquipe() {
  const teamMembersCheckboxesContainer = document.getElementById('teamMembersCheckboxes');
  const editTeamMembersCheckboxesContainer = document.getElementById('editTeamMembersCheckboxes');
  if (teamMembersCheckboxesContainer) teamMembersCheckboxesContainer.innerHTML = '<p class="text-muted text-center py-2">Carregando usuários...</p>';
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role');

  if (usersError) {
    console.error("Erro ao carregar usuários para seleção de equipe:", usersError);
    if (teamMembersCheckboxesContainer) teamMembersCheckboxesContainer.innerHTML = '<p class="text-danger text-center py-2">Erro ao carregar usuários.</p>';
    if (editTeamMembersCheckboxesContainer) editTeamMembersCheckboxesContainer.innerHTML = '<p class="text-danger text-center py-2">Erro ao carregar usuários.</p>';
    return;
  }

  if (teamMembersCheckboxesContainer) {
      teamMembersCheckboxesContainer.innerHTML = '';
      if (users.length === 0) {
          teamMembersCheckboxesContainer.innerHTML = '<p class="text-muted text-center py-2">Nenhum usuário disponível para atribuição.</p>';
      } else {
          users.forEach(user => {
              if (user.role !== 'admin' && (user.name || user.email)) {
                  const userDisplayName = user.name ? `${user.name} (${user.email})` : user.email;
                  const checkboxDiv = document.createElement('div');
                  checkboxDiv.classList.add('form-check');

                  checkboxDiv.innerHTML = `
                      <input class="form-check-input" type="checkbox" value="${user.id}" id="teamMemberCheckbox-${user.id}">
                      <label class="form-check-label" for="teamMemberCheckbox-${user.id}">
                          ${userDisplayName}
                      </label>
                  `;
                  teamMembersCheckboxesContainer.appendChild(checkboxDiv);
              }
          });
      }
  }
}

async function carregarAtividadesAdministrativas() {
  const activitiesTableBody = document.getElementById('activitiesTableBody');
  if (!activitiesTableBody) return;

  activitiesTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Carregando atividades...</td></tr>'; // 7 colunas, ajuste se mudar

  const { data: activities, error } = await supabase
    .from('activities')
    .select(`
      id,
      name,
      description,
      start_date,
      due_date,
      status,
      team_activities(teams(name)),
      user_activities(users(name, email))
    `);

  if (error) {
    console.error("Erro ao carregar atividades administrativas:", error);
    activitiesTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar atividades: ' + error.message + '</td></tr>';
    return;
  }

  activitiesTableBody.innerHTML = '';
  if (activities.length === 0) {
    activitiesTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma atividade criada ainda.</td></tr>';
    return;
  }

  activities.forEach(activity => {
    const teamName = activity.team_activities.length > 0 ? activity.team_activities[0].teams.name : 'N/A';
    const assignedUsersList = activity.user_activities
        .filter(ua => ua.users && ua.users.id)
        .map(ua => ua.users.name || ua.users.email)
        .join(', ');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${activity.name}</td>
      <td>${activity.description}</td>
      <td>${teamName}</td>
      <td>${assignedUsersList || 'N/A'}</td>
      <td>${new Date(activity.start_date).toLocaleDateString('pt-BR')}</td>
      <td>${new Date(activity.due_date).toLocaleDateString('pt-BR')}</td>
      <td>${activity.status}</td>
      <td>
        <button class="btn btn-sm btn-info me-2" onclick="editarAtividadeAdministrativa('${activity.id}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirAtividadeAdministrativa('${activity.id}')">Excluir</button>
      </td>
    `;
    activitiesTableBody.appendChild(row);
  });
}

async function carregarEquipesParaAtribuicao() {
  const teamSelect = document.getElementById('teamSelect');
  if (!teamSelect) return;
  teamSelect.innerHTML = '<option value="">-- Selecione a Equipe --</option>';

  const { data: teams, error } = await supabase.from('teams').select('id, name');
  if (error) {
    console.error("Erro ao carregar equipes para atribuição:", error);
    teamSelect.innerHTML = '<option value="">Erro ao carregar equipes.</option>';
    return;
  }
  teams.forEach(team => {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = team.name;
    teamSelect.appendChild(option);
  });
}

async function carregarAtividadesParaAtribuicao() {
  const activitySelect = document.getElementById('activitySelect');
  if (!activitySelect) return;
  activitySelect.innerHTML = '<option value="">-- Selecione a Atividade --</option>';

  const { data: activities, error } = await supabase.from('activities').select('id, name');
  if (error) {
    console.error("Erro ao carregar atividades para atribuição:", error);
    activitySelect.innerHTML = '<option value="">Erro ao carregar atividades.</option>';
    return;
  }
  activities.forEach(activity => {
    const option = document.createElement('option');
    option.value = activity.id;
    option.textContent = activity.name;
    activitySelect.appendChild(option);
  });
}

async function carregarUsuarios() {
  const usersList = document.getElementById('usersList');
  if (!usersList) return;

  usersList.innerHTML = '<li class="list-group-item text-muted">Carregando usuários...</li>';

  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Erro ao carregar usuários:', error);
    usersList.innerHTML = '<li class="list-group-item text-danger">Erro ao carregar usuários: ' + error.message + '</li>';
    return;
  }

  usersList.innerHTML = '';
  if (users.length === 0) {
    usersList.innerHTML = '<li class="list-group-item text-muted">Nenhum usuário encontrado.</li>';
    return;
  }

  users.forEach(user => {
    const item = document.createElement('li');
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

    item.innerHTML = `
      <span>${user.name || user.email} - <strong>${user.role}</strong></span>
      <div>
        ${user.role !== 'admin' ? `<button class="btn btn-sm btn-outline-primary me-2" onclick="promoverParaAdmin('${user.id}')">Promover a Admin</button>` : ''}
        ${user.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="excluirUsuarioComum('${user.id}')">Excluir</button>` : ''}
      </div>
    `;
    usersList.appendChild(item);
  });
}