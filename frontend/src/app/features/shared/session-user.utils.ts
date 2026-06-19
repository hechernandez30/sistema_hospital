import { AuthService } from '../../core/services/auth.service';

/** Texto legible del usuario autenticado en sesión. */
export function formatSessionUserDisplay(auth: AuthService): string {
  const id = auth.getUserId();
  const username = auth.getUsername();
  if (id == null) {
    return 'No se identificó el usuario en sesión';
  }
  if (username) {
    return `${username} (#${id})`;
  }
  return `Usuario #${id}`;
}

/**
 * ID de usuario para payloads de auditoría (creador/admisor/registro).
 * En alta: usuario en sesión; en edición: conserva el valor ya guardado.
 */
export function resolveActorUserIdForSubmit(
  auth: AuthService,
  mode: 'create' | 'edit',
  preservedUserId: number | null,
): number | null {
  if (mode === 'edit') {
    return preservedUserId;
  }
  return auth.getUserId();
}
