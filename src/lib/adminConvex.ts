import { useContext } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { AdminAuthContext } from "@/hooks/useAdminAuth";

type Query = FunctionReference<"query", "public">;
type Mutation = FunctionReference<"mutation", "public">;
type Action = FunctionReference<"action", "public">;
type WithoutSession<F extends Query | Mutation | Action> = Omit<FunctionArgs<F>, "sessionId">;

// This assertion adapts Convex's conditional rest arguments to a single explicit args object.
const queryHook = useQuery as <Q extends Query>(query: Q, args: FunctionArgs<Q> | "skip") => FunctionReturnType<Q> | undefined;

export function useAdminQuery<Q extends Query>(query: Q, args?: WithoutSession<Q> | "skip"): FunctionReturnType<Q> | undefined {
  const auth = useContext(AdminAuthContext);
  return queryHook(query, auth?.isAuthenticated && auth.sessionId && args !== "skip"
    ? { ...args, sessionId: auth.sessionId } as FunctionArgs<Q> : "skip");
}

export function useAdminMutation<M extends Mutation>(mutation: M) {
  const auth = useContext(AdminAuthContext);
  const execute = useMutation(mutation);
  return async (args?: WithoutSession<M>): Promise<FunctionReturnType<M>> => {
    if (!auth?.isAuthenticated || !auth.sessionId) throw new Error("Unauthorized");
    return await execute({ ...args, sessionId: auth.sessionId } as FunctionArgs<M>);
  };
}

export function useAdminAction<A extends Action>(action: A) {
  const auth = useContext(AdminAuthContext);
  const execute = useAction(action);
  return async (args?: WithoutSession<A>): Promise<FunctionReturnType<A>> => {
    if (!auth?.isAuthenticated || !auth.sessionId) throw new Error("Unauthorized");
    return await execute({ ...args, sessionId: auth.sessionId } as FunctionArgs<A>);
  };
}

// Public detail queries can resolve unpublished content only for a validated administrator.
export function useOptionalAdminQuery<Q extends Query>(query: Q, args: WithoutSession<Q> | "skip") {
  const auth = useContext(AdminAuthContext);
  return queryHook(query, args === "skip" ? "skip" : {
    ...args, ...(auth?.isAuthenticated && auth.sessionId ? { sessionId: auth.sessionId } : {}),
  } as FunctionArgs<Q>);
}
