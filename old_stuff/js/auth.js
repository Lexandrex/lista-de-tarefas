import { supabase } from './supabase.js';

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
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
    console.error("Erro no registro Auth:", error);
    return;
  }
  const userId = data.user?.id;
  const role = email === 'lexandresebastiam@gmail.com' ? 'admin' : 'user';

  if (userId) {
    const { error: insertError } = await supabase.from('users').insert([
      { id: userId, role, name: name, email: email }
    ]);

    if (insertError) {
      alert("Erro ao salvar informações do usuário: " + insertError.message);
      console.error("Erro no insert da tabela users:", insertError);
    } else {
      alert(`Registro realizado como ${role}!`);
    }
  }
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const senha = document.getElementById('loginSenha').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    alert("Erro ao entrar: " + error.message);
    console.error("Erro no login:", error);
    return;
  }

  // verificação de email_confirmed_at, por enquanto tem q deixa comentado
  /*
  if (!data.user.email_confirmed_at) { blablala }
  */

  console.log("Login Supabase Auth bem-sucedido. Dados do usuário:", data.user);

  const { data: perfil, error: perfilError } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', data.user.id)
    .single();

  if (perfilError) {
    alert("Erro ao buscar perfil do usuário. Por favor, tente novamente.");
    console.error("Erro ao buscar perfil na tabela users:", perfilError);
    await supabase.auth.signOut();
    return;
  }

  console.log("Perfil encontrado. Papel (role):", perfil.role, "Nome:", perfil.name);
 if (perfil.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'dashboard.html';
  }
});

document.getElementById('resetPasswordButton').addEventListener('click', async () => {
  console.log("Botão 'Redefinir Senha' clicado.");

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    console.error("Usuário não logado ao tentar redefinir senha.");
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

  const userEmail = user.email;
  console.log("Solicitando redefinição de senha para o email:", userEmail);
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(userEmail, {
    redirectTo: `${window.location.origin}/index.html`
  });

  if (resetError) {
    console.error("Erro no resetPasswordForEmail (Supabase Auth):", resetError.message);
    alert("Erro ao solicitar redefinição de senha: " + resetError.message);
  } else {
    console.log("E-mail de redefinição de senha solicitado com sucesso.");
    alert("Um e-mail para redefinição de senha foi enviado para " + userEmail + ". Verifique sua caixa de entrada.");
  }
});