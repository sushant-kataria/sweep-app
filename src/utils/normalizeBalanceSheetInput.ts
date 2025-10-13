// src/utils/normalizeBalanceSheetInput.ts
export function normalizeBalanceSheetInput(input: any) {
    const fixSection = (section: any) => {
      if (Array.isArray(section)) return { current: section, nonCurrent: [] };
      if (!section || typeof section !== "object") return { current: [], nonCurrent: [] };
      if (!("current" in section) && !("nonCurrent" in section)) return { current: [], nonCurrent: [] };
      return section;
    };
    return {
      ...input,
      assets: fixSection(input.assets),
      liabilities: fixSection(input.liabilities),
    };
  }
  