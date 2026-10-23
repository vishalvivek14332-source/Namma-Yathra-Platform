export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Checks currently authenticated session from server HTTP-only cookie
 */
export async function getCurrentUser(): Promise<{ success: boolean; user: AuthUser | null; error?: string }> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    const data = await res.json();
    return {
      success: true,
      user: data.user || null
    };
  } catch (err: any) {
    return {
      success: false,
      user: null,
      error: err.message || 'Failed to check authentication status'
    };
  }
}

/**
 * Signs in user with email and password
 */
export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<{ success: boolean; user?: AuthUser; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Login failed (HTTP ${res.status})`
      };
    }

    return {
      success: true,
      user: data.user,
      message: data.message
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error during login'
    };
  }
}

/**
 * Registers a new user account
 */
export async function registerUser(data: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{ success: boolean; user?: AuthUser; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || `Registration failed (HTTP ${res.status})`
      };
    }

    return {
      success: true,
      user: result.user,
      message: result.message
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error during registration'
    };
  }
}

/**
 * Logs out user and clears server session cookie
 */
export async function logoutUser(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    return {
      success: true,
      message: data.message
    };
  } catch {
    return { success: true };
  }
}

/**
 * Initiates forgot password recovery
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  emailSent?: boolean;
  message?: string;
  resetToken?: string;
  info?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit password recovery request'
      };
    }

    return {
      success: true,
      emailSent: data.emailSent,
      message: data.message,
      resetToken: data.resetToken,
      info: data.info
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error submitting recovery request'
    };
  }
}

/**
 * Resets password using valid token
 */
export async function resetPasswordWithToken(data: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reset password'
      };
    }

    return {
      success: true,
      message: result.message
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error resetting password'
    };
  }
}
