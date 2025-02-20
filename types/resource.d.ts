interface ResourceType {
  id: string;
  title: string;
  backLinkId: string | null;
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

interface ResourcesListItemChildren extends Array<ResourcesListItemChild> {}

interface ResourcesListItem {
  label: string;
  value: string;
  versionLabel?: string | null;
  action: string | null;
}

interface ResourcesList extends Array<ResourcesListItem> {}
