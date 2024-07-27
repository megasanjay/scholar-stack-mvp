interface ResourceType {
  id: string;
  title: string;
  back_link_id: string | null;
  version_label: string | null;
  description: string;
  resource_type: string;
  identifier_type: string | null;
  action?: string;
  filled_in?: boolean;
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
  // children: ResourcesListItemChildren;
  // key: string;
  label: string;
  value: string;
  versionLabel?: string | null;
  action: string | null;
}

interface ResourcesList extends Array<ResourcesListItem> {}
