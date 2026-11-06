import { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  UserX,
  X,
  Copy,
  Check,
  Building2,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type Profissional = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  coren: string;
  papel: "manager" | "professional" | "admin";
  rotuloPapel: string;
  cargo: "Enfermeiro(a) Chefe" | "Enfermeiro(a) Plantonista" | "Técnico(a) de Enfermagem";
  setores: string[];
  status: "active" | "invited" | "inactive";
  plantoesNoMes: number;
  corAvatar: string;
};

const profissionaisIniciais: Profissional[] = [
  {
    id: "p1",
    nome: "Ana Souza",
    email: "ana.souza@hospital.com.br",
    telefone: "(11) 98765-4321",
    coren: "COREN-SP 142.890-ENF",
    papel: "manager",
    rotuloPapel: "Coordenadora",
    cargo: "Enfermeiro(a) Chefe",
    setores: ["UTI Adulto", "Semi-intensiva"],
    status: "active",
    plantoesNoMes: 12,
    corAvatar: "bg-brand text-white",
  },
  {
    id: "p2",
    nome: "João Lima",
    email: "joao.lima@hospital.com.br",
    telefone: "(11) 97654-3210",
    coren: "COREN-SP 210.450-ENF",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Enfermeiro(a) Plantonista",
    setores: ["UTI Adulto"],
    status: "active",
    plantoesNoMes: 14,
    corAvatar: "bg-navy text-white",
  },
  {
    id: "p3",
    nome: "Maria Costa",
    email: "maria.costa@hospital.com.br",
    telefone: "(11) 96543-2109",
    coren: "COREN-SP 305.120-ENF",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Enfermeiro(a) Plantonista",
    setores: ["UTI Adulto", "Pronto Atendimento"],
    status: "active",
    plantoesNoMes: 13,
    corAvatar: "bg-emerald-600 text-white",
  },
  {
    id: "p4",
    nome: "Carlos Alves",
    email: "carlos.alves@hospital.com.br",
    telefone: "(11) 95432-1098",
    coren: "COREN-SP 412.980-TE",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Técnico(a) de Enfermagem",
    setores: ["UTI Adulto"],
    status: "active",
    plantoesNoMes: 15,
    corAvatar: "bg-indigo-600 text-white",
  },
  {
    id: "p5",
    nome: "Paula Reis",
    email: "paula.reis@hospital.com.br",
    telefone: "(11) 94321-0987",
    coren: "COREN-SP 523.411-TE",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Técnico(a) de Enfermagem",
    setores: ["UTI Adulto"],
    status: "active",
    plantoesNoMes: 14,
    corAvatar: "bg-teal-600 text-white",
  },
  {
    id: "p6",
    nome: "Rafael Martins",
    email: "rafael.martins@hospital.com.br",
    telefone: "(11) 93210-9876",
    coren: "COREN-SP 634.789-ENF",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Enfermeiro(a) Plantonista",
    setores: ["Pronto Atendimento"],
    status: "invited",
    plantoesNoMes: 0,
    corAvatar: "bg-amber-600 text-white",
  },
  {
    id: "p7",
    nome: "Beatriz Oliveira",
    email: "beatriz.oliveira@hospital.com.br",
    telefone: "(11) 92109-8765",
    coren: "COREN-SP 745.890-TE",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Técnico(a) de Enfermagem",
    setores: ["Bloco Cirúrgico"],
    status: "invited",
    plantoesNoMes: 0,
    corAvatar: "bg-purple-600 text-white",
  },
  {
    id: "p8",
    nome: "Lucas Fernandes",
    email: "lucas.fernandes@hospital.com.br",
    telefone: "(11) 91098-7654",
    coren: "COREN-SP 856.901-TE",
    papel: "professional",
    rotuloPapel: "Profissional",
    cargo: "Técnico(a) de Enfermagem",
    setores: ["UTI Adulto"],
    status: "inactive",
    plantoesNoMes: 0,
    corAvatar: "bg-slate-500 text-white",
  },
];

