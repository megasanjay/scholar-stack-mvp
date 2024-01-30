interface InternalRelation {
  id: string;
  type: string | null;
  target_id: string | null;
  original_id: string | null;
  resource_type: string | null;
  created: string;
  updated: string;
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
  created: string;
  updated: string;
  action?: string;
  origin: "local" | "remote";
}

interface Relations {
  internal: InternalRelation[];
  external: ExternalRelation[];
}
