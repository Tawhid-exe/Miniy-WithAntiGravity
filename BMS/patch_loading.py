import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '<div class="loading-text">Loading BMS...</div><br><button onclick="document.getElementById(\'loading\').style.display=\'none\'; console.log(\'Forced close\')" style="padding: 10px 20px; background: #60a5fa; color: black; font-weight: bold; cursor: pointer; border-radius: 5px;">Force Close Splash Screen</button>'
content = content.replace('<div class="loading-text">Loading BMS...</div>', replacement)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
