import { redis } from "./redis";

export async function bumpAndCheck({
  key,
  limit,
  windowSec,
}: { key: string; limit: number; windowSec: number }) {
  const r = redis();
  const tx = r.multi();

  tx.incr(key);                          // returns number
  tx.expire(key, windowSec, "NX");       // set TTL only if key is new

  const replies = await tx.exec();       // e.g., [ <count:number>, <1|0> ]
  const count = Number(replies?.[0] ?? 0);
  return count <= limit;
}

export async function checkOtpLimits(phone: string, ip: string) {
  const hour = 60 * 60;
  const okPhone = await bumpAndCheck({ key: `otp:p:${phone}`, limit: 5, windowSec: hour });
  const okIp    = await bumpAndCheck({ key: `otp:ip:${ip}`,    limit: 20, windowSec: hour });
  return okPhone && okIp;
}
