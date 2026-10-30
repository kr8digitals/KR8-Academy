import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Student } from "./types";
import {
  authenticate,
  clearSession,
  getStudent,
  readSession,
  registerStudent,
  writeSession,
  type RegisterInput,
} from "./store";

type AuthValue = {
  student: Student | null;
  ready: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string; student?: Student }>;
  signUp: (input: RegisterInput) => Promise<{ ok: boolean; error?: string; student?: Student }>;
  signOut: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function announceSession() {
  window.dispatchEvent(new CustomEvent("kr8:session"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
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
      const fresh = getStudent(result.student.id) ?? result.student;
      setStudent(fresh);
      writeSession(fresh.id);
      announceSession();
    }
    return result;
  }, []);

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
    announceSession();
  }, []);

  const refresh = useCallback(() => load(), [load]);

  const value = useMemo<AuthValue>(
    () => ({
      student,
      ready,
      isAdmin: student?.role === "admin" || student?.role === "superadmin",
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [student, ready, signIn, signUp, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
