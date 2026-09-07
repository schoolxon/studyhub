export function cn(...inputs) {
  return inputs
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return value;
      if (typeof value === "object") {
        return Object.entries(value)
          .filter(([, on]) => Boolean(on))
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");
}
