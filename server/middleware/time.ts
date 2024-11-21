export default defineEventHandler((event) => {
  const STREAM_ENDPOINT =
    "https://logwatch.fairdataihub.org/api/log/cm3qiked60004o4xpv0q1r76l";
  const startTime = Date.now();

  event.node.res.on("finish", () => {
    const endTime = Date.now();
    // sourcery skip: binary-operator-identity
    const duration = endTime - startTime;

    const message = `Request to ${event.node.req.url} took ${duration}ms to resolve.`;

    // Send the request to the logwatch endpoint without waiting for the response
    fetch(STREAM_ENDPOINT, {
      body: JSON.stringify({
        level: "time",
        message,
        type: "text",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          console.error(
            `Failed to send log message to logwatch: ${response.status}`,
          );
        }
      })
      .catch((error) => {
        console.error(`Failed to send log message to logwatch: ${error}`);
      });

    console.log(message);
  });
});
