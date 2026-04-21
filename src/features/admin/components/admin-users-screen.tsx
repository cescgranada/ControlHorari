"use client";

import { useState, useEffect, useCallback } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserListItem } from "@/server/repositories/user.repository";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  reactivateUserAction
} from "@/server/actions/user.actions";
import { AdminAbsenceManagement } from "./admin-absence-management";
import type { PendingAbsence } from "@/server/services/team.service";

type AdminUsersScreenProps = {
  users: UserListItem[];
  pendingAbsences: PendingAbsence[];
};

type UserFormData = {
  email: string;
  full_name: string;
  role: "worker" | "admin";
  department: string;
  weekly_hours: number;
  password: string;
};

const emptyFormData: UserFormData = {
  email: "",
  full_name: "",
  role: "worker",
  department: "",
  weekly_hours: 30,
  password: ""
};

export function AdminUsersScreen({
  users,
  pendingAbsences
}: AdminUsersScreenProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userToDeactivate, setUserToDeactivate] = useState<UserListItem | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<UserListItem | null>(null);
  const [newUserCredentials, setNewUserCredentials] = useState<{ email: string; password: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "worker" | "inactive">(
    "all"
  );

  const closeActiveModal = useCallback(() => {
    if (isCreating || editingUser) { setIsCreating(false); setEditingUser(null); }
    else if (userToDeactivate) setUserToDeactivate(null);
    else if (userToReactivate) setUserToReactivate(null);
    else if (newUserCredentials) setNewUserCredentials(null);
  }, [isCreating, editingUser, userToDeactivate, userToReactivate, newUserCredentials]);
  useEscapeKey(closeActiveModal);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesRole: boolean;
    if (roleFilter === "all") matchesRole = true;
    else if (roleFilter === "inactive") matchesRole = !user.is_active;
    else matchesRole = user.role === roleFilter && user.is_active;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin" && u.is_active).length,
    workers: users.filter((u) => u.role === "worker" && u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length
  };

  useEffect(() => {
    if (!isCreating && !editingUser) {
      setFormData(emptyFormData);
      setError(null);
      setSuccess(null);
    }
  }, [isCreating, editingUser]);

  useEffect(() => {
    if (editingUser) {
      const user = users.find((u) => u.id === editingUser);
      if (user) {
        setFormData({
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          department: user.department ?? "",
          weekly_hours: user.weekly_hours,
          password: ""
        });
      }
    }
  }, [editingUser, users]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "weekly_hours" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isCreating) {
        const result = await createUserAction({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department || null,
          weekly_hours: formData.weekly_hours,
          password: formData.password || undefined
        });
        if (result.success) {
          setIsCreating(false);
          setNewUserCredentials({
            email: formData.email,
            password: result.data?.temporaryPassword ?? ""
          });
        } else setError(result.error || "Error creant l'usuari");
      } else if (editingUser) {
        const result = await updateUserAction(editingUser, {
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department || null,
          weekly_hours: formData.weekly_hours
        });
        if (result.success) {
          setSuccess("Usuari actualitzat correctament");
          setEditingUser(null);
        } else setError(result.error || "Error actualitzant l'usuari");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperat");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setLoading(true);
    try {
      const result = await deleteUserAction(userId);
      if (result.success) {
        setSuccess("Usuari desactivat correctament");
        setUserToDeactivate(null);
      } else setError(result.error || "Error desactivant l'usuari");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperat");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (userId: string, generateNewPassword: boolean) => {
    setLoading(true);
    try {
      const result = await reactivateUserAction(userId, generateNewPassword);
      if (result.success) {
        setUserToReactivate(null);
        if (generateNewPassword && result.data?.temporaryPassword && userToReactivate) {
          setNewUserCredentials({
            email: userToReactivate.email,
            password: result.data.temporaryPassword
          });
        } else {
          setSuccess("Usuari activat correctament");
        }
      } else setError(result.error || "Error activant l'usuari");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8">
      {/* Pending Absences Management */}
      <AdminAbsenceManagement pendingAbsences={pendingAbsences} />
      {/* Header \u0026 Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-none border-l-brand bg-white/40 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
            Total Usuaris
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{stats.total}</p>
        </Card>
        <Card className="border-l-4 border-none border-l-success bg-white/40 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
            Actius
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{stats.active}</p>
        </Card>
        <Card className="border-l-4 border-none border-l-danger bg-white/40 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
            Administradors
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{stats.admins}</p>
        </Card>
        <Card className="border-l-4 border-none border-l-pause bg-white/40 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
            Treballadors
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">{stats.workers}</p>
        </Card>
        <Card className="border-l-4 border-none border-l-line bg-white/40 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
            Inactius
          </p>
          <p className="mt-2 font-serif text-3xl text-ink/50">{stats.inactive}</p>
        </Card>
      </div>

      <Card className="border-none bg-white/90 p-6 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="danger">Administració</Badge>
            <h2 className="mt-2 font-serif text-3xl text-ink">
              Gestió de l&apos;Equip
            </h2>
            <p className="mt-1 text-sm italic text-ink/65">
              Crea i administra els perfils i rols de la plataforma.
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="shadow-lg shadow-brand/20 sm:min-w-48"
          >
            Nou usuari
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cerca per nom o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-line bg-mist/30 px-4 py-2.5 pl-10 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "worker" | "inactive")}
            className="rounded-2xl border border-line bg-mist/30 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
          >
            <option value="all">Tots els usuaris</option>
            <option value="admin">Administradors</option>
            <option value="worker">Treballadors</option>
            <option value="inactive">Inactius</option>
          </select>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-danger/10 bg-danger-soft/50 p-4 text-sm text-danger">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 rounded-2xl border border-success/10 bg-success-soft/50 p-4 text-sm text-success">
            {success}
          </div>
        )}

        <div className="mt-6 grid gap-4 overflow-hidden rounded-[2rem] border border-line/50 p-2">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center italic text-ink/40">
              No s&#39;han trobat usuaris amb aquests criteris.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`flex flex-col gap-4 rounded-[1.5rem] p-5 transition hover:bg-mist/30 sm:flex-row sm:items-center sm:justify-between ${!user.is_active ? "opacity-60 grayscale-[0.5]" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold shadow-sm ${user.role === "admin" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-strong"}`}
                  >
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink">{user.full_name}</p>
                      {user.role === "admin" ? (
                        <Badge tone="danger" className="origin-left scale-75">
                          Admin
                        </Badge>
                      ) : (
                        <Badge tone="success" className="origin-left scale-75">
                          Equip
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-ink/60">
                      {user.email}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {!user.is_active && (
                        <Badge tone="neutral" className="py-0 text-[10px]">
                          Inactiu
                        </Badge>
                      )}
                      {user.department && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                          {user.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingUser(user.id)}
                    className="h-9 rounded-xl px-4 text-xs font-bold"
                  >
                    Gestionar
                  </Button>
                  {user.is_active ? (
                    <Button
                      variant="secondary"
                      className="h-9 rounded-xl border-danger/20 px-4 text-xs font-bold text-danger hover:bg-danger-soft/70"
                      onClick={() => setUserToDeactivate(user)}
                      disabled={loading}
                    >
                      Baixa
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="h-9 rounded-xl border-success/20 px-4 text-xs font-bold text-success hover:bg-success-soft/70"
                      onClick={() => setUserToReactivate(user)}
                      disabled={loading}
                    >
                      Activar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal for creating/editing users */}
      {(isCreating || editingUser) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => { setIsCreating(false); setEditingUser(null); }}
        >
          <Card className="w-full max-w-md bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-2xl text-ink">
              {isCreating ? "Crear nou usuari" : "Editar usuari"}
            </h3>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-ink/80"
                >
                  Correu electrònic *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isCreating}
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:bg-mist/50 disabled:text-ink/50"
                />
              </div>

              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-semibold text-ink/80"
                >
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-semibold text-ink/80"
                >
                  Rol *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
                >
                  <option value="worker">Treballador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-semibold text-ink/80"
                >
                  Departament
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="weekly_hours"
                  className="block text-sm font-semibold text-ink/80"
                >
                  Hores setmanals *
                </label>
                <input
                  type="number"
                  id="weekly_hours"
                  name="weekly_hours"
                  required
                  min="0"
                  step="0.5"
                  value={formData.weekly_hours}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
                />
              </div>

              {isCreating && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-ink/80"
                  >
                    Contrasenya (opcional)
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Es generarà una temporal si es deixa buit"
                    className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingUser(null);
                  }}
                  disabled={loading}
                >
                  Cancel·lar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Desant..." : "Desar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal de credencials d'usuari nou */}
      {newUserCredentials && (
        <NewUserCredentialsModal
          email={newUserCredentials.email}
          password={newUserCredentials.password}
          onClose={() => setNewUserCredentials(null)}
        />
      )}

      {/* Modal de reactivació */}
      {userToReactivate && (
        <ReactivateModal
          user={userToReactivate}
          loading={loading}
          onCancel={() => setUserToReactivate(null)}
          onConfirm={(generateNewPassword) => handleReactivate(userToReactivate.id, generateNewPassword)}
        />
      )}

      {/* Modal de confirmació de baixa */}
      {userToDeactivate && (
        <DeactivateConfirmModal
          user={userToDeactivate}
          loading={loading}
          onCancel={() => setUserToDeactivate(null)}
          onConfirm={() => handleDelete(userToDeactivate.id)}
        />
      )}
    </div>
  );
}

