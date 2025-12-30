const fs = require('fs');
const path = require('path');

const pdbPath = path.join(__dirname, '../src/other/pdb_messages.txt');
const wechatPath = path.join(__dirname, '../src/other/wechat_message.txt');
const outputPath = path.join(__dirname, '../src/data/wordCloudData.json');

// Stop words list (Common Chinese noise words in chat)
const stopWords = new Set([
    '的', '了', '我', '是', '你', '在', '吗', '吧', '啊', '呢', '有', '就', '不', '都', '个', '也', '我们', '去', '好', '要', 
    'Rayest', 'Ashley', 'yelhsA', '回复', '已回复', '图片', '撤回', '昨天', '今天', '明天', '什么', '那个', '这个', '这么', '那么',
    '这里', '那里', '感觉', '觉得', '就是', '还是', '可能', '应该', '可以', '或者', '然后', '因为', '所以', '如果', '虽然', '但是',
    '哈哈', '哈哈哈', '哈哈哈哈', '哈哈哈哈哈', '啊啊', '啊啊啊', '呜呜', '嘿嘿', '嘻嘻', '嗯', '哦', '噢', '哎', '唉', '嘛', '啦', '呀',
    '着', '过', '得', '地', '之', '和', '与', '或', '及', '等', '跟', '被', '把', '让', '给', '但', '那', '这', '它', '他', '她',
    '自己', '怎么', '怎样', '如何', '为什么', '为了', '对于', '关于', '作为', '随着', '通过', '进行', '开始', '结束', '完成',
    '全部', '文件', '链接', '音乐', '音频', '取消', // Removed '喜欢' from stop words
    '5G', '2025', '2024', '13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01', '00',
    'com', 'http', 'https', 'www', 'jpg', 'png', 'mp4',
    '一个', '你的', '我也', '这样', '真的', '也是', '没有', '我的', '其实', '一样', '现在', '什么', '可以', '觉得',
    '还是', '因为', '所以', '如果', '但是', '虽然', '而且', '时候', '知道', '出来', '有点', '不用', '不能', '不会',
    '看到', '还有', '那个', '这个', '这么', '那么', '这里', '那里', '一直', '一下', '一次', '一天', '一点', '一些',
    '不过', '好像', '不是', '这种', '这些', '那些', '有些', '东西', '事情', '问题', '之前', '之后', '今天', '明天', '后天',
    '的话', '他们'
]);

// Special system messages to ignore completely
const systemPatterns = [
    /^\d{2}:\d{2}/, // Time
    /^\d{4}年\d{1,2}月\d{1,2}日/, // Date
    /^Rayest/, // Names
    /^yelhsA/,
    /^Ashley/,
    /^回复你了/,
    /^已回复/,
    /^\[.*\]$/, // [Images], [Emoji]
    /文件链接/,
    /音乐与音频/,
    /全部图片/
];

function cleanText(text) {
    // 1. Split into lines
    const lines = text.split('\n');
    let cleanContent = '';

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Skip system patterns
        if (systemPatterns.some(p => p.test(trimmed))) return;

        // Skip if line is just a date/time or noise
        if (trimmed.length < 2 && !/[\u4e00-\u9fa5]/.test(trimmed)) return;

        cleanContent += trimmed + ' ';
    });

    return cleanContent;
}

function generateWordCloud() {
    let combinedText = '';

    // Read files
    if (fs.existsSync(pdbPath)) {
        console.log('Reading PDB messages...');
        combinedText += cleanText(fs.readFileSync(pdbPath, 'utf-8'));
    }
    
    if (fs.existsSync(wechatPath)) {
        console.log('Reading WeChat messages...');
        combinedText += cleanText(fs.readFileSync(wechatPath, 'utf-8'));
    }

    if (!combinedText) {
        console.error('No text found!');
        return;
    }

    // Segment text
    console.log('Segmenting text...');
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
    const segments = segmenter.segment(combinedText);

    const wordCounts = {};

    for (const { segment, isWordLike } of segments) {
        if (!isWordLike) continue;
        
        let word = segment.trim();
        
        // Merge '很喜欢' into '喜欢'
        if (word === '很喜欢') word = '喜欢';
        // Merge '好多' into '很多'
        if (word === '好多') word = '很多';

        // Filter
        if (word.length < 2) continue; // Skip single chars usually
        if (stopWords.has(word)) continue;
        if (/^\d+$/.test(word)) continue; // Skip pure numbers
        if (/^[a-zA-Z]+$/.test(word)) continue; // Skip pure English words (unless meaningful, but often noise like 'div')

        wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    // Convert to array
    const wordArray = Object.entries(wordCounts)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 400); // Top 400 words

    fs.writeFileSync(outputPath, JSON.stringify(wordArray, null, 2));
    console.log(`Generated Word Cloud with ${wordArray.length} words.`);
    console.log('Top 10 words:', wordArray.slice(0, 10));
}

generateWordCloud();
