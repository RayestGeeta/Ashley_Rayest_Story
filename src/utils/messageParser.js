
export const parseMessages = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const messages = [];
  
  let currentSender = null;
  let currentDate = null;
  let expectingMessage = false;

  // Regex patterns
  const timePattern = /\d{1,2}[:：]\d{2}/;
  const datePattern = /\d{1,2}月\d{1,2}日/;
  const relativePattern = /^(昨天|周[一二三四五六日])/; 
  const rayestPattern = /^Rayest/;
  
  // Garbage filters
  const garbagePatterns = [
    /喜欢取消$/,
    /^全部图片/,
    /^21:4/, // System time headers
    /^含文字/,
    /^\[含文字/,
    /^Rayest$/, // Empty sender line
  ];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip garbage
    if (garbagePatterns.some(p => p.test(line))) {
      expectingMessage = false; // Reset if we hit garbage
      continue;
    }

    // Check if line is a header
    const isRayest = rayestPattern.test(line);
    const hasTime = timePattern.test(line);
    const hasDate = datePattern.test(line);
    const hasRelative = relativePattern.test(line);
    
    // Determine if it's a header line
    // STRICTER THRESHOLD:
    // A header line usually starts with Rayest OR is just a date/time
    // If it's NOT Rayest, it must be very short (e.g. "12:30", "昨天", "周五", "11月14日")
    // "但我内心其实不相信你会出现11月14日" is 19 chars -> Should NOT be header.
    const isDateHeader = (hasTime || hasDate || hasRelative) && line.length < 12;
    
    const isHeader = isRayest || isDateHeader;

    if (isHeader) {
      currentSender = isRayest ? 'Rayest' : 'Partner';
      
      // Extract date string for display
      // Remove "Rayest" from the start
      let dateStr = line.replace(/^Rayest/, '').trim();
      currentDate = dateStr;
      
      expectingMessage = true;
    } else if (expectingMessage) {
      // This is the message body
      
      // Clean up message
      // Sometimes the date is repeated at the end of the message line
      // E.g. "message content昨天"
      if (currentDate) {
         // Create a regex to remove the specific current date from the end, or generic date patterns
         const suffixPatterns = [
             /昨天$/,
             /周[一二三四五六日]$/,
             /\d{1,2}月\d{1,2}日$/
         ];
         
         for (const pat of suffixPatterns) {
             if (pat.test(line)) {
                 line = line.replace(pat, '');
                 break;
             }
         }
      }

      if (line.trim()) {
        messages.push({
          id: i,
          content: line.trim(),
          sender: currentSender,
          date: currentDate
        });
      }
      
      expectingMessage = false;
    }
  }
  
  return messages;
};
