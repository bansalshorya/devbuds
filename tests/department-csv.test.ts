import { describe, expect, it } from "vitest";
import { parseDepartmentCsv } from "../src/server/import/departmentCsv";

describe("department CSV import", () => {
  it("parses faculty and students with an optional assignment", () => {
    const csv = [
      "role,name,mobile,rollNo,mentorMobile",
      "FACULTY,Dr. Meena Kumar,9000000010,,",
      "STUDENT,Ananya Rao,9100000030,CS2026030,9000000010",
    ].join("\n");

    const result = parseDepartmentCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { rowNumber: 2, role: "MENTOR", name: "Dr. Meena Kumar", mobile: "9000000010" },
      { rowNumber: 3, role: "STUDENT", name: "Ananya Rao", mobile: "9100000030", rollNo: "CS2026030", mentorMobile: "9000000010" },
    ]);
  });

  it("reports invalid roles, mobiles and missing student roll numbers", () => {
    const csv = [
      "role,name,mobile,rollNo,mentorMobile",
      "TEACHER,A,123,,",
      "STUDENT,Valid Name,9100000030,,not-a-phone",
    ].join("\n");

    const result = parseDepartmentCsv(csv);
    expect(result.errors).toEqual(expect.arrayContaining([
      "Row 2: role must be FACULTY or STUDENT",
      "Row 2: mobile must contain exactly 10 digits",
      "Row 3: rollNo is required for students and must be at most 50 characters",
      "Row 3: mentorMobile must contain exactly 10 digits",
    ]));
  });

  it("rejects duplicate mobiles and roll numbers within the file", () => {
    const csv = [
      "role,name,mobile,rollNo,mentorMobile",
      "STUDENT,First Student,9100000030,CS30,",
      "STUDENT,Second Student,9100000030,CS30,",
    ].join("\n");

    const result = parseDepartmentCsv(csv);
    expect(result.errors).toContain("Row 3: mobile duplicates row 2");
    expect(result.errors).toContain("Row 3: rollNo duplicates row 2");
  });
});
