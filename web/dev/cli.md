# Command line

The package ships a `capstring` executable. Run it without installing anything:

```bash
npx capstring kebab "Hello World"
# hello-world
```

Or install globally:

```bash
npm install -g capstring
capstring --version
```

## Usage

```
capstring <style> [text...]     Transform text (reads stdin when no text is given)
capstring --all [text...]       Print every style
capstring --list                List style names

Options:
  -a, --all        Print every style
  -l, --list       List style names, one per line
      --json       JSON output
  -h, --help       Show this help
  -v, --version    Show version
  --               End of options
```

Multiple text arguments are joined with one space. Flags may appear anywhere.

## Examples

```bash
capstring title hello world              # Hello World
capstring snake "Hello World"            # hello_world
capstring --all hi                       # every style, one per line
capstring --all --json hi                # { "same": "hi", "none": "", ... }
capstring kebab --json "Hello World"     # {"input":"Hello World","style":"kebab","output":"hello-world"}
capstring --list                         # same, none, proper, ...
capstring upper -- --not-a-flag          # --NOT-A-FLAG
```

## Pipes

With no text argument the CLI reads all of stdin and strips one trailing newline, so it slots into pipelines:

```bash
echo "hello world" | capstring title                 # Hello World
git branch --show-current | capstring slug           # feature-x
pbpaste | capstring sponge | pbcopy                  # macOS clipboard round trip
cat names.txt | capstring --all --json > styles.json
```

Multiline stdin is treated as one string. In the `--all` table, line breaks inside a result are shown escaped (`\n`) so every style stays on one row; use `--json` to get the raw values.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `2` | Usage error: unknown style, unknown option, or no text given on a terminal |

Errors go to stderr; output goes to stdout, always ending in a newline.
