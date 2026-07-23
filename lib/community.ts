export const COMMUNITY_SESSION_COOKIE = 'vland-community-session';

export const COMMUNITY_REACTIONS = [
  { type: 'like', label: 'Like', emoji: '👍' },
  { type: 'love', label: 'Love', emoji: '❤️' },
  { type: 'haha', label: 'Haha', emoji: '😂' },
  { type: 'wow', label: 'Wow', emoji: '😮' },
  { type: 'sad', label: 'Sad', emoji: '😢' },
  { type: 'angry', label: 'Angry', emoji: '😡' }
] as const;

export type CommunityReactionType = (typeof COMMUNITY_REACTIONS)[number]['type'];

export function isCommunityReactionType(value: string): value is CommunityReactionType {
  return COMMUNITY_REACTIONS.some((reaction) => reaction.type === value);
}

export function getReactionMeta(type: string) {
  return (
    COMMUNITY_REACTIONS.find((reaction) => reaction.type === type) ?? COMMUNITY_REACTIONS[0]
  );
}

export function createCommunitySessionKey() {
  return crypto.randomUUID();
}
