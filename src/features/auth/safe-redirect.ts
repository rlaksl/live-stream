/**
 * 로그인·가입 후 돌아갈 주소. 같은 사이트 안의 경로만 허용하고 나머지는 홈으로 보낸다.
 * `//evil.com`과 `/\evil.com`은 브라우저가 외부 주소로 해석하므로 막는다.
 */
export function safeRedirect(path: string) {
  const internal = path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
  return internal ? path : "/";
}
