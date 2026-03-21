export async function POST(request: Request) {
  return new Response('Hello from the API route! Your API key is: ', {
    headers: { 'Content-Type': 'application/json' },
  });
}
