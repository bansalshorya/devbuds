import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveFollowUpDate } from "../src/server/ai/dates";
import { extractDraft, normalizeDraft, transcribe } from "../src/server/ai/provider";
import { DateOnlySchema, MeetingSaveSchema, RegisterQuerySchema } from "../src/lib/schemas";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("calendar dates and reviewed meetings", () => {
  it.each(["2026-02-30", "2026-13-01", "2026-2-01", "not a date"])("rejects invalid date %s", (value) => {
    expect(DateOnlySchema.safeParse(value).success).toBe(false);
  });
  it.each([
    ["tomorrow", "2026-11-01"], ["நாளை", "2026-11-01"], ["in 3 days", "2026-11-03"],
    ["in 2 weeks", "2026-11-14"], ["3 நாட்கள் கழித்து", "2026-11-03"],
    ["next Friday", "2026-11-06"], ["அடுத்த வெள்ளிக்கிழமை", "2026-11-06"],
    ["2026-11-15", "2026-11-15"], ["soon", null], ["next week", null], ["2026-10-01", null], ["2026-02-30", null],
  ])("resolves %s without an LLM", (phrase, expected) => {
    expect(resolveFollowUpDate(phrase, "2026-10-31")).toBe(expected);
  });
  it("moves next Friday a full week when the meeting is Friday", () => {
    expect(resolveFollowUpDate("next Friday", "2026-10-30")).toBe("2026-11-06");
  });
  it("requires a real agreed action and follow-up date", () => {
    const meeting = { clientSubmissionId: "test-submission", studentId: "s1", meetingDate: "2026-10-30", language: "English", summary: "Reviewed attendance", topics: [], actions: [] };
    expect(MeetingSaveSchema.safeParse(meeting).success).toBe(false);
    expect(MeetingSaveSchema.safeParse({ ...meeting, actions: [{ action: "Submit assignment", dueDate: "2026-10-29" }] }).success).toBe(false);
    expect(MeetingSaveSchema.safeParse({ ...meeting, actions: [{ action: "Submit assignment", dueDate: "2026-11-01" }] }).success).toBe(true);
  });
  it("rejects reversed register date ranges", () => {
    expect(RegisterQuerySchema.safeParse({ format: "xlsx", from: "2026-11-02", to: "2026-11-01" }).success).toBe(false);
  });
});

describe("AI draft safety and fallback", () => {
  it("resolves only date phrases present in the transcript", () => {
    const result = normalizeDraft({ summary: "Reviewed attendance", topics: ["Attendance"], actions: [
      { action: "Submit assignment", dateText: "tomorrow" }, { action: "Meet tutor", dateText: "2026-11-15" },
    ] }, "Submit assignment tomorrow and meet tutor later.", "2026-10-30");
    expect(result.actions.map((action) => action.dueDate)).toEqual(["2026-10-31", null]);
  });
  it("rejects malformed AI drafts", () => {
    expect(() => normalizeDraft({ summary: "Review", topics: [], actions: [{ action: "Submit assignment", dateText: 17 }] }, "text", "2026-10-30")).toThrow();
  });
  it("keeps mock extraction clearly labelled and invents no commitments", async () => {
    vi.stubEnv("EXTRACTOR", "mock"); vi.stubEnv("DEMO_MODE", "true");
    const result = await extractDraft("வருகை குறித்து பேசினோம்.", "Tamil", "2026-10-30");
    expect(result).toEqual({ demo: true, draft: { summary: "வருகை குறித்து பேசினோம்.", topics: [], actions: [] } });
  });
  it("does not allow demo providers outside demo mode", async () => {
    vi.stubEnv("EXTRACTOR", "mock"); vi.stubEnv("DEMO_MODE", "false");
    await expect(extractDraft("Reviewed attendance", "English", "2026-10-30")).rejects.toThrow("not configured");
  });
  it("fails with an actionable error when a real provider has no key", async () => {
    vi.stubEnv("TRANSCRIBER", "openai"); vi.stubEnv("OPENAI_API_KEY", "");
    await expect(transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), "Tamil")).rejects.toThrow("not configured");
  });
  it("sends Tamil audio as transcription, not translation", async () => {
    vi.stubEnv("TRANSCRIBER", "openai"); vi.stubEnv("OPENAI_API_KEY", "test-key");
    const request = vi.fn().mockResolvedValue(Response.json({ text: "வருகை குறித்து பேசினோம்." }));
    vi.stubGlobal("fetch", request);
    const result = await transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), "Tamil");
    expect(result.demo).toBe(false);
    expect(request.mock.calls[0][0]).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect((request.mock.calls[0][1].body as FormData).get("language")).toBe("ta");
  });
  it("validates provider structured output and handles refusals", async () => {
    vi.stubEnv("EXTRACTOR", "openai"); vi.stubEnv("OPENAI_API_KEY", "test-key");
    const request = vi.fn().mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ summary: "Reviewed work", topics: [], actions: [{ action: "Submit work", dateText: "tomorrow" }] }) } }] }))
      .mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: null, refusal: "refused" } }] }));
    vi.stubGlobal("fetch", request);
    expect((await extractDraft("Submit work tomorrow", "English", "2026-10-30")).draft.actions[0].dueDate).toBe("2026-10-31");
    await expect(extractDraft("Submit work tomorrow", "English", "2026-10-30")).rejects.toThrow("could not be generated");
  });
});
