interface APIResponseWorkspaceCollectionItem {
  id: number;

  title: string;
  description: string;
  detailedDescription: string;
  imageUrl: string;

  created: string;
  updated: string;

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
