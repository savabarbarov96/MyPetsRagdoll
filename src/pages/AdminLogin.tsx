import { useState } from 'react';
import { ConvexError } from 'convex/values';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const success = await login(password);
      if (!success) {
        setError('Неправилна парола');
        setPassword('');
      }
    } catch (error) {
      const reason = error instanceof ConvexError ? error.data : null;
      setError(reason === 'Admin login is not configured'
        ? 'Входът за администратор не е настроен. Свържете се с поддръжката.'
        : reason === 'Too many login attempts. Try again later.'
          ? 'Твърде много опити за вход. Опитайте отново след 15 минути.'
          : 'Грешка при влизане. Опитайте отново.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-playfair text-2xl text-black">
            Admin Panel
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Въведете парола за достъп
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium">Парола</label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Парола"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                autoFocus
                disabled={isSubmitting}
              />
              {error && (
                <p role="alert" className="text-red-600 text-sm">{error}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? 'Влизане...' : 'Влез'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
