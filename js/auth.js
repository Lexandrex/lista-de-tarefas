import { supabase } from './supabase.js';

// Registro
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const senha = document.getElementById('registerSenha').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: `${location.origin}/dashboard.html`
    }
  });

  if (error) {
    alert("Erro ao registrar: " + error.message);
    return;
  }

  // Define role automática com base no e-mail
  const userId = data.user?.id;
  const role = email === 'lexandresebastiam@gmail.com' ? 'admin' : 'user';

  if (userId) {
    const { error: insertError } = await supabase.from('users').insert([
      { id: userId, role }
    ]);

    if (insertError) {
      alert("Erro ao salvar informações do usuário: " + insertError.message);
    } else {
      alert(`Registro realizado como ${role}! Verifique seu e-mail para ativar a conta.`);
    }
  }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const senha = document.getElementById('loginSenha').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    alert("Erro ao entrar: " + error.message);
    return;
  }

  if (!data.user.email_confirmed_at) {
    alert("Você precisa confirmar seu e-mail antes de fazer login.");
    await supabase.auth.signOut();
    return;
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (perfilError) {
    alert("Erro ao buscar perfil do usuário.");
    return;
  }

  if (perfil.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'dashboard.html';
  }
});
