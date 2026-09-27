export const MODES = [
  { id: "campaign", name: "Campaña", endless: false },
  { id: "endless", name: "Infinito", endless: true },
];

export function getMode(id) {
  return MODES.find((m) => m.id === id) || MODES[0];
}
