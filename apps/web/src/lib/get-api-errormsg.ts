type ApiErrorShape = {
  response?: { _data?: { message?: string } };
  data?: { message?: string };
};

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const shape = error as ApiErrorShape;
    const serverMessage = shape.response?._data?.message ?? shape.data?.message;
    if (typeof serverMessage === "string" && serverMessage.length > 0) {
      return serverMessage;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
