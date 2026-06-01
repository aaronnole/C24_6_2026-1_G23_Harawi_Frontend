export function isSameUser(currentUserId, targetUserId) {
  if (!currentUserId || !targetUserId) return false;
  return Number(currentUserId) === Number(targetUserId);
}

export function canInteractWithUser(currentUserId, targetUserId) {
  return !isSameUser(currentUserId, targetUserId);
}
