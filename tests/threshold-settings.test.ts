import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALERT_CONFIG } from "../src/server/alerts/config";

const mocks = vi.hoisted(() => ({ user: vi.fn(), department: vi.fn() }));
vi.mock("@/server/db/client", () => ({ prisma: { user: { findUnique: mocks.user }, department: { findUnique: mocks.department } } }));
import { getThresholds } from "../src/server/alerts/settings";

beforeEach(() => { vi.resetAllMocks(); });
describe("joined threshold inheritance", () => {
  it("keeps mentor settings ahead of department settings", async () => {
    mocks.user.mockResolvedValue({ departmentId: "d1", alertThresholds: { ...ALERT_CONFIG, lowAttendancePct: 65 }, department: { alertThresholds: { ...ALERT_CONFIG, lowAttendancePct: 70 } } });
    expect((await getThresholds("m1")).lowAttendancePct).toBe(65);
    expect(mocks.department).not.toHaveBeenCalled();
  });
  it("inherits the joined department without a second database request", async () => {
    mocks.user.mockResolvedValue({ departmentId: "d1", alertThresholds: null, department: { alertThresholds: { ...ALERT_CONFIG, lowAttendancePct: 70 } } });
    expect((await getThresholds("m1")).lowAttendancePct).toBe(70);
    expect(mocks.department).not.toHaveBeenCalled();
  });
  it("uses default rules if neither mentor nor department has an override", async () => {
    mocks.user.mockResolvedValue({ departmentId: "d1", alertThresholds: null, department: { alertThresholds: null } });
    expect(await getThresholds("m1")).toEqual(ALERT_CONFIG);
  });
  it("preserves an explicit department fallback", async () => {
    mocks.user.mockResolvedValue(null);
    mocks.department.mockResolvedValue({ alertThresholds: { ...ALERT_CONFIG, lowAttendancePct: 70 } });
    expect((await getThresholds("m1", "d2")).lowAttendancePct).toBe(70);
    expect(mocks.department).toHaveBeenCalledWith({ where: { id: "d2" }, select: { alertThresholds: true } });
  });
});
