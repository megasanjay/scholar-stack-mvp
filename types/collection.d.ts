interface CollectionGETAPIResponse {
  id: number;
  title: string;
  created: string;
  updated: string;
  description: string;
  detailedDescription: string;
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
  detailedDescription: string;
  imageUrl: string;
  version: Version | null;
}

interface Collections extends Array<Collection> {}

interface CollectionAccessUser {
  id: string;
  name: string;
  created: string;
  emailAddress: string;
  role: string;
}

interface CollectionAccessTeam extends Array<CollectionAccessUser> {}

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

interface CollectionCreators extends Array<CollectionCreator> {}
