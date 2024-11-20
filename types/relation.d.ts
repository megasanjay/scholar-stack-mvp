interface InternalRelation {
  id: string;
  type: string | null;
  target_id: string | null;
  original_relation_id?: string | null;
  resource_type: string | null;
  created: Date;
  updated: Date;
  action?: string;
  origin: "local" | "remote";
}

interface ExternalRelation {
  id: string;
  type: string | null;
  original_relation_id?: string | null;
  target: string;
  target_type: string | null;
  resource_type: string | null;
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
  original_relation_id?: string | null;
  target_type: string | null;
  resource_type: string | null;
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
  source_id: string;
  original_relation_id: string | null;
  target_id: string;
  type: string;
  resource_type: string;
  action: null;
  mirror: boolean;
  created: Date;
  updated: Date;
}

interface CatalogExternalRelation {
  id: string;
  source_id: string;
  original_relation_id: string | null;
  target: string;
  target_type: string;
  type: string;
  resource_type: string;
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
  created: Date;
  external: boolean;
  original_relation_id: string | null;
  resource_type: string | null;
  source: string | null;
  source_name: string | null;
  source_original_id: string | null;
  target: string | null;
  target_name?: string | null;
  target_original_id?: string | null;
  target_type?: string | null;
  type: string;
  updated: Date;
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
