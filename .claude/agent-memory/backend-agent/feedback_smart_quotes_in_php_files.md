---
name: Smart quotes cause PHP parse errors in CI4 config files
description: The Edit tool can introduce Unicode typographic quotes that break PHP files in CI4 config context
type: feedback
---

When using the Edit tool to modify PHP files that contain string keys in arrays (like CI4 Config files), the replacement text may have Unicode typographic single quotes (U+2018 `'` / U+2019 `'`) substituted for ASCII single quotes (`'`). In PHP, typographic quotes are not string delimiters — they cause `Undefined constant` errors when the file is loaded.

The symptom in CI4 is: `Error: Undefined constant "Config\'csrf'"` at the line containing the array key.

**Why:** The Edit tool's text substitution can convert straight quotes to curly quotes in the replacement content, especially in multi-line replacements.

**How to apply:** After editing a PHP config file that contains string array keys, verify the file has no Unicode smart quotes:

```python
python3 -c "
with open('file.php', 'rb') as f: c = f.read()
print(c.count(b'\xe2\x80\x98') + c.count(b'\xe2\x80\x99'), 'smart quotes found')
"
```

If smart quotes are found, use `cat > file.php << 'HEREDOC'` to write the file directly via bash, which guarantees ASCII encoding.
