export type AuthResponse = {
  expiresIn: number;
  token: string;
  tokenType: string;
  username: string;
};

export type UserProfile = {
  enabled: boolean;
  id: number;
  username: string;
};
