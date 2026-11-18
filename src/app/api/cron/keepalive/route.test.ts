import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const call = (authorization?: string) =>
  GET(new Request("http://localhost/api/cron/keepalive", { headers: authorization ? { Authorization: authorization } : {} }));

describe("keepalive 크론 인증", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("헤더가 없으면 401", async () => {
    vi.stubEnv("CRON_SECRET", "secret");
    expect((await call()).status).toBe(401);
  });

  it("비밀값이 틀리면 401", async () => {
    vi.stubEnv("CRON_SECRET", "secret");
    expect((await call("Bearer wrong")).status).toBe(401);
  });

  it("CRON_SECRET이 설정되지 않았으면 어떤 헤더도 401", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(401);
    expect((await call("Bearer undefined")).status).toBe(401);
  });
});
