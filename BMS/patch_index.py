import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Force Close button safely
splash_html = '<div class="loading-text">Loading BMS...</div>'
force_btn = '<div class="loading-text">Loading BMS...</div><br><button onclick="document.getElementById(\'loading\').style.display=\'none\';" style="position:relative;z-index:999999;margin-top:20px;padding:10px 20px;background:#60a5fa;color:black;font-weight:bold;cursor:pointer;border-radius:5px;">Force Close Splash Screen</button>'
html = html.replace(splash_html, force_btn)

# Safely inject window.onerror at the very start of the main script tag
script_start = '<script>'
onerror_code = '''<script>
window.onerror = function(msg, url, lineNo, columnNo, error) {
  var errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;z-index:999999;padding:20px;font-family:monospace;font-size:14px;white-space:pre-wrap;';
  errDiv.textContent = 'JAVASCRIPT CRASH: ' + msg + '\\nLine: ' + lineNo;
  document.body.appendChild(errDiv);
  return false;
};
window.onunhandledrejection = function(event) {
  var errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;top:50%;left:0;right:0;background:darkred;color:white;z-index:999999;padding:20px;font-family:monospace;font-size:14px;white-space:pre-wrap;';
  errDiv.textContent = 'PROMISE CRASH: ' + (event.reason ? (event.reason.stack || event.reason) : event);
  document.body.appendChild(errDiv);
};
'''
html = html.replace(script_start, onerror_code, 1) # only replace the first <script> (which is the main one)

# Ensure initTokenClient has try-catch
old_init = "supabase=window.supabase.createClient(cfg.clientId,cfg.sheetId);"
new_init = "try { supabase=window.supabase.createClient(cfg.clientId,cfg.sheetId); } catch(e) { console.error('Supabase init error:', e); supabase = null; }"
html = html.replace(old_init, new_init)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
