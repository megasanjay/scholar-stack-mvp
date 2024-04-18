interface APIResponseWorkspaceCollectionItem {
  id: string;

  title: string;
  description: string;
  detailedDescription: string;
  image_url: string;

  created: string;
  updated: string;
  identifier: string;

  version: Version | null;
}

interface APIResponseWorkspace {
  id: string;

  title: string;
  description: string;

  personal: boolean;

  collections: APIResponseWorkspaceCollectionItem[];

  hiddenCollectionsCount: number;
}

interface Workspace {
  id: string;
  title: string;
  description: string;
  personal: boolean;
  created: string;
}

interface Workspaces extends Array<Workspace> {}
