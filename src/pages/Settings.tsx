import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Ruler,
  Globe,
  Palette,
  Bell,
  FileText,
  Shield,
  AlertTriangle,
  Info,
  LogOut,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";
import AvatarFrame from "@/components/AvatarFrame";
import { getProfile, saveProfile } from "@/lib/storage";

const Settings = () => {
  const [workoutReminder, setWorkoutReminder] = useState(true);
  const [mealReminder, setMealReminder] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [profile, setProfile] = useState(getProfile());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = typeof reader.result === "string" ? reader.result : "";
      const nextProfile = { ...profile, avatarUrl };
      saveProfile(nextProfile);
      setProfile(nextProfile);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = () => {
    const nextProfile = { ...profile, avatarUrl: undefined };
    saveProfile(nextProfile);
    setProfile(nextProfile);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        </div>

        {/* Conta */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Conta</h2>

          <div className="flex items-center gap-4 mb-4">
            <AvatarFrame
              level={profile.level}
              avatarUrl={profile.avatarUrl}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Foto de perfil</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="px-3 py-1 rounded-lg bg-secondary/60 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  Alterar foto
                </button>
                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="px-3 py-1 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <User size={18} className="text-muted-foreground" />
                <span className="text-foreground">Nome</span>
              </div>
              <span className="text-muted-foreground">Breno</span>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-muted-foreground" />
                <span className="text-foreground">E-mail</span>
              </div>
              <span className="text-muted-foreground text-sm">breno@email.com</span>
            </div>

            <div className="h-px bg-border/50" />

            <button className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-muted-foreground" />
                <span className="text-foreground">Alterar senha</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Preferências */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Preferências</h2>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Ruler size={18} className="text-muted-foreground" />
                <span className="text-foreground">Unidades</span>
              </div>
              <span className="text-muted-foreground">kg</span>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-muted-foreground" />
                <span className="text-foreground">Idioma</span>
              </div>
              <span className="text-muted-foreground text-sm">Português (Brasil)</span>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-muted-foreground" />
                <span className="text-foreground">Tema</span>
              </div>
              <div className="flex bg-muted/30 rounded-lg p-0.5">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      theme === t
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Sistema"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Notificações</h2>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-muted-foreground" />
                <span className="text-foreground">Lembrete de treino</span>
              </div>
              <Switch checked={workoutReminder} onCheckedChange={setWorkoutReminder} />
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-muted-foreground" />
                <span className="text-foreground">Lembrete de alimentação</span>
              </div>
              <Switch checked={mealReminder} onCheckedChange={setMealReminder} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Você pode ajustar horários depois.
          </p>
        </div>

        {/* App */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">App</h2>

          <div className="space-y-1">
            <button className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-muted-foreground" />
                <span className="text-foreground">Termos de uso</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <div className="h-px bg-border/50" />

            <button className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-muted-foreground" />
                <span className="text-foreground">Privacidade</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <div className="h-px bg-border/50" />

            <button className="flex items-center justify-between py-3 w-full">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-muted-foreground" />
                <span className="text-foreground">Disclaimer</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-muted-foreground" />
                <span className="text-foreground">Versão do app</span>
              </div>
              <span className="text-muted-foreground">0.1</span>
            </div>
          </div>
        </div>

        {/* Sair */}
        <button className="w-full card-glass flex items-center justify-center gap-2 py-4 rounded-2xl border border-border/50 hover:border-muted-foreground/30 transition-colors mb-6">
          <LogOut size={18} className="text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Sair</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Settings;
