const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/data/worldCitiesZh.json');

const newCities = [
  {"name": "桂林", "en_name": "Guilin", "country": "中国", "province": "广西", "lat": 25.2345, "lng": 110.1800},
  {"name": "阳朔", "en_name": "Yangshuo", "country": "中国", "province": "广西", "lat": 24.7765, "lng": 110.4922},
  {"name": "南宁", "en_name": "Nanning", "country": "中国", "province": "广西", "lat": 22.8170, "lng": 108.3665},
  {"name": "北海", "en_name": "Beihai", "country": "中国", "province": "广西", "lat": 21.4812, "lng": 109.1192},
  {"name": "丽江", "en_name": "Lijiang", "country": "中国", "province": "云南", "lat": 26.8608, "lng": 100.2259},
  {"name": "昆明", "en_name": "Kunming", "country": "中国", "province": "云南", "lat": 24.8801, "lng": 102.8329},
  {"name": "香格里拉", "en_name": "Shangri-La", "country": "中国", "province": "云南", "lat": 27.8288, "lng": 99.7071},
  {"name": "西双版纳", "en_name": "Xishuangbanna", "country": "中国", "province": "云南", "lat": 22.0076, "lng": 100.7972},
  {"name": "三亚", "en_name": "Sanya", "country": "中国", "province": "海南", "lat": 18.2528, "lng": 109.5120},
  {"name": "海口", "en_name": "Haikou", "country": "中国", "province": "海南", "lat": 20.0174, "lng": 110.3492},
  {"name": "厦门", "en_name": "Xiamen", "country": "中国", "province": "福建", "lat": 24.4798, "lng": 118.0894},
  {"name": "福州", "en_name": "Fuzhou", "country": "中国", "province": "福建", "lat": 26.0745, "lng": 119.2965},
  {"name": "泉州", "en_name": "Quanzhou", "country": "中国", "province": "福建", "lat": 24.8741, "lng": 118.6757},
  {"name": "张家界", "en_name": "Zhangjiajie", "country": "中国", "province": "湖南", "lat": 29.1170, "lng": 110.4792},
  {"name": "凤凰古城", "en_name": "Fenghuang", "country": "中国", "province": "湖南", "lat": 27.9488, "lng": 109.6050},
  {"name": "黄山", "en_name": "Huangshan", "country": "中国", "province": "安徽", "lat": 29.7147, "lng": 118.3375},
  {"name": "合肥", "en_name": "Hefei", "country": "中国", "province": "安徽", "lat": 31.8206, "lng": 117.2272},
  {"name": "拉萨", "en_name": "Lhasa", "country": "中国", "province": "西藏", "lat": 29.6525, "lng": 91.1721},
  {"name": "林芝", "en_name": "Nyingchi", "country": "中国", "province": "西藏", "lat": 29.6456, "lng": 94.3615},
  {"name": "西宁", "en_name": "Xining", "country": "中国", "province": "青海", "lat": 36.6171, "lng": 101.7782},
  {"name": "兰州", "en_name": "Lanzhou", "country": "中国", "province": "甘肃", "lat": 36.0611, "lng": 103.8343},
  {"name": "敦煌", "en_name": "Dunhuang", "country": "中国", "province": "甘肃", "lat": 40.1421, "lng": 94.6620},
  {"name": "贵阳", "en_name": "Guiyang", "country": "中国", "province": "贵州", "lat": 26.6477, "lng": 106.6302},
  {"name": "珠海", "en_name": "Zhuhai", "country": "中国", "province": "广东", "lat": 22.2707, "lng": 113.5767},
  {"name": "郑州", "en_name": "Zhengzhou", "country": "中国", "province": "河南", "lat": 34.7466, "lng": 113.6253},
  {"name": "洛阳", "en_name": "Luoyang", "country": "中国", "province": "河南", "lat": 34.6181, "lng": 112.4540},
  {"name": "开封", "en_name": "Kaifeng", "country": "中国", "province": "河南", "lat": 34.7972, "lng": 114.3076},
  {"name": "济南", "en_name": "Jinan", "country": "中国", "province": "山东", "lat": 36.6512, "lng": 117.1201},
  {"name": "太原", "en_name": "Taiyuan", "country": "中国", "province": "山西", "lat": 37.8706, "lng": 112.5489},
  {"name": "大同", "en_name": "Datong", "country": "中国", "province": "山西", "lat": 40.0768, "lng": 113.3001},
  {"name": "石家庄", "en_name": "Shijiazhuang", "country": "中国", "province": "河北", "lat": 38.0428, "lng": 114.5149},
  {"name": "南昌", "en_name": "Nanchang", "country": "中国", "province": "江西", "lat": 28.6820, "lng": 115.8579},
  {"name": "景德镇", "en_name": "Jingdezhen", "country": "中国", "province": "江西", "lat": 29.2941, "lng": 117.2075},
  {"name": "呼和浩特", "en_name": "Hohhot", "country": "中国", "province": "内蒙古", "lat": 40.8426, "lng": 111.7511},
  {"name": "乌鲁木齐", "en_name": "Urumqi", "country": "中国", "province": "新疆", "lat": 43.8256, "lng": 87.6168},
  {"name": "喀什", "en_name": "Kashgar", "country": "中国", "province": "新疆", "lat": 39.4704, "lng": 75.9898},
  {"name": "伊犁", "en_name": "Yili", "country": "中国", "province": "新疆", "lat": 43.9168, "lng": 81.3241},
  {"name": "银川", "en_name": "Yinchuan", "country": "中国", "province": "宁夏", "lat": 38.4872, "lng": 106.2309},
  {"name": "长春", "en_name": "Changchun", "country": "中国", "province": "吉林", "lat": 43.8171, "lng": 125.3235},
  {"name": "延吉", "en_name": "Yanji", "country": "中国", "province": "吉林", "lat": 42.9068, "lng": 129.5076},
  {"name": "沈阳", "en_name": "Shenyang", "country": "中国", "province": "辽宁", "lat": 41.8057, "lng": 123.4315},
  {"name": "大连", "en_name": "Dalian", "country": "中国", "province": "辽宁", "lat": 38.9140, "lng": 121.6147},
  {"name": "天津", "en_name": "Tianjin", "country": "中国", "province": "天津", "lat": 39.0842, "lng": 117.2008}
];

// Read existing data
let currentData = [];
try {
    currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
} catch (e) {
    console.error("Error reading file:", e);
    currentData = [];
}

// Merge (avoid duplicates by name)
let addedCount = 0;
const existingNames = new Set(currentData.map(c => c.name));

newCities.forEach(city => {
    if (!existingNames.has(city.name)) {
        currentData.push(city);
        addedCount++;
    }
});

// Write back
fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
console.log(`Successfully added ${addedCount} new Chinese cities!`);
