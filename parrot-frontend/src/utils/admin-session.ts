export type AdminProfile = {
  username: string;
  phone: string;
  age: string;
  gender: string;
  avatarUrl: string;
  securityAnswers: {
    q1: string;
    q2: string;
    q3: string;
  };
};

type AdminState = {
  account: string;
  password: string;
  profile: AdminProfile;
};

const ADMIN_STATE_KEY = "parrot-admin-state";
const ADMIN_SESSION_KEY = "parrot-admin-session";

const defaultAdminState: AdminState = {
  account: "admin",
  password: "Parrot123",
  profile: {
    username: "Parrot 管理员",
    phone: "18800001111",
    age: "32",
    gender: "男",
    avatarUrl: "",
    securityAnswers: {
      q1: "1994-01-01",
      q2: "王芳",
      q3: "实验小学",
    },
  },
};

const cloneState = (state: AdminState): AdminState => JSON.parse(JSON.stringify(state));

const normalizeState = (state?: Partial<AdminState> | null): AdminState => {
  const merged = {
    ...defaultAdminState,
    ...state,
    profile: {
      ...defaultAdminState.profile,
      ...(state?.profile || {}),
      securityAnswers: {
        ...defaultAdminState.profile.securityAnswers,
        ...(state?.profile?.securityAnswers || {}),
      },
    },
  };

  return cloneState(merged);
};

export const getAdminState = (): AdminState => {
  const cached = localStorage.getItem(ADMIN_STATE_KEY);
  if (!cached) {
    const initial = cloneState(defaultAdminState);
    localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(cached) as Partial<AdminState>;
    const normalized = normalizeState(parsed);
    localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const initial = cloneState(defaultAdminState);
    localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(initial));
    return initial;
  }
};

const saveAdminState = (state: AdminState) => {
  localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(normalizeState(state)));
};

export const loginAdmin = (account: string, password: string) => {
  const state = getAdminState();
  const normalizedAccount = account.trim();
  if (normalizedAccount !== state.account || password !== state.password) {
    return false;
  }

  localStorage.setItem(ADMIN_SESSION_KEY, "1");
  return true;
};

export const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const isAdminAuthenticated = () => localStorage.getItem(ADMIN_SESSION_KEY) === "1";

export const getAdminProfile = () => getAdminState().profile;

export const saveAdminProfile = (profile: AdminProfile) => {
  const state = getAdminState();
  const nextState = normalizeState({
    ...state,
    profile,
  });
  saveAdminState(nextState);
  return nextState.profile;
};

export const updateAdminPassword = (oldPassword: string, newPassword: string, answers: AdminProfile["securityAnswers"]) => {
  const state = getAdminState();
  const matchedAnswers =
    answers.q1.trim() === state.profile.securityAnswers.q1 &&
    answers.q2.trim() === state.profile.securityAnswers.q2 &&
    answers.q3.trim() === state.profile.securityAnswers.q3;

  if (!matchedAnswers) {
    return { ok: false as const, message: "密保答案不正确" };
  }

  if (oldPassword !== state.password) {
    return { ok: false as const, message: "当前密码不正确" };
  }

  const nextState = normalizeState({
    ...state,
    password: newPassword,
  });
  saveAdminState(nextState);
  return { ok: true as const };
};

export const getAdminAccount = () => getAdminState().account;
