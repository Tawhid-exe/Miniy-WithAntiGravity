import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Define the polyfill using 'window.localStorage' explicitly, but we'll only replace exact instances of 'localStorage.'
polyfill = '''<script>
const safeStorage = {
  data: {},
  getItem: function(k) { try { return window['local'+'Storage'].getItem(k); } catch(e) { return this.data[k] || null; } },
  setItem: function(k, v) { try { window['local'+'Storage'].setItem(k, v); } catch(e) { this.data[k] = String(v); } },
  removeItem: function(k) { try { window['local'+'Storage'].removeItem(k); } catch(e) { delete this.data[k]; } }
};
</script>'''

# Inject polyfill after Supabase script
supabase_script = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
html = html.replace(supabase_script, supabase_script + '\n' + polyfill)

# ONLY replace exact localStorage calls (avoiding window['localStorage'])
html = html.replace('localStorage.getItem', 'safeStorage.getItem')
html = html.replace('localStorage.setItem', 'safeStorage.setItem')
html = html.replace('localStorage.removeItem', 'safeStorage.removeItem')

# Ensure initTokenClient has try-catch
old_init = "supabase=window.supabase.createClient(cfg.clientId,cfg.sheetId);"
new_init = "try { supabase=window.supabase.createClient(cfg.clientId,cfg.sheetId); } catch(e) { console.error('Supabase init error:', e); supabase = null; }"
html = html.replace(old_init, new_init)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
