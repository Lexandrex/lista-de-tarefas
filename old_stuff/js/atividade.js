import { supabase } from './supabase.js';

let calendar;

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    } catch (error) {
      console.error("Erro ao sair:", error.message);
    }
  });

  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    eventClick: function(info) {
      openActivityDetailModal(info.event.extendedProps);
    },
    events: async function(fetchInfo, successCallback, failureCallback) {
      const activities = await loadUserActivitiesData();
      if (activities) {
        const events = activities.map(activity => ({
          id: activity.id,
          title: activity.name,
          start: activity.start_date,
          end: activity.due_date,
          extendedProps: activity,
          color: getActivityColor(activity.status)
        }));
        successCallback(events);
      } else {
        failureCallback();
      }
    }
  });
  calendar.render();

  await displayUserActivitiesList();

  document.getElementById('updateActivityForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const activityId = document.getElementById('detailActivityId').value;
    const newStatus = document.getElementById('detailActivityStatus').value;
    const newDueDate = document.getElementById('detailActivityDueDate').value;

    try {
      const { data: updateData, error: updateError } = await supabase
        .from('user_activities')
        .update({ status: newStatus, progress: (newStatus === 'completed' ? 100 : 0) })
        .eq('activity_id', activityId)
        .eq('user_id', (await supabase.auth.getUser()).data.user.id)

      if (updateError) throw updateError;

      alert("Progresso da atividade atualizado!");
      bootstrap.Modal.getInstance(document.getElementById('activityDetailModal')).hide();
      calendar.refetchEvents();
      await displayUserActivitiesList();
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      alert("Erro ao atualizar progresso da atividade: " + error.message);
    }
  });
});

async function loadUserActivitiesData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("Usuário não autenticado. Redirecionando para login.");
    window.location.href = "index.html";
    return null;
  }

  const { data, error } = await supabase
    .from('user_activities')
    .select(`
      activity_id,
      status, // Status do usuário para aquela atividade
      progress, // Progresso do usuário para aquela atividade
      activities (
        id,
        name,
        description,
        start_date,
        due_date,
        team_activities(
          teams(name) // Nome da equipe
        ),
        user_activities (
          users (name, email) // Membros atribuídos à mesma atividade
        )
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error("Erro ao carregar atividades do usuário:", error);
    return null;
  }

  const formattedActivities = data.map(ua => {
    const activity = ua.activities;
    const teamName = activity.team_activities.length > 0 ? activity.team_activities[0].teams.name : 'N/A';
    const assignedUsers = activity.user_activities.map(u => u.users.name || u.users.email).join(', ');

    return {
      id: activity.id,
      name: activity.name,
      description: activity.description,
      start_date: activity.start_date,
      due_date: activity.due_date,
      status: ua.status,
      progress: ua.progress,
      team_name: teamName,
      assigned_users_list: assignedUsers,
      original_user_activity_id: ua.activity_id
    };
  });

  return formattedActivities;
}

async function displayUserActivitiesList() {
  const activitiesListContainer = document.getElementById('activitiesListContainer');
  const loadingMessage = document.getElementById('loadingActivitiesMessage');
  const noActivitiesMessage = document.getElementById('noActivitiesMessage');

  loadingMessage.style.display = 'block';
  noActivitiesMessage.style.display = 'none';
  activitiesListContainer.innerHTML = '';

  const activities = await loadUserActivitiesData();

  loadingMessage.style.display = 'none';

  if (!activities || activities.length === 0) {
    noActivitiesMessage.style.display = 'block';
    return;
  }

  activities.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.classList.add('activity-item');
    activityItem.innerHTML = `
      <div class="activity-header" data-bs-toggle="collapse" data-bs-target="#activityDetails-${activity.id}">
          <span>${activity.name} - **Data de Entrega:** ${new Date(activity.due_date).toLocaleDateString()}</span>
          <span>**Status:** ${activity.status} <i class="bi bi-chevron-down"></i></span>
      </div>
      <div class="collapse activity-details" id="activityDetails-${activity.id}">
          <p><strong>Descrição:</strong> ${activity.description || 'N/A'}</p>
          <p><strong>Data de Início:</strong> ${new Date(activity.start_date).toLocaleDateString() || 'N/A'}</p>
          <p><strong>Data de Entrega:</strong> ${new Date(activity.due_date).toLocaleDateString() || 'N/A'}</p>
          <p><strong>Equipe:</strong> ${activity.team_name}</p>
          <p><strong>Usuários Atribuídos:</strong> ${activity.assigned_users_list}</p>
          <p><strong>Seu Progresso:</strong> ${activity.progress}%</p>
          <div class="d-flex justify-content-end">
            <button class="btn btn-sm btn-primary me-2 update-progress-btn" data-activity-id="${activity.id}">Atualizar Progresso</button>
          </div>
      </div>
    `;
    activitiesListContainer.appendChild(activityItem);
  });

  document.querySelectorAll('.update-progress-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const activityId = e.target.dataset.activityId;
      const selectedActivity = activities.find(act => act.id === activityId);
      if (selectedActivity) {
        openActivityDetailModal(selectedActivity);
      }
    });
  });
}

function openActivityDetailModal(activityData) {
  const modalElement = document.getElementById('activityDetailModal');
  const modal = new bootstrap.Modal(modalElement);

  document.getElementById('detailActivityId').value = activityData.id;
  document.getElementById('detailActivityName').value = activityData.name;
  document.getElementById('detailActivityDescription').value = activityData.description;
  document.getElementById('detailActivityStartDate').value = activityData.start_date;
  document.getElementById('detailActivityDueDate').value = activityData.due_date;
  document.getElementById('detailActivityStatus').value = activityData.status;
  document.getElementById('detailAssignedUsersList').textContent = activityData.assigned_users_list;

  modal.show();
}

function getActivityColor(status) {
  switch (status) {
    case 'pending': return '#dc3545';
    case 'in_progress': return '#ffc107';
    case 'completed': return '#28a745';
    default: return '#007bff';
  }
}