export type GroupItem = {
  id: string;
  type: "item";
};

export type GroupContainer = {
  id: string;
  type: "group";
  items: GroupItem[];
  name: string;
};

export type Group = GroupItem | GroupContainer;
