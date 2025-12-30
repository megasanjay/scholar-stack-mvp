interface ResourceType {
  id: string;
  title: string;
  versionLabel: string | null;
  description: string;
  resourceType: string;
  identifierType: string | null;
  action?: string;
  filledIn?: boolean;
  identifier: string;
  created: string;
  updated: string;
}

interface ResourcesListItemChild {
  label: string;
  value: string;
}

type ResourcesListItemChildren = Array<ResourcesListItemChild>;

interface ResourcesListItem {
  label: string;
  value: string;
  versionLabel?: string | null;
  action: string | null;
}

type ResourcesList = Array<ResourcesListItem>;
