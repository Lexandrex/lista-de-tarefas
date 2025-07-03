async function logout() {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    }

    async function carregarEquipes() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "index.html";
        return;
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('teams(name, id)')
        .eq('user_id', user.id);

      if (error) {
        console.error("Erro ao carregar equipes:", error);
        return;
      }

      const teamsList = document.getElementById('teamsList');
      if (data.length === 0) {
        teamsList.innerHTML = '<p class="text-muted">Você não pertence a nenhuma equipe ainda.</p>';
      } else {
        teamsList.innerHTML = '';
        data.forEach(member => {
          const team = member.teams;
          const listItem = document.createElement('a');
          listItem.classList.add('list-group-item', 'list-group-item-action');
          listItem.href = `detalhesEquipe.html?teamId=${team.id}`;
          listItem.textContent = team.name;
          teamsList.appendChild(listItem);
        });
      }
    }

    carregarEquipes();