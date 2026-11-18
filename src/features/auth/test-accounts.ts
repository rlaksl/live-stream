/** 평가용 테스트 계정. 비밀번호는 TEST_ACCOUNT_PASSWORD 환경변수이며 README에 공개한다. */
export const TEST_ACCOUNTS = {
  a: { email: "test-a@example.com", nickname: "방송자A" },
  b: { email: "test-b@example.com", nickname: "시청자B" },
} as const;

export type TestAccountKey = keyof typeof TEST_ACCOUNTS;
