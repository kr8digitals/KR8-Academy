import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Role, Student } from "./types";
import {
  authenticate,
  clearSession,
  commitSession,
  consumeRecoveryCode,
  getStudent,
  readSession,
  registerStudent,
  totpEnabled,
  verifyTotpOnly,
  writeSession,
  type RegisterInput,
} from "./store";
import { isStaffRole } from "./permissions";

type PendingTotp = { studentId: string; name: string };

type AuthValue = {
  student: Student | null;
  ready: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  role: Role | null;
  pendingTotp: PendingTotp | null;
  signIn: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string; student?: Student; waitlist?: boolean; needsTotp?: boolean }>;
  completeTotp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  cancelTotp: () => void;
  signUp: (input: RegisterInput) => Promise<{ ok: boolean; error?: string; student?: Student; waitlist?: boolean }>;
  signOut: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function announceSession() {
  window.dispatchEvent(new CustomEvent("kr8:session"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [pendingTotp, _setPendingTotp] = useState<PendingTotp | null>(null);
  const pendingTotpRef = useRef<PendingTotp | null>(null);
  const setPendingTotp = useCallback((value: PendingTotp | null | ((prev: PendingTotp | null) => PendingTotp | null)) => {
    _setPendingTotp((prev) => {
      const next = typeof value === "function" ? (value as (p: PendingTotp | null) => PendingTotp | null)(prev) : value;
      pendingTotpRef.current = next;
      return next;
    });
  }, []);
  const [ready, setReady] = useState(false);

  const load = useCallback(() => {
    const session = readSession();
    if (!session) {
      setStudent(null);
      setReady(true);
      return;
    }
    const found = getStudent(session.studentId);
    if (!found || found.status === "suspended") {
      clearSession();
      setStudent(null);
    } else {
      setStudent(found);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("storage", handler);
    window.addEventListener("kr8:session", handler);
    window.addEventListener("kr8:academy:change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("kr8:session", handler);
      window.removeEventListener("kr8:academy:change", handler);
    };
  }, [load]);

  const signIn = useCallback<AuthValue["signIn"]>(async (identifier, password) => {
    const result = await authenticate(identifier, password);
    if (result.ok && result.student) {
      // Staff accounts on a device with 2FA enabled must clear their second factor first.
      if (isStaffRole(result.student.role) && totpEnabled()) {
        setPendingTotp({ studentId: result.student.id, name: result.student.name });
        return { ...result, needsTotp: true };
      }
      commitSession(result.student.id);
      const fresh = getStudent(result.student.id) ?? result.student;
      setStudent(fresh);
      announceSession();
    }
    return result;
  }, []);

  const completeTotp = useCallback<AuthValue["completeTotp"]>(async (code) => {
    const pending = pendingTotpRef.current;
    if (!pending) return { ok: false, error: "No sign-in awaiting verification." };
    const cleaned = code.trim();
    let ok = await verifyTotpOnly(cleaned);
    if (!ok) ok = await consumeRecoveryCode(cleaned, pending.name);
    if (!ok) return { ok: false, error: "That code did not match — try again or use a recovery code." };
    commitSession(pending.studentId);
    const fresh = getStudent(pending.studentId);
    if (fresh) setStudent(fresh);
    setPendingTotp(null);
    announceSession();
    return { ok: true };
  }, []);

  const cancelTotp = useCallback(() => setPendingTotp(null), []);

  const signUp = useCallback<AuthValue["signUp"]>(async (input) => {
    const result = await registerStudent(input);
    if (result.ok && result.student) {
      const fresh = getStudent(result.student.id) ?? result.student;
      setStudent(fresh);
      writeSession(fresh.id);
      announceSession();
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setStudent(null);
    setPendingTotp(null);
    announceSession();
  }, []);

  const refresh = useCallback(() => load(), [load]);

  const value = useMemo<AuthValue>(
    () => ({
      student,
      ready,
      isAdmin: !!student && student.role !== "student",
      isOwner: student?.role === "owner",
      role: student?.role ?? null,
      pendingTotp,
      signIn,
      completeTotp,
      cancelTotp,
      signUp,
      signOut,
      refresh,
    }),
    [student, ready, pendingTotp, signIn, completeTotp, cancelTotp, signUp, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
