#!/usr/bin/env bash
# Publica exact continutul salvat in origin/main. Nu modifica fisierele de lucru.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"
remote_name="${DEPLOY_REMOTE:-origin}"
remote_url="$(git remote get-url "$remote_name")"

# Nu stergem o ramura folosita de un alt director de lucru.
if git worktree list --porcelain | grep -q '^branch refs/heads/gh-pages$'; then
  printf '%s\n' 'Ramura gh-pages este deschisa intr-un director de lucru. Schimba ramura acelui director inainte de publicare.' >&2
  exit 1
fi
if git show-ref --verify --quiet refs/heads/gh-pages; then
  git branch -D gh-pages
fi

printf '%s\n' 'Preiau ultima versiune publicata in main…'
git fetch "$remote_name" '+refs/heads/main:refs/remotes/'"$remote_name"'/main'
main_commit="$(git rev-parse "refs/remotes/$remote_name/main")"
# Capture the remote tip so a concurrent deployment cannot be silently replaced.
remote_tip="$(git ls-remote --heads "$remote_name" refs/heads/gh-pages | cut -f1)"
publish_dir="$(mktemp -d "${TMPDIR:-/tmp}/advent-pages.XXXXXX")"
trap 'rm -rf "$publish_dir"' EXIT

git archive "$main_commit" | tar -x -C "$publish_dir"
# Publish only runtime files; never personal selection notes or repository metadata.
for required in index.html style.css app.js calendar.js memories.js quiz.js assets vendor; do
  if [[ ! -e "$publish_dir/$required" ]]; then
    printf 'Lipseste %s din main. Salveaza si trimite mai intai proiectul in main.\n' "$required" >&2
    exit 1
  fi
done
for entry in "$publish_dir"/* "$publish_dir"/.[!.]* "$publish_dir"/..?*; do
  [[ -e "$entry" ]] || continue
  case "$(basename "$entry")" in
    index.html|style.css|app.js|calendar.js|memories.js|quiz.js|assets|vendor) ;;
    *) rm -rf "$entry" ;;
  esac
done
rm -f "$publish_dir/CNAME"
# Include only photos referenced by the fixed calendar.
if command -v node >/dev/null 2>&1; then
  node --input-type=module - "$publish_dir" <<'JS'
import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2];
const source=fs.readFileSync(path.join(root,'memories.js'),'utf8');
const {memories}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const chosen=new Set(memories.map(m=>path.basename(m.src)));
for(const file of fs.readdirSync(path.join(root,'assets/photos'))) {
 if(!chosen.has(file))fs.rmSync(path.join(root,'assets/photos',file),{recursive:true});
}
JS
else
  printf '%s\n' 'Este necesar Node.js pentru verificarea fotografiilor inainte de publicare.' >&2
  exit 1
fi
touch "$publish_dir/.nojekyll"

git -C "$publish_dir" init --quiet --initial-branch=gh-pages
git -C "$publish_dir" config user.name "$(git config user.name || printf 'Advent deploy')"
git -C "$publish_dir" config user.email "$(git config user.email || printf 'advent@users.noreply.github.com')"
git -C "$publish_dir" add --all
git -C "$publish_dir" commit --quiet -m "Deploy calendar from main ${main_commit:0:12}"
git -C "$publish_dir" remote add publish "$remote_url"
printf '%s\n' 'Public pe gh-pages…'
git -C "$publish_dir" push --force-with-lease="refs/heads/gh-pages:$remote_tip" publish HEAD:refs/heads/gh-pages
printf '%s\n' 'Publicarea pe gh-pages este gata. In GitHub: Settings → Pages → Deploy from a branch → gh-pages / (root).'
