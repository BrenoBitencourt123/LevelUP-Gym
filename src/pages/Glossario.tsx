import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, Search, ChevronDown, ChevronUp } from "lucide-react";
import { GLOSSARIO, type GlossaryCategory, type GlossaryItem } from "@/content/glossario";

const filterItems = (items: GlossaryItem[], search: string, category: GlossaryCategory | "all") => {
  const query = search.toLowerCase().trim();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.short.toLowerCase().includes(query) ||
      item.practical.toLowerCase().includes(query) ||
      item.aka?.some((aka) => aka.toLowerCase().includes(query))
    );
  });
};

const Glossario = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GlossaryCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const items = useMemo(() => filterItems(GLOSSARIO, search, category), [search, category]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Glossário</h1>
            <p className="text-sm text-muted-foreground">Termos rápidos de treino, nutrição e segurança.</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar termo, apelido ou dica prática"
            className="pl-9"
          />
        </div>

        <Tabs value={category} onValueChange={(val) => setCategory(val as GlossaryCategory | "all")}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Tudo</TabsTrigger>
            <TabsTrigger value="Treino">Treino</TabsTrigger>
            <TabsTrigger value="Nutricao">Nutrição</TabsTrigger>
            <TabsTrigger value="Seguranca">Segurança</TabsTrigger>
          </TabsList>
          <TabsContent value={category} className="mt-0" />
        </Tabs>

        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="card-glass border border-border/50 rounded-xl px-4 py-3 cursor-pointer"
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.short}</p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {isOpen && (
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="text-foreground font-medium">Como aplicar</p>
                    <p>{item.practical}</p>
                    {item.examples.length > 0 && (
                      <div>
                        <p className="text-foreground font-medium">Exemplos</p>
                        <ul className="list-disc list-inside space-y-1">
                          {item.examples.map((ex) => (
                            <li key={ex}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <details className="mt-1">
                      <summary className="text-foreground font-medium cursor-pointer">
                        Ver detalhe técnico
                      </summary>
                      <p className="mt-1 text-muted-foreground">{item.technical}</p>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">Nada encontrado.</p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Glossario;
