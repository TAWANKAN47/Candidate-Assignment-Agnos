import { describe, expect, it } from "vitest";
import { getAddressRecord, getDistrictOptions, getProvinceOptions, getSubdistrictOptions } from "./thai-address";

describe("thai address lookup", () => {
  it("keeps Thai names as valid UTF-8 text", () => {
    const bangkok = getProvinceOptions("th").find((option) => option.label === "กรุงเทพมหานคร");
    expect(bangkok).toBeDefined();

    const phraNakhon = getDistrictOptions(bangkok!.value, "th").find((option) => option.label === "พระนคร");
    expect(phraNakhon).toBeDefined();

    const palace = getSubdistrictOptions(phraNakhon!.value, "th").find((option) => option.label === "พระบรมมหาราชวัง");
    expect(palace).toBeDefined();
    expect(getAddressRecord(palace!.value)).toMatchObject({
      provinceCode: "10",
      provinceTh: "กรุงเทพมหานคร",
      provinceEn: "Bangkok",
      districtCode: "1001",
      districtTh: "พระนคร",
      districtEn: "Phra Nakhon",
      subdistrictCode: "100101",
      subdistrictTh: "พระบรมมหาราชวัง",
      subdistrictEn: "Phra Borom Maha Ratchawang",
      postalCode: "10200"
    });
  });

  it("cascades from province to postal code", () => {
    const bangkok = getProvinceOptions("en").find((option) => option.label === "Bangkok");
    expect(bangkok).toBeDefined();

    const pathumWan = getDistrictOptions(bangkok!.value, "en").find((option) => option.label === "Pathum Wan");
    expect(pathumWan).toBeDefined();

    const lumphini = getSubdistrictOptions(pathumWan!.value, "en").find((option) => option.label === "Lumphini");
    expect(lumphini).toBeDefined();

    expect(getAddressRecord(lumphini!.value)?.postalCode).toBe("10330");
  });
});
