interface APIResponseNewProject {
  name: string;
  description: string;
  identifier: string;
  image: string;
  tags: string[];
}

interface APIResponseProjectVersionAddEdit {
  status: string;
  version?: string;
  identifier?: string;
}

interface APIResponseProject {
  id: string;

  isAuthor: boolean;

  name: string;
  description: string;
  image: string;
  tags: string[];
  created: string;
  updated: string;

  identifier: string;

  versions: AllVersionsType;

  latestVersion: VersionWithLinks | {};
}

interface APIResponseProjectVersion {
  id: string;

  isAuthor: boolean;

  name: string;
  description: string;
  image: string;
  tags: string[];
  created: string;
  updated: string;

  identifier: string;

  versions: AllVersionsType;

  versionDetails: VersionWithLinks | {};
}
