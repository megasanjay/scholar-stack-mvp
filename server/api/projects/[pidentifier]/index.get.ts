// import protectRoute from "../../utils/protectRoute";
import prisma from "../../../utils/prisma";

// @ts-ignore
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  const { pidentifier } = event.context.params as { pidentifier: string };

  if (!pidentifier) {
    throw createError({
      message: "Missing identifier",
      statusCode: 400,
    });
  }

  const project = await prisma.project.findUnique({
    include: {
      versions: {
        orderBy: { created: "desc" },
        select: {
          name: true,
          created: true,
          identifier: true,
        },
      },
    },
    where: { identifier: pidentifier },
  });

  if (!project) {
    throw createError({
      message: "Project not found",
      statusCode: 404,
    });
  }

  const responseProject: ResponseProject = {
    id: project.id,
    name: project.name,
    created: project.created.toISOString(),
    description: project.description,
    identifier: project.identifier,
    image: project.image,
    isAuthor: false,
    latestVersion: {},
    tags: project.tags,
    updated: project.updated.toISOString(),
    versions: project.versions.map((version) => {
      return {
        name: version.name,
        created: version.created.toISOString(),
        identifier: version.identifier,
      };
    }),
  };

  if (user?.id === project.authorId) {
    responseProject.isAuthor = true;
  }

  const latestVersion = await prisma.version.findFirst({
    include: {
      links: true,
    },
    orderBy: { created: "desc" },
    where: { projectId: project.id },
  });

  const response = {
    ...responseProject,
    latestVersion: latestVersion || {},
  };

  return response;
});
