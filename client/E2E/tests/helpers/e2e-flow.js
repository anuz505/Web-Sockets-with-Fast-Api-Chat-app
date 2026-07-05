// API-driven setup helpers. Use these to get a browsing context into an
// authenticated / friended state without going through the registration,
// login, discover, or requests UI — each of those pages has its own spec
// that exercises it directly. Keeping setup off the UI keeps specs that
// don't test those pages fast and removes unrelated failure surface (e.g. a
// chat test shouldn't fail because the discover page broke).
//
// Pass an APIRequestContext — either `page.request` (shares cookies with
// that browsing context, which is what lets the SPA's own checkAuth() ->
// /auth/refresh bootstrap pick up the session on the next page.goto()) or
// the standalone `request` fixture (its own isolated cookie jar) for an
// actor that never needs a browser page at all.

export async function apiRegister(apiContext, user) {
  const response = await apiContext.post('/auth/register', { data: user });
  if (!response.ok()) {
    throw new Error(
      `Failed to register ${user.username}: ${response.status()} ${await response.text()}`
    );
  }
  return response.json(); // { id, username, email }
}

export async function apiLogin(apiContext, user) {
  const response = await apiContext.post('/auth/token', {
    form: { username: user.username, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to log in ${user.username}: ${response.status()} ${await response.text()}`
    );
  }
  const { access_token } = await response.json();
  return access_token;
}

export async function apiRegisterAndLogin(apiContext, user) {
  const created = await apiRegister(apiContext, user);
  const token = await apiLogin(apiContext, user);
  return { ...created, token };
}

export async function apiSendFriendRequest(apiContext, token, friendId) {
  const response = await apiContext.post('/friends/send_friend_request', {
    headers: { Authorization: `Bearer ${token}` },
    data: { id: friendId },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to send friend request to user ${friendId}: ${response.status()} ${await response.text()}`
    );
  }
}

export async function apiAcceptFriendRequest(apiContext, token, friendId) {
  const response = await apiContext.patch(`/friends/accept/${friendId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to accept friend request from user ${friendId}: ${response.status()} ${await response.text()}`
    );
  }
}

// Best-effort teardown. There is no user-deletion endpoint in this API, so
// registered test users can't be removed — only the friendship rows they
// create can. Swallows errors: cleanup failing shouldn't fail the test.
export async function apiRemoveFriend(apiContext, token, friendId) {
  if (!token || !friendId) return;
  try {
    await apiContext.delete(`/friends/removefriend/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // best-effort
  }
}
