import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Institution = {
  id: string;
  name: string;
  cnpj: string | null;
  timezone: string;
  status: "active" | "inactive";
};

type CreatedInstitution = {
  institution_id: string;
  invitation_id: string;
  token: string;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Não foi possível concluir a operação.";
}

function invitationLink(token: string) {
  return `${window.location.origin}/convite/${token}`;
}

function MessageBox({
  children,
  variant,
  role,
}: {
  children: React.ReactNode;
  variant: "danger" | "info" | "success";
  role: "alert" | "status";
}) {
  const styles = {
    danger: "bg-danger-tint text-danger-dark",
    info: "bg-brand-tint text-brand-dark",
    success: "bg-ok-tint text-ok-dark",
  };
  return <div role={role} className={`rounded-md p-3 text-sm ${styles[variant]}`}>{children}</div>;
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setInstitutions(null);
      setError("Supabase não está configurado neste ambiente. Configure a URL e a chave pública do projeto no Vercel e publique novamente.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("institutions")
      .select("id, name, cnpj, timezone, status")
      .order("name");

    if (queryError) {
      setError(errorMessage(queryError));
      setInstitutions(null);
    } else {
      setInstitutions((data ?? []) as Institution[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadInstitutions();
  }, [loadInstitutions]);

  async function createInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase não está configurado neste ambiente. Configure a URL e a chave pública do projeto no Vercel e publique novamente.");
      return;
    }

    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError(null);
    setSuccess(null);
    setInviteUrl(null);

    try {
      const { data, error: createError } = await supabase.rpc("create_institution", {
        p_name: String(values.get("name")).trim(),
        p_cnpj: String(values.get("cnpj") ?? "").trim(),
        p_timezone: String(values.get("timezone")).trim(),
        p_admin_email: String(values.get("adminEmail")).trim(),
      });
      if (createError) throw createError;
      if (!data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string") {
        throw new Error("A instituição foi criada, mas o banco não retornou o link de convite esperado.");
      }

      const result = data as CreatedInstitution;
      setInviteUrl(invitationLink(result.token));
      setSuccess("Instituição criada. Compartilhe o link abaixo com o administrador; nenhum e-mail é enviado automaticamente.");
      form.reset();
      await loadInstitutions();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setBusy(false);
    }
  }

  async function toggleInstitution(institution: Institution) {
    setError(null);
    setSuccess(null);
    const nextStatus = institution.status === "active" ? "inactive" : "active";

    try {
      const { data, error: updateError } = await supabase
        .from("institutions")
        .update({ status: nextStatus })
        .eq("id", institution.id)
        .select("id")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("Nenhuma instituição foi alterada. Verifique seu acesso de administrador da plataforma.");
      setSuccess(`Instituição ${nextStatus === "active" ? "ativada" : "desativada"}.`);
      await loadInstitutions();
    } catch (updateError) {
      setError(errorMessage(updateError));
    }
  }

  async function copyInvitation() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSuccess("Link de convite copiado.");
    } catch (copyError) {
      setError(`Não foi possível copiar o link: ${errorMessage(copyError)}`);
    }
  }

  return (
    <>
      <PageHeader
        title="Instituições"
        description="Cadastre hospitais, clínicas e UPAs e gere um convite para o administrador de cada instituição."
      />

      {error && <MessageBox variant="danger" role="alert">{error}</MessageBox>}
      {success && <MessageBox variant="success" role="status">{success}</MessageBox>}

      {inviteUrl && (
        <MessageBox variant="info" role="status">
          <div className="mt-3 space-y-3">
          <p className="break-all font-mono text-sm">{inviteUrl}</p>
          <Button size="sm" variant="outline" onClick={() => void copyInvitation()}>
            Copiar link de convite
          </Button>
          </div>
        </MessageBox>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader><CardTitle>Nova instituição</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createInstitution} className="space-y-4">
              <div>
                <Label htmlFor="institution-name">Nome</Label>
                <Input id="institution-name" name="name" autoComplete="organization" required />
              </div>
              <div>
                <Label htmlFor="institution-cnpj">CNPJ (opcional)</Label>
                <Input id="institution-cnpj" name="cnpj" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="institution-timezone">Fuso horário</Label>
                <Input id="institution-timezone" name="timezone" defaultValue="America/Sao_Paulo" required />
              </div>
              <div>
                <Label htmlFor="institution-admin-email">E-mail do administrador</Label>
                <Input id="institution-admin-email" name="adminEmail" type="email" autoComplete="email" required />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !isSupabaseConfigured}>
                {busy ? "Cadastrando…" : "Cadastrar e gerar convite"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Instituições cadastradas</CardTitle></CardHeader>
          <CardContent>
            {loading && <p role="status" className="text-sm text-ink-soft">Carregando instituições…</p>}
            {!loading && institutions === null && (
              <p className="text-sm text-ink-soft">Não foi possível carregar a lista.</p>
            )}
            {institutions?.length === 0 && (
              <p className="text-sm text-ink-soft">Nenhuma instituição cadastrada.</p>
            )}
            {institutions && institutions.length > 0 && (
              <ul className="divide-y divide-line">
                {institutions.map((institution) => (
                  <li key={institution.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="font-bold">{institution.name}</p>
                      <p className="text-sm text-ink-soft">
                        {[institution.cnpj, institution.timezone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={institution.status === "active" ? "success" : "neutral"}>
                        {institution.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void toggleInstitution(institution)}
                      >
                        {institution.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
