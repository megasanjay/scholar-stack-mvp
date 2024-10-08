interface CollectionGETAPIResponse {
  id: string;
  title: string;
  created: string;
  updated: string;
  description: string;
  detailedDescription: string;
  identifier: string;
  image_url: string;
  private: boolean;
  type: string;
  resources: ResourceType[];
  version: Version | null;
}

interface Collection {
  id: string;
  title: string;
  created: string;
  updated: string;
  description: string;
  detailedDescription: string;
  identifier: string;
  image_url: string;
  version: Version | null;
}

interface Collections extends Array<Collection> {}

interface CollectionAccessUser {
  id: string;
  username: string;
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
  identifierType: string | null;
  nameType: string;
}

interface CollectionCreators extends Array<CollectionCreator> {}
