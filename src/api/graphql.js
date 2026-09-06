const GRAPHQL_URL =
  process.env.REACT_APP_GRAPHQL_URL || "/graphql";

export async function graphqlRequest(query, variables = {}) {
  let response;

  try {
    response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to the backend. Make sure the backend is running on http://localhost:5000, then refresh this page."
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("The backend returned an invalid response. Check the backend console for details.");
  }

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || "API request failed.");
  }

  return payload.data;
}
