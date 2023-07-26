export type Location = "Chelsea" | "Downtown Brooklyn" | "Prospect Heights";

export type SignupSymbol = "✅" | "❌";

export type Row = {
  Date: string;
  Time: string;
  "Class name": string;
  Location: Location;
  "Signed up?"?: SignupSymbol;
};
