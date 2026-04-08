"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserListItem } from "@/server/repositories/user.repository";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction
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

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "worker">(
    "all"
  );

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    workers: users.filter((u) => u.role === "worker").length
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
          setSuccess(
            `Usuari creat correctament. Contrasenya: ${result.data?.temporaryPassword}`
          );
          setIsCreating(false);
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
    if (!confirm("Estàs segur que vols desactivar aquest usuari?")) return;
    setLoading(true);
    try {
      const result = await deleteUserAction(userId);
      if (result.success) setSuccess("Usuari desactivat correctament");
      else setError(result.error || "Error desactivant l'usuari");
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-2xl border border-line bg-mist/30 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white"
          >
            <option value="all">Tots els rols</option>
            <option value="admin">Administradors</option>
            <option value="worker">Treballadors</option>
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
                  <Button
                    variant="secondary"
                    className="h-9 rounded-xl border-danger/20 px-4 text-xs font-bold text-danger hover:bg-danger-soft/70"
                    onClick={() => handleDelete(user.id)}
                    disabled={!user.is_active}
                  >
                    Baixa
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal for creating/editing users */}
      {(isCreating || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md bg-white p-6">
            <h3 className="font-serif text-2xl text-ink">
              {isCreating ? "Crear nou usuari" : "Editar usuari"}
            </h3>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink"
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
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-ink"
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
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-ink"
                >
                  Rol *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="worker">Treballador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-ink"
                >
                  Departament
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="weekly_hours"
                  className="block text-sm font-medium text-ink"
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
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              {isCreating && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink"
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
                    className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
    </div>
  );
}
