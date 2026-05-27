import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

polyfill = '''<script>
const safeStorage = {
  data: {},
  getItem(k) { try { return window.localStorage.getItem(k); } catch(e) { return this.data[k] || null; } },
  setItem(k, v) { try { window.localStorage.setItem(k, v); } catch(e) { this.data[k] = String(v); } },
  removeItem(k) { try { window.localStorage.removeItem(k); } catch(e) { delete this.data[k]; } }
};
</script>'''

# Inject polyfill right after <style> or anywhere before the main script. We'll put it right after the supabase script.
supabase_script = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
html = html.replace(supabase_script, supabase_script + '\n' + polyfill)

# Replace all localStorage with safeStorage
html = html.replace('localStorage.getItem', 'safeStorage.getItem')
html = html.replace('localStorage.setItem', 'safeStorage.setItem')
html = html.replace('localStorage.removeItem', 'safeStorage.removeItem')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
