import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequestReset() {
  const [email,setEmail] = useState(""); const [msg,setMsg] = useState("");
  return (
    <form onSubmit={async e=>{e.preventDefault();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` });
      setMsg(error ? error.message : "Check sua inbox.");
    }}>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button>Send reset link</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}