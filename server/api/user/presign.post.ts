import { z } from "zod";
// import jwt from "jsonwebtoken";
import { serverSupabaseUser } from "#supabase/server";

// const { sign } = jwt;

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();

  await protectRoute(event);

  const bodySchema = z.object({
    fileName: z.string().min(1),
    fileSize: z.number().min(1),
    fileType: z.string().min(1),
  });

  const user = await serverSupabaseUser(event);

  const userId = user?.id as string;

  const body = await readBody(event);

  if (!body) {
    throw createError({
      message: "Missing required fields",
      statusCode: 400,
    });
  }

  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    throw createError({
      message: "The provided parameters are invalid",
      statusCode: 400,
    });
  }

  const { fileName, fileSize, fileType } = parsedBody.data;

  if (fileName !== userId) {
    throw createError({
      message: "Invalid file name",
      statusCode: 400,
    });
  }

  if (fileSize > 1024 * 1024 * 2) {
    throw createError({
      message: "File size is too big. Max size is 2MB",
      statusCode: 400,
    });
  }

  const data = {
    fileName,
    fileSize,
    fileType,
  };

  // token expires in 5 seconds
  // this should be long enough to send out the request to upload the file
  // const token = sign(
  //   {
  //     data,
  //   },
  //   runtimeConfig.UPLOAD_TOKEN_SECRET,
  //   {
  //     expiresIn: "5s",
  //   },
  // );

  // const url = `https://upload.sciconnect.io/avatar?token=${token}`;

  return {
    // signedUrl: url,
    statusCode: 200,
  };
});
