interface CollectionGETAPIResponse {
  id: number;
  title: string;
  created: string;
  updated: string;
  description: string;
  imageUrl: string;
  private: boolean;
  type: string;
  resources: ResourceType[];
  version: Version | null;
}

interface Collection {
  id: number;
  title: string;
  created: string;
  updated: string;
  description: string;
  imageUrl: string;
  version: Version | null;
}

type Collections = Array<Collection>;

interface CollectionAccessUser {
  id: string;
  name: string;
  created: string;
  emailAddress: string;
  role: string;
}

type CollectionAccessTeam = Array<CollectionAccessUser>;

interface CollectionCreator {
  affiliation: string;
  creatorIndex: number;
  creatorName: string;
  familyName: string;
  givenName: string;
  identifier: string;
  identifierType: string | undefined | null;
  nameType: string;
}

type CollectionCreators = Array<CollectionCreator>;
