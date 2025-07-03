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

  await loadUserProfile();

  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('profileName').value;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ name: newName })
        .eq('id', user.id);

      if (error) throw error;

      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      alert("Erro ao atualizar perfil: " + error.message);
      console.error("Erro ao atualizar perfil:", error);
    }
  });

  document.getElementById('resetPasswordButton')?.addEventListener('click', async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return;
    }

    const userEmail = user.email;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/index.html`
      });

      if (error) throw error;

      alert("Um e-mail para redefinição de senha foi enviado para " + userEmail + ". Verifique sua caixa de entrada.");
    } catch (error) {
      alert("Erro ao solicitar redefinição de senha: " + error.message);
      console.error("Erro no resetPasswordForEmail:", error);
    }
  });
});

async function loadUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Usuário não autenticado. Redirecionando para login.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById('profileEmail').value = user.email;
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("Erro ao carregar nome do perfil:", error);
    document.getElementById('profileName').value = '';
  } else if (userProfile) {
    document.getElementById('profileName').value = userProfile.name || '';
  }
}