import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [pw,setPw] = useState(""); const [ok,setOk] = useState("");
  useEffect(()=>{ supabase.auth.onAuthStateChange(async (e, s)=>{
    if (e === "PASSWORD_RECOVERY" && s) {/* aqui ja ta atuh pra reset de sneha*/}
  }); }, []);
  return (
    <form onSubmit={async e=>{e.preventDefault();
      const { error } = await supabase.auth.updateUser({ password: pw });
      setOk(error ? error.message : "Senha updated");
    }}>
      <input type="password" placeholder="new password" value={pw} onChange={e=>setPw(e.target.value)} />
      <button>Update</button>
      {ok && <p>{ok}</p>}
    </form>
  );
}