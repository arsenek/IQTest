/**
 * Closed Chinese lexicon for VCI uniqueness proofs.
 * Membership and relations are exact string matches — no fuzzy synonyms.
 */

export type Category = {
  id: string;
  label: string;
  members: readonly string[];
};

export type Relation = {
  id: string;
  label: string;
  /** Ordered pairs (left → right) that satisfy the relation. */
  pairs: ReadonlyArray<readonly [string, string]>;
};

export const CATEGORIES: readonly Category[] = [
  {
    id: "fruit",
    label: "水果",
    members: ["苹果", "香蕉", "橙子", "葡萄", "西瓜", "桃子", "梨", "草莓"],
  },
  {
    id: "animal",
    label: "动物",
    members: ["猫", "狗", "兔子", "老虎", "狮子", "大象", "鸟", "鱼"],
  },
  {
    id: "vehicle",
    label: "交通工具",
    members: ["汽车", "火车", "飞机", "轮船", "自行车", "地铁", "公交车", "摩托车"],
  },
  {
    id: "furniture",
    label: "家具",
    members: ["桌子", "椅子", "床", "柜子", "沙发", "书架", "凳子", "衣柜"],
  },
  {
    id: "school-tool",
    label: "学习用品",
    members: ["铅笔", "橡皮", "尺子", "书包", "笔记本", "蜡笔", "剪刀", "胶水"],
  },
  {
    id: "weather",
    label: "天气现象",
    members: ["下雨", "下雪", "刮风", "打雷", "出太阳", "起雾", "冰雹", "彩虹"],
  },
  {
    id: "body-part",
    label: "身体部位",
    members: ["手", "脚", "眼睛", "耳朵", "鼻子", "嘴巴", "头", "膝盖"],
  },
  {
    id: "color",
    label: "颜色",
    members: ["红色", "蓝色", "黄色", "绿色", "黑色", "白色", "紫色", "橙色"],
  },
  {
    id: "profession",
    label: "职业",
    members: ["医生", "教师", "警察", "厨师", "司机", "护士", "法官", "工程师"],
  },
  {
    id: "science-method",
    label: "科学方法概念",
    members: ["假设", "实验", "对照", "样本", "变量", "信度", "效度", "常模"],
  },
  {
    id: "logic-term",
    label: "逻辑关系词",
    members: ["充分", "必要", "充分必要", "矛盾", "蕴含", "等价", "否定", "合取"],
  },
  {
    id: "econ-term",
    label: "经济学基础概念",
    members: ["供给", "需求", "稀缺", "机会成本", "边际", "均衡", "弹性", "外部性"],
  },
  {
    id: "geo-feature",
    label: "地理要素",
    members: ["山脉", "河流", "平原", "高原", "海洋", "湖泊", "沙漠", "岛屿"],
  },
  {
    id: "literary-device",
    label: "修辞手法",
    members: ["比喻", "拟人", "夸张", "排比", "借代", "对偶", "反问", "设问"],
  },
];

export const RELATIONS: readonly Relation[] = [
  {
    id: "habitat",
    label: "栖息地",
    pairs: [
      ["鸟", "天空"],
      ["鱼", "水"],
      ["蜜蜂", "蜂巢"],
      ["蚂蚁", "蚁穴"],
      ["骆驼", "沙漠"],
      ["企鹅", "南极"],
    ],
  },
  {
    id: "workplace",
    label: "工作场所",
    pairs: [
      ["医生", "医院"],
      ["法官", "法院"],
      ["教师", "学校"],
      ["厨师", "厨房"],
      ["飞行员", "机场"],
      ["演员", "剧院"],
    ],
  },
  {
    id: "tool-use",
    label: "工具用途对象",
    pairs: [
      ["笔", "纸"],
      ["钥匙", "锁"],
      ["锤子", "钉子"],
      ["剪刀", "布"],
      ["扫帚", "地面"],
      ["梳子", "头发"],
    ],
  },
  {
    id: "part-whole",
    label: "部分与整体",
    pairs: [
      ["轮子", "汽车"],
      ["树叶", "树"],
      ["页", "书"],
      ["手指", "手"],
      ["屋顶", "房子"],
      ["琴键", "钢琴"],
    ],
  },
  {
    id: "antonym",
    label: "反义",
    pairs: [
      ["热", "冷"],
      ["快", "慢"],
      ["多", "少"],
      ["高", "低"],
      ["开", "关"],
      ["进", "出"],
      ["稀缺", "充裕"],
      ["储蓄", "消费"],
    ],
  },
  {
    id: "category-member",
    label: "范畴成员",
    pairs: [
      ["玫瑰", "花"],
      ["麻雀", "鸟"],
      ["鲤鱼", "鱼"],
      ["橡树", "树"],
      ["小提琴", "乐器"],
      ["诗歌", "文学"],
    ],
  },
  {
    id: "cause-effect",
    label: "因果",
    pairs: [
      ["下雨", "地湿"],
      ["加热", "蒸发"],
      ["摩擦", "生热"],
      ["播种", "发芽"],
      ["学习", "进步"],
      ["感染", "发热"],
    ],
  },
  {
    id: "degree",
    label: "程度递进",
    pairs: [
      ["温", "热"],
      ["小", "大"],
      ["走", "跑"],
      ["看", "盯"],
      ["说", "喊"],
      ["喜", "狂喜"],
    ],
  },
];

const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));
const relationById = new Map(RELATIONS.map((r) => [r.id, r]));

export function getCategory(id: string): Category {
  const c = categoryById.get(id);
  if (!c) throw new Error(`unknown VCI category: ${id}`);
  return c;
}

export function getRelation(id: string): Relation {
  const r = relationById.get(id);
  if (!r) throw new Error(`unknown VCI relation: ${id}`);
  return r;
}

export function isMember(categoryId: string, term: string): boolean {
  return getCategory(categoryId).members.includes(term);
}

export function related(relationId: string, left: string, right: string): boolean {
  return getRelation(relationId).pairs.some(([a, b]) => a === left && b === right);
}

/** All right-hand sides that complete R(left, ?). */
export function completions(relationId: string, left: string): string[] {
  return getRelation(relationId)
    .pairs.filter(([a]) => a === left)
    .map(([, b]) => b);
}
