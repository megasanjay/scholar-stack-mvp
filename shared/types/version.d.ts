interface AllVersionsItem {
  name: string;
  updated: string;
  created: string;
  identifier: string;
}

type AllVersionsType = Array<AllVersionsItem>;

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
