interface ResourceType {
  id: string;
  title: string;
  back_link_id: string;
  description: string;
  icon: string;
  type: string | null;
  action?: string;
  target: string;
}

interface ResourcesListItemChild {
  label: string;
  value: string;
}

interface ResourcesListItemChildren extends Array<ResourcesListItemChild> {}

interface ResourcesListItem {
  children: ResourcesListItemChildren;
  key: string;
  label: string;
  type: string;
}

interface ResourcesList extends Array<ResourcesListItem> {}