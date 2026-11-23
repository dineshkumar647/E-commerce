// DFA transition function δ(currentState, event) -> nextState.
// Missing transitions return null and must be rejected.
export const transitions = Object.freeze({
  PLACED: { CONFIRM: "CONFIRMED", CANCEL: "CANCELLED" },
  CONFIRMED: { PACK: "PACKED", CANCEL: "CANCELLED" },
  PACKED: { SHIP: "SHIPPED" },
  SHIPPED: { OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY" },
  OUT_FOR_DELIVERY: { DELIVER: "DELIVERED" },
  DELIVERED: {},
  CANCELLED: {}
});
export const states = Object.freeze(Object.keys(transitions));
export function nextOrderState(currentState, event) {
  return transitions[currentState]?.[event] ?? null;
}
