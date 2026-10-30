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
    vi.stubEnv("TRANSCRIBER", "gemini"); vi.stubEnv("GEMINI_API_KEY", "");
    await expect(transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), "Tamil")).rejects.toThrow("not configured");
  });
  it.each(["English", "Tamil"] as const)("requests Gemini audio output in %s regardless of spoken language", async (language) => {
    vi.stubEnv("TRANSCRIBER", "gemini"); vi.stubEnv("GEMINI_API_KEY", "test-key");
    const request = vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "வருகை குறித்து பேசினோம்." }] } }] }));
    vi.stubGlobal("fetch", request);
    const result = await transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), language);
    expect(result).toEqual({ demo: false, transcript: "வருகை குறித்து பேசினோம்." });
    expect(request.mock.calls[0][0]).toContain("gemini-3.1-flash-lite:generateContent");
    expect(request.mock.calls[0][1].headers["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(request.mock.calls[0][1].body as string);
    expect(body.contents[0].parts[0].text).toContain("Recognize Tamil, English, or mixed Tamil-English speech automatically");
    expect(body.contents[0].parts[0].text).toContain(`Return the complete transcript entirely in ${language}`);
    expect(body.contents[0].parts[0].text).toContain(`Translate speech in any other language into ${language}`);
    if (language === "Tamil") expect(body.contents[0].parts[0].text).toContain("using Tamil script");
    expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: "audio/webm", data: "Y2xpcA==" });
  });
  it.each(["English", "Tamil"] as const)("detects OpenAI input language then renders the transcript in %s", async (language) => {
    vi.stubEnv("TRANSCRIBER", "openai"); vi.stubEnv("OPENAI_API_KEY", "test-key");
    const text = language === "Tamil" ? "வருகை குறித்து பேசினோம்." : "We discussed attendance.";
    const request = vi.fn().mockResolvedValueOnce(Response.json({ text: "வருகை குறித்து பேசினோம்." }))
      .mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: text } }] }));
    vi.stubGlobal("fetch", request);
    const result = await transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), language);
    expect(result).toEqual({ demo: false, transcript: text });
    expect(request.mock.calls[0][0]).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect((request.mock.calls[0][1].body as FormData).has("language")).toBe(false);
    expect(request.mock.calls[1][0]).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(request.mock.calls[1][1].body as string);
    expect(body.store).toBe(false);
    expect(body.messages[0].content).toContain(`Render the complete transcript entirely in ${language}`);
    expect(body.messages[1].content).toBe("வருகை குறித்து பேசினோம்.");
  });
  it("does not accept refused OpenAI transcript translation", async () => {
    vi.stubEnv("TRANSCRIBER", "openai"); vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ text: "We discussed attendance." }))
      .mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: null, refusal: "refused" } }] })));
    await expect(transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), "Tamil")).rejects.toThrow("selected language");
  });
  it.each(["gemini", "openai"])("translates %s drafts while preserving source date phrases for resolution", async (provider) => {
    vi.stubEnv("EXTRACTOR", provider); vi.stubEnv("GEMINI_API_KEY", "test-key"); vi.stubEnv("OPENAI_API_KEY", "test-key");
    const draft = JSON.stringify({ summary: "பணியைச் சமர்ப்பிப்பது குறித்து பேசினோம்.", topics: ["பணி"], actions: [{ action: "பணியைச் சமர்ப்பிக்கவும்", dateText: "tomorrow" }] });
    const request = vi.fn().mockResolvedValue(Response.json(provider === "gemini"
      ? { candidates: [{ finishReason: "STOP", content: { parts: [{ text: draft }] } }] }
      : { choices: [{ finish_reason: "stop", message: { content: draft } }] }));
    vi.stubGlobal("fetch", request);
    const result = await extractDraft("Submit the assignment tomorrow", "Tamil", "2026-10-30");
    expect(result.draft.actions[0]).toEqual({ action: "பணியைச் சமர்ப்பிக்கவும்", dueDate: "2026-10-31" });
    const body = JSON.parse(request.mock.calls[0][1].body as string);
    const instruction = provider === "gemini" ? body.systemInstruction.parts[0].text : body.messages[0].content;
    expect(instruction).toContain("entirely in Tamil; translate the source text when needed");
    expect(instruction).toContain("Only dateText must remain verbatim in the source language");
  });
  it.each([
    [400, "API_KEY_INVALID", "rejected the API key"],
    [401, undefined, "rejected the API key"],
    [403, undefined, "denied access"],
    [404, undefined, "model is unavailable"],
    [429, undefined, "rate limit or quota"],
    [400, undefined, "rejected the request"],
    [503, undefined, "temporarily unavailable"],
  ])("explains Gemini HTTP %s failures without leaking provider details", async (status, reason, message) => {
    vi.stubEnv("TRANSCRIBER", "gemini"); vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: {
      message: "Sensitive provider details: test-key", details: [{ reason }],
    } }, { status })));
    const error = await transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), "English").catch((error: Error) => error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(message);
    expect((error as Error).message).not.toContain("test-key");
  });
  it.each([
    [new TypeError("fetch failed"), "internet connection"],
    [new DOMException("Timed out", "TimeoutError"), "timed out"],
  ])("explains Gemini connection failures", async (error, message) => {
    vi.stubEnv("TRANSCRIBER", "gemini"); vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    await expect(transcribe(new File(["clip"], "clip.webm", { type: "audio/webm" }), "English")).rejects.toThrow(message);
  });
  it("validates provider structured output and handles refusals", async () => {
    vi.stubEnv("EXTRACTOR", "openai"); vi.stubEnv("OPENAI_API_KEY", "test-key");
    const request = vi.fn().mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ summary: "Reviewed work", topics: [], actions: [{ action: "Submit work", dateText: "tomorrow" }] }) } }] }))
      .mockResolvedValueOnce(Response.json({ choices: [{ finish_reason: "stop", message: { content: null, refusal: "refused" } }] }));
    vi.stubGlobal("fetch", request);
    expect((await extractDraft("Submit work tomorrow", "English", "2026-10-30")).draft.actions[0].dueDate).toBe("2026-10-31");
    await expect(extractDraft("Submit work tomorrow", "English", "2026-10-30")).rejects.toThrow("could not be generated");
  });
  it("validates Gemini structured output before creating an editable draft", async () => {
    vi.stubEnv("EXTRACTOR", "gemini"); vi.stubEnv("GEMINI_API_KEY", "test-key");
    const request = vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ summary: "Reviewed work", topics: ["Assignments"], actions: [{ action: "Submit work", dateText: "tomorrow" }] }) }] } }] }));
    vi.stubGlobal("fetch", request);
    const result = await extractDraft("Submit work tomorrow", "English", "2026-10-30");
    expect(result).toEqual({ demo: false, draft: { summary: "Reviewed work", topics: ["Assignments"], actions: [{ action: "Submit work", dueDate: "2026-10-31" }] } });
    const body = JSON.parse(request.mock.calls[0][1].body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.required).toEqual(["summary", "topics", "actions"]);
  });
});
