
- **O que estava acontecendo:** o `getClaims()` no runtime da Edge Function estava falhando e retornando “Token inválido” mesmo com `Authorization: Bearer ...`.
- **Correção aplicada:** na `admin-user-management`, agora eu extraio o JWT do header e valido com `supabaseAuth.auth.getUser(token)` (sem depender de sessão persistida).
- **Próximos passos (pra confirmar):**
  1) Faça **hard reload** na página `/usuarios` (Ctrl+Shift+R).  
  2) Tente criar o usuário novamente.  
  3) Se ainda der 401, faça **logout e login** de novo (para garantir token/sessão atualizados) e tente novamente.
