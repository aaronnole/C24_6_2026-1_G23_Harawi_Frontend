const API_BASE = "http://localhost:3001/api";

async function parseJsonResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  let message = fallbackMessage;
  try {
    const errorData = await response.json();
    message = errorData?.message || errorData?.error || fallbackMessage;
  } catch {
    // Keep fallback message when the backend does not return JSON.
  }

  throw new Error(message);
}

export async function fetchPublicUser(userId) {
  const response = await fetch(`${API_BASE}/users/${userId}/public`);
  return parseJsonResponse(response, "Error al cargar el usuario");
}

export async function fetchFollowStatus(targetUserId, viewerId) {
  const response = await fetch(`${API_BASE}/users/${targetUserId}/follow-status/${viewerId}`);
  return parseJsonResponse(response, "Error al consultar el estado de seguimiento");
}

export async function followUser(targetUserId, followerId) {
  const response = await fetch(`${API_BASE}/users/${targetUserId}/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ follower_id: followerId }),
  });

  return parseJsonResponse(response, "No se pudo seguir al usuario");
}

export async function unfollowUser(targetUserId, followerId) {
  const response = await fetch(`${API_BASE}/users/${targetUserId}/follow`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ follower_id: followerId }),
  });

  return parseJsonResponse(response, "No se pudo dejar de seguir al usuario");
}

export async function fetchFollowers(userId, limit = 30, offset = 0) {
  const response = await fetch(`${API_BASE}/users/${userId}/followers?limit=${limit}&offset=${offset}`);
  return parseJsonResponse(response, "Error al cargar seguidores");
}

export async function fetchFollowing(userId, limit = 30, offset = 0) {
  const response = await fetch(`${API_BASE}/users/${userId}/following?limit=${limit}&offset=${offset}`);
  return parseJsonResponse(response, "Error al cargar seguidos");
}
