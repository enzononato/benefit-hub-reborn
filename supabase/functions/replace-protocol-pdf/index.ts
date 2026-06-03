// One-off admin tool to replace a protocol's PDF.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    const { protocol, source_url, file_name } = await req.json();
    if (!protocol || !source_url) {
      return new Response(JSON.stringify({ error: "missing params" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Download source
    const res = await fetch(source_url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "download failed", status: res.status }), { status: 500 });
    }
    const bytes = new Uint8Array(await res.arrayBuffer());

    const key = `${protocol}_${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("benefit-pdfs")
      .upload(key, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      return new Response(JSON.stringify({ error: "upload failed", detail: upErr.message }), { status: 500 });
    }

    const { data: pub } = supabase.storage.from("benefit-pdfs").getPublicUrl(key);

    const { data: updated, error: dbErr } = await supabase
      .from("benefit_requests")
      .update({ pdf_url: pub.publicUrl, pdf_file_name: file_name ?? key })
      .eq("protocol", protocol)
      .select("id, protocol, pdf_url, pdf_file_name")
      .single();
    if (dbErr) {
      return new Response(JSON.stringify({ error: "db update failed", detail: dbErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
