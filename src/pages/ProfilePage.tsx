import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, useRole } from "@/lib/role-context";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { perfil, vinculos, recarregarContexto, atualizarSenha } = useAuth();
  const { role } = useRole();
  const [nome, setNome] = useState(perfil?.nomeCompleto ?? "");
  const [telefone, setTelefone] = useState(perfil?.telefone ?? "");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState<string | null>(null);
  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mensagemSenha, setMensagemSenha] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  useEffect(() => {
    setNome(perfil?.nomeCompleto ?? "");
    setTelefone(perfil?.telefone ?? "");
  }, [perfil?.id, perfil?.nomeCompleto, perfil?.telefone]);

  async function salvarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!perfil) return;

    setSalvandoPerfil(true);
    setMensagemPerfil(null);
    setErroPerfil(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: nome.trim(),
          phone: telefone.trim() || null,
        })
        .eq("id", perfil.id);
      if (error) throw error;

      const resultado = await recarregarContexto();
      if (resultado.erro) throw new Error(resultado.erro);
      setMensagemPerfil("Dados do perfil atualizados.");
    } catch (error) {
      setErroPerfil(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function trocarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagemSenha(null);
    setErroSenha(null);

    if (senha.length < 6) {
      setErroSenha("A senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmacaoSenha) {
      setErroSenha("As senhas informadas não coincidem.");
      return;
    }

    setSalvandoSenha(true);
    try {
      const resultado = await atualizarSenha(senha);
      if (resultado.erro) {
        setErroSenha(resultado.erro);
      } else {
        setMensagemSenha("Senha alterada.");
        setSenha("");
        setConfirmacaoSenha("");
      }
    } catch (error) {
      setErroSenha(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <>
      <PageHeader title="Meu perfil" description="Seus dados pessoais e vínculos institucionais." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={salvarPerfil} className="space-y-4">
              <div>
                <Label htmlFor="perfil-nome">Nome completo</Label>
                <Input
                  id="perfil-nome"
                  autoComplete="name"
                  required
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="perfil-email">E-mail</Label>
                <Input id="perfil-email" type="email" value={perfil?.email ?? ""} readOnly disabled />
                <p className="mt-1 text-xs text-ink-soft">O e-mail da conta não pode ser alterado aqui.</p>
              </div>
              <div>
                <Label htmlFor="perfil-telefone">Telefone</Label>
                <Input
                  id="perfil-telefone"
                  type="tel"
                  autoComplete="tel"
                  value={telefone}
                  onChange={(event) => setTelefone(event.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              {erroPerfil && (
                <p role="alert" className="rounded-md bg-danger-tint p-3 text-sm text-danger-dark">{erroPerfil}</p>
              )}
              {mensagemPerfil && (
                <p role="status" className="rounded-md bg-ok-tint p-3 text-sm text-ok-dark">{mensagemPerfil}</p>
              )}
              <Button type="submit" disabled={salvandoPerfil}>
                {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={trocarSenha} className="space-y-4">
              <div>
                <Label htmlFor="perfil-senha">Nova senha</Label>
                <Input
                  id="perfil-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="perfil-confirmar-senha">Confirmar nova senha</Label>
                <Input
                  id="perfil-confirmar-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmacaoSenha}
                  onChange={(event) => setConfirmacaoSenha(event.target.value)}
                />
              </div>
              {erroSenha && (
                <p role="alert" className="rounded-md bg-danger-tint p-3 text-sm text-danger-dark">{erroSenha}</p>
              )}
              {mensagemSenha && (
                <p role="status" className="rounded-md bg-ok-tint p-3 text-sm text-ok-dark">{mensagemSenha}</p>
              )}
              <Button type="submit" disabled={salvandoSenha}>
                {salvandoSenha ? "Salvando..." : "Alterar senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vínculos institucionais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-ink-soft">
            Papel global: {role ? roleLabels[role] : "Não definido"}
          </p>
          {vinculos.length ? (
            <ul className="space-y-3">
              {vinculos.map((vinculo) => (
                <li key={vinculo.id} className="rounded-md border border-line p-4">
                  <p className="font-semibold text-ink">{vinculo.institutionName}</p>
                  <p className="mt-1 text-sm text-ink-soft">{roleLabels[vinculo.role]}</p>
                  {vinculo.setores.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                      {vinculo.setores.map((setor) => (
                        <li key={setor.id}>
                          {setor.nome}
                          {setor.cargo ? ` · ${setor.cargo}` : ""}
                          {setor.eGerente ? " · Gerente do setor" : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : perfil?.ePlatformAdmin ? (
            <p className="text-sm text-ink-soft">Sua conta não possui vínculo institucional.</p>
          ) : (
            <p className="text-sm text-ink-soft">Nenhum vínculo institucional ativo.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
