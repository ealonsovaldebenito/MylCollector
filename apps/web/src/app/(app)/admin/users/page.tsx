'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User, Loader2 } from 'lucide-react';

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === userId ? { ...u, is_active: !isActive } : u)),
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra roles y permisos de usuarios
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            {users?.length || 0} usuario{(users?.length || 0) !== 1 ? 's' : ''} registrado{(users?.length || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No se encontraron usuarios o no tienes permisos para verlos.
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.display_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-3 w-3" />
                          Usuario
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          updateUserRole(user.user_id, value as 'user' | 'admin')
                        }
                        disabled={updatingUserId === user.user_id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.is_active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleUserActive(user.user_id, user.is_active)}
                        disabled={updatingUserId === user.user_id}
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
