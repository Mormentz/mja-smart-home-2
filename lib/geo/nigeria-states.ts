/** Nigerian states + FCT with common LGAs (Abuja/FCT detailed). */

export type NigeriaLga = { name: string; areas?: string[] };

export type NigeriaState = {
  code: string;
  name: string;
  lgas: NigeriaLga[];
};

const FCT_AREAS = [
  "Wuse",
  "Wuse 2",
  "Garki",
  "Garki 2",
  "Maitama",
  "Asokoro",
  "Gwarinpa",
  "Jabi",
  "Utako",
  "Central Business District",
  "Life Camp",
  "Lokogoma",
  "Lugbe",
  "Karu",
  "Nyanya",
  "Kubwa",
  "Bwari",
  "Guzape",
  "Jahi",
  "Katampe",
  "Mabushi",
  "Apo",
  "Gaduwa",
  "Durumi",
  "Wuye",
  "Idu",
  "Karsana",
  "Dawaki",
  "Mpape",
  "Karmo",
  "Galadimawa",
  "Kaura",
  "Guzape Extension",
  "Other / Nearby",
];

export const NIGERIA_STATES: NigeriaState[] = [
  {
    code: "FC",
    name: "Federal Capital Territory (Abuja)",
    lgas: [
      { name: "Municipal Area Council (AMAC)", areas: FCT_AREAS },
      { name: "Bwari", areas: ["Bwari", "Kubwa", "Dutse", "Byazhin", "Other / Nearby"] },
      { name: "Gwagwalada", areas: ["Gwagwalada Town", "Dobi", "Other / Nearby"] },
      { name: "Kuje", areas: ["Kuje Town", "Other / Nearby"] },
      { name: "Kwali", areas: ["Kwali Town", "Other / Nearby"] },
      { name: "Abaji", areas: ["Abaji Town", "Other / Nearby"] },
    ],
  },
  { code: "LA", name: "Lagos", lgas: [{ name: "Ikeja" }, { name: "Eti-Osa" }, { name: "Alimosho" }, { name: "Surulere" }, { name: "Other" }] },
  { code: "RI", name: "Rivers", lgas: [{ name: "Port Harcourt" }, { name: "Obio-Akpor" }, { name: "Other" }] },
  { code: "KD", name: "Kaduna", lgas: [{ name: "Kaduna North" }, { name: "Kaduna South" }, { name: "Other" }] },
  { code: "KN", name: "Kano", lgas: [{ name: "Kano Municipal" }, { name: "Nassarawa" }, { name: "Other" }] },
  { code: "OY", name: "Oyo", lgas: [{ name: "Ibadan North" }, { name: "Ibadan South-West" }, { name: "Other" }] },
  { code: "OG", name: "Ogun", lgas: [{ name: "Abeokuta South" }, { name: "Ado-Odo/Ota" }, { name: "Other" }] },
  { code: "AN", name: "Anambra", lgas: [{ name: "Awka South" }, { name: "Onitsha North" }, { name: "Other" }] },
  { code: "EN", name: "Enugu", lgas: [{ name: "Enugu North" }, { name: "Enugu South" }, { name: "Other" }] },
  { code: "IM", name: "Imo", lgas: [{ name: "Owerri Municipal" }, { name: "Other" }] },
  { code: "AB", name: "Abia", lgas: [{ name: "Aba South" }, { name: "Umuahia North" }, { name: "Other" }] },
  { code: "ED", name: "Edo", lgas: [{ name: "Oredo" }, { name: "Egor" }, { name: "Other" }] },
  { code: "DE", name: "Delta", lgas: [{ name: "Warri South" }, { name: "Ughelli North" }, { name: "Other" }] },
  { code: "AK", name: "Akwa Ibom", lgas: [{ name: "Uyo" }, { name: "Other" }] },
  { code: "CR", name: "Cross River", lgas: [{ name: "Calabar Municipal" }, { name: "Other" }] },
  { code: "BY", name: "Bayelsa", lgas: [{ name: "Yenagoa" }, { name: "Other" }] },
  { code: "PL", name: "Plateau", lgas: [{ name: "Jos North" }, { name: "Jos South" }, { name: "Other" }] },
  { code: "BE", name: "Benue", lgas: [{ name: "Makurdi" }, { name: "Other" }] },
  { code: "KO", name: "Kogi", lgas: [{ name: "Lokoja" }, { name: "Other" }] },
  { code: "KW", name: "Kwara", lgas: [{ name: "Ilorin West" }, { name: "Other" }] },
  { code: "NI", name: "Niger", lgas: [{ name: "Chanchaga" }, { name: "Other" }] },
  { code: "SO", name: "Sokoto", lgas: [{ name: "Sokoto North" }, { name: "Other" }] },
  { code: "KT", name: "Katsina", lgas: [{ name: "Katsina" }, { name: "Other" }] },
  { code: "ZA", name: "Zamfara", lgas: [{ name: "Gusau" }, { name: "Other" }] },
  { code: "KE", name: "Kebbi", lgas: [{ name: "Birnin Kebbi" }, { name: "Other" }] },
  { code: "JI", name: "Jigawa", lgas: [{ name: "Dutse" }, { name: "Other" }] },
  { code: "BA", name: "Bauchi", lgas: [{ name: "Bauchi" }, { name: "Other" }] },
  { code: "GO", name: "Gombe", lgas: [{ name: "Gombe" }, { name: "Other" }] },
  { code: "YO", name: "Yobe", lgas: [{ name: "Damaturu" }, { name: "Other" }] },
  { code: "BO", name: "Borno", lgas: [{ name: "Maiduguri" }, { name: "Other" }] },
  { code: "AD", name: "Adamawa", lgas: [{ name: "Yola North" }, { name: "Other" }] },
  { code: "TA", name: "Taraba", lgas: [{ name: "Jalingo" }, { name: "Other" }] },
  { code: "NA", name: "Nasarawa", lgas: [{ name: "Lafia" }, { name: "Other" }] },
  { code: "OS", name: "Osun", lgas: [{ name: "Osogbo" }, { name: "Other" }] },
  { code: "ON", name: "Ondo", lgas: [{ name: "Akure South" }, { name: "Other" }] },
  { code: "EK", name: "Ekiti", lgas: [{ name: "Ado Ekiti" }, { name: "Other" }] },
  { code: "EB", name: "Ebonyi", lgas: [{ name: "Abakaliki" }, { name: "Other" }] },
];

export function getState(code: string) {
  return NIGERIA_STATES.find((s) => s.code === code);
}

export function getLgas(stateCode: string) {
  return getState(stateCode)?.lgas ?? [];
}

export function getAreas(stateCode: string, lgaName: string) {
  const lga = getLgas(stateCode).find((l) => l.name === lgaName);
  return lga?.areas ?? ["Other / Nearby"];
}
