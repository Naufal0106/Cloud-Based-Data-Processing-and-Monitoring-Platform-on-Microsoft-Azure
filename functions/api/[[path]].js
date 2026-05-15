export async function onRequest(context) {
  const { request, env, params } = context;
  const azureBaseUrl = env.AZURE_FUNCTION_URL;
  const functionKey = env.AZURE_FUNCTION_KEY;

  if (!azureBaseUrl || !functionKey) {
    return jsonResponse(
      {
        success: false,
        error: "Backend proxy belum dikonfigurasi",
      },
      503,
    );
  }

  const path = Array.isArray(params.path) ? params.path.join("/") : params.path || "";
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${azureBaseUrl.replace(/\/+$/, "")}/${path}`);

  incomingUrl.searchParams.forEach((value, key) => {
    if (key.toLowerCase() !== "code") {
      targetUrl.searchParams.set(key, value);
    }
  });
  targetUrl.searchParams.set("code", functionKey);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init = {
    method: request.method,
    headers,
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("set-cookie");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
