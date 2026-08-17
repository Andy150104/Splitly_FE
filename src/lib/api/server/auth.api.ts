import "server-only";

import type {
  BillSplitServiceApiControllersAuthControllerDevLoginRequest as DevLoginRequest,
  BillSplitServiceApiControllersAuthControllerGoogleLoginRequest as GoogleLoginRequest,
  BillSplitServiceApiControllersAuthControllerSendLoginCodeRequest as SendLoginCodeRequest,
  BillSplitServiceApiControllersAuthControllerVerifyLoginCodeRequest as VerifyLoginCodeRequest,
} from "@/generated/api/models";
import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import { getSessionTokens } from "@/lib/auth/session";
import { authenticatedCall } from "@/lib/api/server/require-session";
import { serverRequestOptions } from "@/lib/http/server-http-client";
import { unwrap } from "@/lib/api/shared/unwrap";

const generated = getBillSplitServiceAPI();

export const authApi = {
  async getMyPermissions() {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiAuthMePermissions(opts)),
    );
  },

  async google(input: GoogleLoginRequest) {
    return unwrap(
      await generated.postApiAuthGoogle(input, serverRequestOptions()),
    );
  },

  async sendLoginCode(input: SendLoginCodeRequest) {
    return unwrap(
      await generated.postApiAuthSendLoginCode(input, serverRequestOptions()),
    );
  },

  async verifyLoginCode(input: VerifyLoginCodeRequest) {
    return unwrap(
      await generated.postApiAuthVerifyLoginCode(input, serverRequestOptions()),
    );
  },

  async devLogin(input: DevLoginRequest) {
    return unwrap(
      await generated.postApiAuthDevLogin(input, serverRequestOptions()),
    );
  },

  async refresh() {
    const { refreshToken } = await getSessionTokens();
    if (!refreshToken) throw new Error("Missing refresh token");
    return unwrap(
      await generated.postApiAuthRefresh(
        { refreshToken },
        serverRequestOptions(),
      ),
    );
  },

  async logout() {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return true;
    return unwrap(
      await generated.postApiAuthLogout(serverRequestOptions(accessToken)),
    );
  },
};
