export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  country?: string;
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  product?: string;
  type: 'user';
  uri: string;
  href: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface SpotifyApiError {
  error: {
    status: number;
    message: string;
  };
}
