import axios from "axios";
import jwt from "jsonwebtoken";
import env from "#configs/env";

class AuthService {
  constructor() {
    this.initialized = false;
  }

  // Initialize any required configurations (optional)
  async initializeClients() {
    // No need to initialize clients manually in this case
    this.initialized = true;
  }

  // Generate the Authorization URL for the login provider
  async getAuthorizationUrl(provider) {
    if (!this.initialized) {
      await this.initializeClients();
    }

    let authUrl;
    let params = {
      redirect_uri: `${env.BASE_URL}/api/auth/callback/${provider}`,
    };
    switch (provider) {
      case "google":
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${params.redirect_uri}&scope=openid email profile`;
        break;
      case "facebook":
        authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${env.FACEBOOK_CLIENT_ID}&redirect_uri=${params.redirect_uri}&scope=email,public_profile`;
        break;
      default:
        throw new Error("Unsupported provider");
    }

    return authUrl;
  }

  // Handle the OAuth callback and retrieve user info
  async handleCallback(provider, code) {
    if (!this.initialized) {
      await this.initializeClients();
    }

    let tokenResponse, userInfo;

    switch (provider) {
      case "google":
        tokenResponse = await this.getGoogleTokens(code);
        userInfo = await this.getGoogleUserInfo(tokenResponse.access_token);
        break;
      case "facebook":
        tokenResponse = await this.getFacebookTokens(code);
        userInfo = await this.getFacebookUserInfo(tokenResponse.access_token);
        break;
      case "apple":
        tokenResponse = await this.getAppleTokens(code);
        userInfo = await this.getAppleUserInfo(tokenResponse.id_token);
        break;
      default:
        throw new Error("Unsupported provider");
    }
    return { tokens: tokenResponse, userInfo };
  }

  // Google Token Exchange and User Info Fetch
  async getGoogleTokens(code) {
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.BASE_URL}/api/auth/callback/google`,
        grant_type: "authorization_code",
      });
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async getGoogleUserInfo(access_token) {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    return response.data;
  }

  // Facebook Token Exchange and User Info Fetch
  async getFacebookTokens(code) {
    const response = await axios.get(
      `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${env.FACEBOOK_CLIENT_ID}&redirect_uri=${env.BASE_URL}/auth/callback/facebook&client_secret=${env.FACEBOOK_CLIENT_SECRET}&code=${code}`
    );

    return response.data;
  }

  async getFacebookUserInfo(access_token) {
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
    );
    return response.data;
  }

  // Apple Token Exchange and User Info Fetch
  async getAppleTokens(code) {
    const response = await axios.post("https://appleid.apple.com/auth/token", {
      client_id: env.APPLE_CLIENT_ID,
      client_secret: env.APPLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${env.BASE_URL}/auth/callback/apple`,
    });

    return response.data;
  }

  async getAppleUserInfo(id_token) {
    const decodedToken = jwt.decode(id_token);
    return decodedToken;
  }
}

export default new AuthService();
