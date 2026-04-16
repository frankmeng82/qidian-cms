export type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  videoCount: number;
  children: CategoryNode[];
};
