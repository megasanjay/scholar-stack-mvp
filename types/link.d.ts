type LinkTargetType = "doi" | "url";

type LinkAction = "create" | "update" | "delete" | "target_update";

type LinkOrigin = "local" | "remote";

interface LinkType {
  id: string;
  name: string;

  description: string;
  icon: string;

  type: LinkTargetType;
  target: string;
}

interface LinksList extends Array<LinkType> {}

interface LocalLinkType extends LinkType {
  action?: LinkAction;

  origin?: LinkOrigin;

  original?: LinkType;
  originalAction?: LinkAction;
  preDeleteAction?: LinkAction;
}
interface QueryLinksListItem extends LinkType {
  action: LinkAction;
}
