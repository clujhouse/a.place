import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

export const client = createAuthClient({
  plugins: [emailOTPClient()],
});

export async function authMiddleware(request: NextRequest) {
  /**
   * This is an example of how you can use the client to get the session
   * from the request headers.
   *
   * You can then use this session to make decisions about the request
   */
  // const { data: session } = await client.getSession({
  //   fetchOptions: {
  //     headers: {
  //       cookie: request.headers.get("cookie") ?? "",
  //     },
  //   },
  // });
  // if (!session) {
  //   return NextResponse.redirect(new URL("/sign-in", request.url));
  // }

  return NextResponse.next();
}
