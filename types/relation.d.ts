interface InternalRelation {
  id: string;
  type: string | null;
  targetId: string | null;
  originalRelationId?: string | null;
  resourceType: string | null;
  created: Date;
  updated: Date;
  action?: string;
  origin: "local" | "remote";
}

interface ExternalRelation {
  id: string;
  type: string | null;
  originalRelationId?: string | null;
  target: string;
  targetType: string | null;
  resourceType: string | null;
  created: Date;
  updated: Date;
  action?: string;
  origin: "local" | "remote";
}

interface Relations {
  internal: InternalRelation[];
  external: ExternalRelation[];
}

interface GroupedRelation {
  id: string;
  type: string | null;
  external: boolean;
  target: string | null;
  originalRelationId?: string | null;
  targetType: string | null;
  resourceType: string | null;
  created: Date;
  updated: Date;
  source: string | null;
  action?: string | null;
}

interface GroupedRelations {
  [key: string]: GroupedRelation[];
}

interface CatalogInternalRelation {
  id: string;
  sourceId: string;
  originalRelationId: string | null;
  targetId: string;
  type: string;
  resourceType: string;
  action: null;
  mirror: boolean;
  created: Date;
  updated: Date;
}

interface CatalogExternalRelation {
  id: string;
  sourceId: string;
  originalRelationId: string | null;
  target: string;
  targetType: string;
  type: string;
  resourceType: string;
  action: null;
  created: Date;
  updated: Date;
}

interface CatalogRelations {
  internal: CatalogInternalRelation[];
  external: CatalogExternalRelation[];
}

interface AllRelationsItem {
  id: string;
  action: string | null;
  external: boolean;
  originalRelationId: string | null;
  resourceType: string | null;
  source: string | null;
  sourceName: string | null;
  sourceOriginalId: string | null;
  target: string | null;
  targetName?: string | null;
  targetOriginalId?: string | null;
  targetType?: string | null;
  type: string;
}

type GR = {
  [relationKey: string]: AllRelationsItem[];
};

type GGR = {
  [key: string]: {
    name: string;
    relations: GR;
  };
};
