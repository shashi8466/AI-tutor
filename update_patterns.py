# -*- coding: utf-8 -*-
content = open(r'c:\Users\user\Documents\admin new\server\quizParser.js', 'r', encoding='utf-8').read()

# Update questionNumber pattern
content = content.replace(
    r'questionNumber: /^(?:Q\.?\s*)?(\d+)[\.)](?:\s+(.*))?$/i,',
    r'questionNumber: /^(?:Q\.?\s*)?(\d+)[\.:)](?:\s+(.*))?$/i,'
)

# Update option pattern
content = content.replace(
    r'option: /^\s*([A-D])[\.\)\:\-\s]+(.+)$/i,',
    r'option: /^\s*([A-D0-9])[\.\)\:\-\s]+(.+)$/i,'
)

# Update answer pattern
content = content.replace(
    r'answer: /^(?:Ans(?:wer)?|Correct\s+Answer|Key|Solution)\s*[:\-]?\s*([A-D])/i,',
    r'answer: /^(?:Ans(?:wer)?|Correct\s+Answer|Key|Solution)\s*[:\-]?\s*([A-D0-9])/i,'
)

# Write back to file
open(r'c:\Users\user\Documents\admin new\server\quizParser.js', 'w', encoding='utf-8').write(content)
print('Updated all patterns')