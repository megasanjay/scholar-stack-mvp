export default defineEventHandler(async (event) => {
  const { identifier } = event.context.params as { identifier: string };

  const regex = /^[cv][a-zA-Z0-9-_]{8,9}$/;

  if (!regex.test(identifier)) {
    throw createError({
      message: "Invalid identifier",
      statusCode: 400,
    });
  }

  // Get all the resolutions for the version
  // going to limit this to the last 24 hours
  const views = await prisma.analytics.findMany({
    where: {
      created: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      identifier,
    },
  });

  // parse into hourly buckets
  // Create an object with the hour as the key and the count as the value
  const hourlyViews = views.reduce<{ [key: number]: number }>((acc, view) => {
    const hour = new Date(view.created).getHours();
    acc[hour] = acc[hour] ? acc[hour] + 1 : 1;
    return acc;
  }, {});

  // Create the x-axis labels for the chart
  // Should be the last 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - i);
    return date.getHours();
  });

  // reverse the hours so it's in chronological order
  hours.reverse();

  const data = hours.map((hour) => {
    return {
      // convert to 12 hour time label for the x-axis
      x: `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`,
      y: hourlyViews[hour] || 0,
    };
  });

  return {
    xAxis: (data.map((d) => d.x) as string[]) || [],
    yAxis: (data.map((d) => d.y) as number[]) || [],
  };
});
