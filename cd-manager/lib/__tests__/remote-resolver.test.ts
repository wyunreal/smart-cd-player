/**
 * @jest-environment node
 */

import { EventEmitter } from "node:events";

const mockMakeMdns = jest.fn();
jest.mock("multicast-dns", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockMakeMdns(...args),
}));

import {
  isLocalHostname,
  resolveLocalHost,
  resolveUrlToIp,
} from "../remote-resolver";

type FakeMdns = EventEmitter & {
  query: jest.Mock;
  destroy: jest.Mock;
};

const makeFakeMdns = (
  behavior: (emitter: FakeMdns) => void,
): FakeMdns => {
  const emitter = new EventEmitter() as FakeMdns;
  emitter.query = jest.fn(() => behavior(emitter));
  emitter.destroy = jest.fn();
  return emitter;
};

const answerFor = (name: string, ip: string) => ({
  answers: [{ type: "A", name, data: ip }],
});

describe("remote-resolver", () => {
  beforeEach(() => {
    mockMakeMdns.mockReset();
  });

  it("identifies only .local hostnames", () => {
    expect(isLocalHostname("smartcdplayer.local")).toBe(true);
    expect(isLocalHostname("smartcdplayer.local.")).toBe(true);
    expect(isLocalHostname("example.com")).toBe(false);
    expect(isLocalHostname(".local")).toBe(false);
    expect(isLocalHostname("bad..local")).toBe(false);
  });

  it("resolves an A record with a fresh query on every call", async () => {
    mockMakeMdns.mockImplementation(() =>
      makeFakeMdns((emitter) => {
        setImmediate(() => {
          emitter.emit("response", answerFor("smartcdplayer.local", "192.168.1.50"));
        });
      }),
    );

    await expect(resolveLocalHost("smartcdplayer.local")).resolves.toBe(
      "192.168.1.50",
    );
    await expect(resolveLocalHost("smartcdplayer.local")).resolves.toBe(
      "192.168.1.50",
    );

    // No cache: each call must query the network again.
    expect(mockMakeMdns).toHaveBeenCalledTimes(2);
  });

  it("fails after the mDNS attempts without a cached fallback", async () => {
    mockMakeMdns.mockImplementation(() =>
      makeFakeMdns((emitter) => {
        setImmediate(() => emitter.emit("error", new Error("offline")));
      }),
    );

    await expect(resolveLocalHost("smartcdplayer.local")).rejects.toMatchObject({
      code: "MDNS_RESOLVE_FAILED",
    });
    expect(mockMakeMdns).toHaveBeenCalledTimes(2);
  });

  it("rewrites only HTTP .local URLs to their IPv4 address", async () => {
    mockMakeMdns.mockImplementation(() =>
      makeFakeMdns((emitter) => {
        setImmediate(() => {
          emitter.emit("response", answerFor("smartcdplayer.local", "192.168.1.50"));
        });
      }),
    );

    await expect(
      resolveUrlToIp("http://smartcdplayer.local/remote?device=Sony"),
    ).resolves.toBe("http://192.168.1.50/remote?device=Sony");

    const calls = mockMakeMdns.mock.calls.length;
    await expect(
      resolveUrlToIp("https://smartcdplayer.local/remote"),
    ).resolves.toBe("https://smartcdplayer.local/remote");
    expect(mockMakeMdns).toHaveBeenCalledTimes(calls);
  });
});
