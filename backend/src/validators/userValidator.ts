export function validateRegisterInput(body: any): {
  username: string;
  name: string;
} {
  const { username, name } = body;

  if (!username || typeof username !== "string") {
    throw new Error("Invalid username");
  }

  if (!name || typeof name !== "string") {
    throw new Error("Invalid name");
  }

  return { username, name };
}
