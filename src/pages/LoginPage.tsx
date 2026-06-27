/**
 * Página de inicio de sesión — GS AUTOBAT
 *
 * Login simplificado por código de usuario, pensado para acceso
 * rápido desde móvil (sin necesidad de escribir un email completo).
 */
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && isAuthenticated) {
    const redirectTo = (location.state as { from?: string })?.from || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(codigo.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Código o contraseña incorrectos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Truck className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">GS AUTOBAT</h1>
          <p className="text-sm text-muted-foreground">Albaranes Inteligentes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Introduce tu código de usuario y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código de usuario</Label>
                <Input
                  id="codigo"
                  placeholder="REP-001"
                  autoCapitalize="characters"
                  autoComplete="username"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
