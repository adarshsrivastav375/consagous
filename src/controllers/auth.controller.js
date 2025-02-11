import AuthService from "#services/auth";
import env from "#configs/env";
import UserService from "#services/user";

// Redirect user to the provider's authorization URL
export async function login(req, res) {
  const { provider } = req.params;
  try {
    const authUrl = await AuthService.getAuthorizationUrl(provider);
    res.redirect(authUrl);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating auth URL", error: error.message });
  }
}

// Handle the OAuth callback and retrieve user info
export async function callback(req, res) {
  const { provider } = req.params;
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ message: "Missing authorization code" });
  }

  try {
    const { tokens, userInfo } = await AuthService.handleCallback(
      provider,
      code
    );

    const { accessToken, refreshToken, userData } =
      await UserService.socialUserCreate(userInfo, provider);
    let clientRedirectURL = `${env.FRONTEND_URL}?token=${accessToken}`;
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("X-Refresh-Token", refreshToken);

    return res.redirect(clientRedirectURL);
    // res.status(200).json({
    //   message: `${provider} login successful`,
    //   user
    // });
  } catch (error) {
    console.log(error);
    let clientRedirectURL = `${env.FRONTEND_URL}`;
    return res.redirect(clientRedirectURL);
  }
}
