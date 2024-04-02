export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinEditorPermission(event);

  const { collectionid } = event.context.params as {
    collectionid: string;
  };

  const body = await readMultipartFormData(event);

  if (!body) {
    throw createError({
      message: "Missing file",
      statusCode: 400,
    });
  }

  if (body.length !== 1) {
    throw createError({
      message: "Expected exactly one file",
      statusCode: 400,
    });
  }

  const file = body[0];

  // Check if the file size is less than 2MB
  if (file.data.length > 2 * 1024 * 1024) {
    throw createError({
      message: "File size too large",
      statusCode: 400,
    });
  }

  const fileName = file.filename ?? "";
  const fileExtension = fileName.split(".").pop();

  const newFileName = `${collectionid}.${fileExtension}`;

  const headers = new Headers();
  headers.set("AccessKey", process.env.BUNNY_STORAGE_ACCESS_KEY ?? "");
  headers.set("Content-Type", file.type ?? "");

  const uploadResponse = await fetch(
    `https://la.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_BUCKET_NAME}/collection/${newFileName}`,
    {
      body: file.data,
      headers,
      method: "PUT",
    },
  );

  if (!uploadResponse.ok) {
    throw createError({
      message: "Failed to upload file to Bunny",
      statusCode: 500,
    });
  }

  console.log(file);

  const newImageUrl = `https://sciconnect-test.b-cdn.net/collection/${newFileName}`;

  console.log(newImageUrl);

  await prisma.collection.update({
    data: {
      image_url: newImageUrl,
    },
    where: {
      id: collectionid,
    },
  });

  return {
    message: "Thumbnail uploaded successfully",
    statusCode: 201,
  };
});
