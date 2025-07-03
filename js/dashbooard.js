import { supabase } from './supabase.js';

    document.addEventListener('DOMContentLoaded', async () => {
      await carregarUsuario();

      document.getElementById('logoutButton').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = "index.html";
      });
    });

    async function carregarUsuario() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user) {
        alert("Sessão expirada ou não autenticada. Faça login novamente.");
        window.location.href = "index.html";
        return;
      }

      const userNameOrEmailElement = document.getElementById("userNameOrEmail");
      let displayName = user.email;

      const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('name, role')
          .eq('id', user.id)
          .single();

      if (profileError && profileError.code !== 'PGRST116') {
          console.error("Erro ao buscar perfil do usuário:", profileError);
      } else if (userProfile && userProfile.name) {
          displayName = userProfile.name;
      }
      userNameOrEmailElement.textContent = displayName;

      if (userProfile && userProfile.role === 'admin') {
        document.getElementById("adminButtons").style.display = 'block';
      }
    }