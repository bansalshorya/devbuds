import Papa from "papaparse";

export type DepartmentImportRow =
  | {
      rowNumber: number;
      role: "MENTOR";
      name: string;
      mobile: string;
    }
  | {
      rowNumber: number;
      role: "STUDENT";
      name: string;
      mobile: string;
      rollNo: string;
      mentorMobile: string | null;
    };

type CsvRecord = Record<string, string | undefined>;

const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const clean = (value: string | undefined) => value?.trim() ?? "";

export function parseDepartmentCsv(csv: string): { rows: DepartmentImportRow[]; errors: string[] } {
  const parsed = Papa.parse<CsvRecord>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });

  const errors = parsed.errors.map((error) => {
    const row = typeof error.row === "number" ? `Row ${error.row + 2}: ` : "";
    return `${row}${error.message}`;
  });
  const fields = new Set(parsed.meta.fields ?? []);
  for (const required of ["role", "name", "mobile"]) {
    if (!fields.has(required)) errors.push(`Missing required column: ${required}`);
  }

  if (parsed.data.length > 500) {
    errors.push("A CSV can contain at most 500 data rows");
  }

  const rows: DepartmentImportRow[] = [];
  const seenMobiles = new Map<string, number>();
  const seenRollNumbers = new Map<string, number>();

  for (const [index, record] of parsed.data.slice(0, 500).entries()) {
    const rowNumber = index + 2;
    const roleText = clean(record.role).toUpperCase();
    const name = clean(record.name);
    const mobile = clean(record.mobile);

    if (name.length < 2 || name.length > 100) {
      errors.push(`Row ${rowNumber}: name must contain 2 to 100 characters`);
    }
    if (!/^\d{10}$/.test(mobile)) {
      errors.push(`Row ${rowNumber}: mobile must contain exactly 10 digits`);
    }

    const previousMobileRow = seenMobiles.get(mobile);
    if (mobile && previousMobileRow) {
      errors.push(`Row ${rowNumber}: mobile duplicates row ${previousMobileRow}`);
    } else if (mobile) {
      seenMobiles.set(mobile, rowNumber);
    }

    if (roleText === "FACULTY" || roleText === "MENTOR") {
      rows.push({ rowNumber, role: "MENTOR", name, mobile });
      continue;
    }

    if (roleText === "STUDENT") {
      const rollNo = clean(record.rollno);
      const mentorMobile = clean(record.mentormobile) || null;
      if (!rollNo || rollNo.length > 50) {
        errors.push(`Row ${rowNumber}: rollNo is required for students and must be at most 50 characters`);
      }
      const previousRollRow = seenRollNumbers.get(rollNo);
      if (rollNo && previousRollRow) {
        errors.push(`Row ${rowNumber}: rollNo duplicates row ${previousRollRow}`);
      } else if (rollNo) {
        seenRollNumbers.set(rollNo, rowNumber);
      }
      if (mentorMobile && !/^\d{10}$/.test(mentorMobile)) {
        errors.push(`Row ${rowNumber}: mentorMobile must contain exactly 10 digits`);
      }
      rows.push({ rowNumber, role: "STUDENT", name, mobile, rollNo, mentorMobile });
      continue;
    }

    errors.push(`Row ${rowNumber}: role must be FACULTY or STUDENT`);
  }

  return { rows, errors };
}