type DeactivateConfirmModalProps = {
  user: UserListItem;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeactivateConfirmModal({ user, loading, onCancel, onConfirm }: DeactivateConfirmModalProps) {
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm bg-white p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft">
            <svg
              className="h-7 w-7 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink">Donar de baixa</h3>
            <p className="mt-1 text-sm text-ink/60">
              L&apos;usuari perdrà l&apos;accés a l&apos;aplicació. Podràs tornar-lo a activar quan vulguis.
            </p>
          </div>
          <div className="w-full rounded-xl border border-line bg-mist/40 px-4 py-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-base font-bold text-danger">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink">{user.full_name}</p>
                <p className="text-xs text-ink/50">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel·lar
          </Button>
          <Button
            className="flex-1 bg-danger text-white hover:bg-danger/90"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Desactivant..." : "Donar de baixa"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

type NewUserCredentialsModalProps = {
  email: string;
  password: string;
  onClose: () => void;
};

function NewUserCredentialsModal({ email, password, onClose }: NewUserCredentialsModalProps) {
  useEscapeKey(onClose);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm bg-white p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft">
            <svg
              className="h-7 w-7 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink">Usuari creat</h3>
            <p className="mt-1 text-sm text-ink/60">
              Guarda aquestes credencials abans de tancar. No es tornaran a mostrar.
            </p>
          </div>
          <div className="w-full space-y-2 rounded-xl border border-line bg-mist/40 px-4 py-3 text-left text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink/40">Correu</p>
              <p className="mt-0.5 font-medium text-ink">{email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink/40">Contrasenya temporal</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="flex-1 font-mono font-semibold text-ink">{password}</p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink/60 transition hover:bg-mist"
                >
                  {copied ? "Copiat!" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-ink/40">
            L&apos;usuari haurà de canviar la contrasenya en el primer accés.
          </p>
        </div>
        <div className="mt-4">
          <Button className="w-full" onClick={onClose}>
            Entès, ja ho he apuntat
          </Button>
        </div>
      </Card>
    </div>
  );
}

type ReactivateModalProps = {
  user: UserListItem;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (generateNewPassword: boolean) => void;
};

function ReactivateModal({ user, loading, onCancel, onConfirm }: ReactivateModalProps) {
  useEscapeKey(onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm bg-white p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft">
            <svg
              className="h-7 w-7 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink">Activar usuari</h3>
            <p className="mt-1 text-sm text-ink/60">
              Vols generar una contrasenya temporal nova per a aquest usuari?
            </p>
          </div>
          <div className="w-full rounded-xl border border-line bg-mist/40 px-4 py-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-base font-bold text-success">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink">{user.full_name}</p>
                <p className="text-xs text-ink/50">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => onConfirm(true)}
            disabled={loading}
          >
            {loading ? "Activant..." : "Activar i generar nova contrasenya"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onConfirm(false)}
            disabled={loading}
          >
            Activar sense canviar contrasenya
          </Button>
          <Button
            variant="secondary"
            className="w-full text-ink/50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel·lar
          </Button>
        </div>
      </Card>
    </div>
  );
}
