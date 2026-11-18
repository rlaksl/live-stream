/** 방송자 참가자의 identity. 시청자 수 계산과 웹훅에서 방송자가 나갔는지 판별하는 데 쓴다. */
export const publisherIdentity = (ownerId: string) => `owner-${ownerId}`;
export const isPublisherIdentity = (identity: string) => identity.startsWith("owner-");