export default function ProfessionalsPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>(profissionaisIniciais);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCargo, setFiltroCargo] = useState("todos");

  // Estado do Modal de Convite
  const [modalConviteAberto, setModalConviteAberto] = useState(false);
  const [nomeConvite, setNomeConvite] = useState("");
  const [emailConvite, setEmailConvite] = useState("");
  const [telefoneConvite, setTelefoneConvite] = useState("");
  const [corenConvite, setCorenConvite] = useState("");
  const [cargoConvite, setCargoConvite] = useState<Profissional["cargo"]>("Enfermeiro(a) Plantonista");
  const [setorConvite, setSetorConvite] = useState("UTI Adulto");
  const [papelConvite, setPapelConvite] = useState<"professional" | "manager">("professional");
  const [tokenCopiado, setTokenCopiado] = useState<string | null>(null);

  // Filtragem dinâmica dos profissionais
  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter((prof) => {
      const correspondeBusca =
        prof.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        prof.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
        prof.coren.toLowerCase().includes(termoBusca.toLowerCase());

      const correspondeSetor = filtroSetor === "todos" || prof.setores.includes(filtroSetor);
      const correspondeStatus = filtroStatus === "todos" || prof.status === filtroStatus;
      const correspondeCargo = filtroCargo === "todos" || prof.cargo === filtroCargo;

      return correspondeBusca && correspondeSetor && correspondeStatus && correspondeCargo;
    });
  }, [profissionais, termoBusca, filtroSetor, filtroStatus, filtroCargo]);

  // Indicadores numéricos
  const metricas = useMemo(() => {
    const total = profissionais.length;
    const ativos = profissionais.filter((p) => p.status === "active").length;
    const convitesPendentes = profissionais.filter((p) => p.status === "invited").length;
    const coordenadores = profissionais.filter((p) => p.papel === "manager").length;
    return { total, ativos, convitesPendentes, coordenadores };
  }, [profissionais]);

  // Ação de criar convite
  const criarConvite = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!nomeConvite || !emailConvite) return;

    const novoProfissional: Profissional = {
      id: `prof-${Date.now()}`,
      nome: nomeConvite,
      email: emailConvite,
      telefone: telefoneConvite || "(11) 90000-0000",
      coren: corenConvite || "Em validação",
      papel: papelConvite,
      rotuloPapel: papelConvite === "manager" ? "Coordenador(a)" : "Profissional",
      cargo: cargoConvite,
      setores: [setorConvite],
      status: "invited",
      plantoesNoMes: 0,
      corAvatar: "bg-brand text-white",
    };

    setProfissionais([novoProfissional, ...profissionais]);
    setModalConviteAberto(false);
    setNomeConvite("");
    setEmailConvite("");
    setTelefoneConvite("");
    setCorenConvite("");
  };

  const copiarLinkConvite = (id: string) => {
    const linkSimulado = `https://plantaomais.com.br/convite/tok_${id}_hosp-santa-maria`;
    navigator.clipboard?.writeText(linkSimulado);
    setTokenCopiado(id);
    setTimeout(() => setTokenCopiado(null), 3000);
  };

  return (
    <>
      <PageHeader
        title="Profissionais"
        description="Equipe de enfermagem cadastrada, cargos e vínculos com setores do Hospital Santa Maria."
        action={
          <Button
            onClick={() => setModalConviteAberto(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Convidar profissional
          </Button>
        }
      />

      {/* Cards de Métricas */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-brand">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Total de Profissionais</p>
            <p className="mt-1 text-2xl font-bold text-ink">{metricas.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-ok">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Vínculos Ativos</p>
            <p className="mt-1 text-2xl font-bold text-ok-dark">{metricas.ativos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warn">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Convites Pendentes</p>
            <p className="mt-1 text-2xl font-bold text-warn-dark">{metricas.convitesPendentes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-navy">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Gerência / Coordenação</p>
            <p className="mt-1 text-2xl font-bold text-navy">{metricas.coordenadores}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Input de Busca */}
            <div className="relative min-w-0 flex-1 lg:min-w-[16rem]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <Input
                placeholder="Buscar nome, e-mail ou COREN"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="min-w-0 pl-9"
              />
            </div>

            {/* Filtros em Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-ink-soft" />
                <span className="text-sm font-semibold text-ink-soft">Filtros:</span>
              </div>

              {/* Setor */}
              <select
                aria-label="Filtrar por setor"
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="h-11 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
              >
                <option value="todos">Todos os setores</option>
                <option value="UTI Adulto">UTI Adulto</option>
                <option value="Pronto Atendimento">Pronto Atendimento</option>
                <option value="Semi-intensiva">Semi-intensiva</option>
                <option value="Bloco Cirúrgico">Bloco Cirúrgico</option>
              </select>

              {/* Cargo */}
              <select
                aria-label="Filtrar por cargo"
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value)}
                className="h-11 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
              >
                <option value="todos">Todos os cargos</option>
                <option value="Enfermeiro(a) Chefe">Enfermeiro(a) Chefe</option>
                <option value="Enfermeiro(a) Plantonista">Enfermeiro(a) Plantonista</option>
                <option value="Técnico(a) de Enfermagem">Técnico(a) de Enfermagem</option>
              </select>

              {/* Status */}
              <select
                aria-label="Filtrar por status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="h-11 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
              >
                <option value="todos">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="invited">Convite pendente</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Profissionais */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">Profissional</th>
                  <th className="px-4 py-3 font-semibold">Cargo / Função</th>
                  <th className="px-4 py-3 font-semibold">Setores Vinculados</th>
                  <th className="px-4 py-3 font-semibold">Plantões no Mês</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="sticky right-0 bg-surface px-4 py-3 text-right font-semibold shadow-[-8px_0_8px_-8px_rgba(19,42,38,0.18)]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {profissionaisFiltrados.map((prof) => (
                  <tr key={prof.id} className="transition-colors hover:bg-surface/60">
                    {/* Identificação */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${prof.corAvatar}`}
                        >
                          {prof.nome
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{prof.nome}</span>
                            {prof.papel === "manager" && (
                              <span className="inline-flex items-center gap-1 rounded bg-navy/10 px-1.5 py-0.5 text-[11px] font-semibold text-navy">
                                <Shield className="h-3 w-3" /> Gerência
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-soft">
                            <span className="font-medium">{prof.coren}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" aria-hidden="true" /> {prof.email}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" aria-hidden="true" /> {prof.telefone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5 font-medium text-ink">
                        <Stethoscope className="h-4 w-4 text-brand" />
                        {prof.cargo}
                      </div>
                    </td>

                    {/* Setores */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {prof.setores.map((setor) => (
                          <span
                            key={setor}
                            className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-ink border border-line"
                          >
                            <Building2 className="h-3 w-3 text-brand" />
                            {setor}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Plantões */}
                    <td className="px-4 py-3 align-top">
                      <span className="font-bold text-ink">
                        {prof.plantoesNoMes} <span className="text-xs font-normal text-ink-soft">plantões</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 align-top">
                      {prof.status === "active" && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ativo
                        </Badge>
                      )}
                      {prof.status === "invited" && (
                        <Badge variant="warning" className="gap-1">
                          <Clock className="h-3 w-3" /> Convite pendente
                        </Badge>
                      )}
                      {prof.status === "inactive" && (
                        <Badge variant="neutral" className="gap-1">
                          <UserX className="h-3 w-3" /> Inativo
                        </Badge>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="sticky right-0 bg-white px-4 py-3 text-right align-top shadow-[-8px_0_8px_-8px_rgba(19,42,38,0.18)]">
                      {prof.status === "invited" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copiarLinkConvite(prof.id)}
                          className="gap-1.5 text-xs font-semibold"
                        >
                          {tokenCopiado === prof.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-ok" />
                              Link copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copiar convite
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-ink-soft hover:text-ink">
                          Editar vínculo
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {profissionaisFiltrados.length === 0 && (
              <div className="py-12 text-center text-ink-soft">
                <Users className="mx-auto h-8 w-8 text-ink-soft/40" />
                <p className="mt-2 font-medium">Nenhum profissional encontrado com os filtros selecionados.</p>
              </div>
            )}
          </div>
          <p className="border-t border-line px-4 py-2 text-xs text-ink-soft xl:hidden">
            ← Arraste a tabela para o lado para ver a coluna de ações →
          </p>
        </CardContent>
      </Card>

      {/* Modal de Convidar Profissional */}
      {modalConviteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Convidar novo profissional</h2>
                <p className="text-xs text-ink-soft">
                  Um convite de ativação com link exclusivo será gerado para o e-mail informado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalConviteAberto(false)}
                className="rounded-md p-1.5 text-ink-soft hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={criarConvite} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Nome Completo *
                </label>
                <Input
                  required
                  placeholder="Ex: Dra. Juliana Santos"
                  value={nomeConvite}
                  onChange={(e) => setNomeConvite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    E-mail institucional *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="juliana@hospital.com.br"
                    value={emailConvite}
                    onChange={(e) => setEmailConvite(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Telefone WhatsApp
                  </label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={telefoneConvite}
                    onChange={(e) => setTelefoneConvite(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Número do COREN
                  </label>
                  <Input
                    placeholder="COREN-SP 987.654-ENF"
                    value={corenConvite}
                    onChange={(e) => setCorenConvite(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Cargo / Função
                  </label>
                  <select
                    value={cargoConvite}
                    onChange={(e) => setCargoConvite(e.target.value as any)}
                    className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="Enfermeiro(a) Chefe">Enfermeiro(a) Chefe</option>
                    <option value="Enfermeiro(a) Plantonista">Enfermeiro(a) Plantonista</option>
                    <option value="Técnico(a) de Enfermagem">Técnico(a) de Enfermagem</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Setor Principal
                  </label>
                  <select
                    value={setorConvite}
                    onChange={(e) => setSetorConvite(e.target.value)}
                    className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="UTI Adulto">UTI Adulto</option>
                    <option value="Pronto Atendimento">Pronto Atendimento</option>
                    <option value="Semi-intensiva">Semi-intensiva</option>
                    <option value="Bloco Cirúrgico">Bloco Cirúrgico</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Papel de Acesso
                  </label>
                  <select
                    value={papelConvite}
                    onChange={(e) => setPapelConvite(e.target.value as any)}
                    className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="professional">Profissional (Operacional)</option>
                    <option value="manager">Gerente / Coordenador(a)</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg bg-surface p-3 text-xs text-ink-soft border border-line">
                💡 O profissional receberá um e-mail com instruções para cadastrar sua senha. O vínculo com o hospital só é ativado após o aceite.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalConviteAberto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Gerar e enviar convite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
