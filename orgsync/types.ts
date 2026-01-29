export type OrgType = 'company' | 'hospital';

export interface OrgNode {
  id: string;
  name: string;
  title: string; // e.g. CEO, Director, Nurse
  orgType: OrgType;
  parentId: string | null;
  scope?: string; // Description of duties
  note?: string;
  bridgeId?: string; // ID of a node in the OTHER org that this person connects to
  isBridge?: boolean; // Visual flag
}

export interface TreeData extends OrgNode {
  children: TreeData[];
}

export type NodeAction = 'add' | 'edit' | 'delete' | 'view';
