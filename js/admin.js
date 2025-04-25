import { supabase } from './supabase.js';
// Logout
document.addEventListener('DOMContentLoaded', () => {
  // Selecionando o botão de logout
  const logoutButton = document.getElementById('logoutButton');

  // Adicionando o evento de clique no botão de logout
  logoutButton.addEventListener('click', async () => {
    try {
      // Realizando o logout com o Supabase
      await supabase.auth.signOut();

      // Redirecionando para a página de login
      window.location.href = "index.html";
    } catch (error) {
      console.error("Erro ao sair:", error.message);
    }
  });
});

async function verificarAdmin() {
  // Obtém o usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Usuário não autenticado.");
    window.location.href = "index.html";
    return;
  }

  // Faz uma consulta na tabela 'users' para buscar o papel do usuário
  const { data, error } = await supabase
    .from('users')
    .select('role')  // Selecione a coluna 'role'
    .eq('id', user.id)  // Filtra pela ID do usuário autenticado
    .single();  // Espera um único resultado, pois cada usuário tem um papel único

  if (error) {
    console.error("Erro ao buscar o papel do usuário:", error);
    alert("Erro ao verificar o papel do usuário.");
    return;
  }

  if (data && data.role !== 'admin') {
    alert("Acesso restrito ao administrador.");
    window.location.href = "dashboard.html";
  }
}

  
  // Função para carregar equipes e atividades
  async function carregarEquipes() {
    const { data: teams, error } = await supabase.from('teams').select('*');
    if (error) {
      console.error(error);
      return;
    }
    const teamsList = document.getElementById('teamsList');
    const teamSelect = document.getElementById('teamSelect');
    teamsList.innerHTML = '';
    teamSelect.innerHTML = '';
    teams.forEach(team => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');
      listItem.textContent = team.name;
      teamsList.appendChild(listItem);
  
      const option = document.createElement('option');
      option.value = team.id;
      option.textContent = team.name;
      teamSelect.appendChild(option);
    });
  }
  
  async function carregarAtividades() {
    const { data: activities, error } = await supabase.from('activities').select('*');
    if (error) {
      console.error(error);
      return;
    }
    const activitiesList = document.getElementById('activitiesList');
    const activitySelect = document.getElementById('activitySelect');
    activitiesList.innerHTML = '';
    activitySelect.innerHTML = '';
    activities.forEach(activity => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');
      listItem.textContent = activity.name;
      activitiesList.appendChild(listItem);
  
      const option = document.createElement('option');
      option.value = activity.id;
      option.textContent = activity.name;
      activitySelect.appendChild(option);
    });
  }
  
  // Criar equipe
  document.getElementById('createTeamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamName = document.getElementById('teamName').value;
    const { data, error } = await supabase.from('teams').insert([{ name: teamName }]);
    if (error) {
      alert("Erro ao criar equipe: " + error.message);
    } else {
      alert("Equipe criada com sucesso!");
      carregarEquipes(); // Recarrega a lista de equipes
    }
  });
  
  // Criar atividade
  document.getElementById('createActivityForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('activityName').value;
    const description = document.getElementById('activityDescription').value;
    const { data, error } = await supabase.from('activities').insert([{ name, description }]);
    if (error) {
      alert("Erro ao criar atividade: " + error.message);
    } else {
      alert("Atividade criada com sucesso!");
      carregarAtividades(); // Recarrega a lista de atividades
    }
  });
  
  // Atribuir atividade à equipe
  document.getElementById('assignActivityForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamId = document.getElementById('teamSelect').value;
    const activityId = document.getElementById('activitySelect').value;
    const { data, error } = await supabase.from('team_activities').insert([{ team_id: teamId, activity_id: activityId }]);
    if (error) {
      alert("Erro ao atribuir atividade: " + error.message);
    } else {
      alert("Atividade atribuída à equipe com sucesso!");
    }
  });

  async function promoverParaAdmin(targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
  
    const response = await fetch('/api/promover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user.id,
        targetUserId
      })
    });
  
    const result = await response.json();
    if (result.error) {
      alert("Erro ao promover usuário: " + result.error);
    } else {
      alert("Usuário promovido com sucesso!");
    }
  }

  async function carregarUsuarios() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
  
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Erro ao carregar usuários:', error);
      return;
    }
  
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
  
    users.forEach(user => {
      const item = document.createElement('li');
      item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
      item.innerHTML = `
        <span>${user.name || user.email} - <strong>${user.role}</strong></span>
        ${user.role !== 'admin' ? `<button class="btn btn-sm btn-outline-primary" onclick="promoverParaAdmin('${user.id}')">Promover a Admin</button>` : ''}
      `;
      usersList.appendChild(item);
    });
  }
  
  document.getElementById('usuarios-tab')?.addEventListener('click', () => {
    carregarUsuarios();
  });
  
  
  
  verificarAdmin();
  carregarEquipes();
  carregarAtividades();
  