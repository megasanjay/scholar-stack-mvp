interface AllVersionsItem {
  name: string;
  updated: string;
  created: string;
  identifier: string;
}

interface AllVersionsType extends Array<AllVersionsItem> {}

interface Version {
  id: number;
  name: string;
  changelog: string;
  created: string;
  published: boolean;
  publishedOn: string;
  updated: string;
}

interface VersionWithLinks extends Version {
  links?: Link[];
}
