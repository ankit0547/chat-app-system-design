export const getAction = (action, data = null) => {
  if (!action || action === undefined) return "Action type not defined";

  return { type: action, payload: data };
};

// Common Actions

export const ProcessingStart = () => ({
  type: "REQUEST_PROCESSING_START",
  payload: true,
});

export const ProcessingEnd = () => ({
  type: "REQUEST_PROCESSING_END",
  payload: false,
});
