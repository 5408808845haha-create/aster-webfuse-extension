ASTER YOUTUBE RECOVERY EXTENSION V2

Files in this folder:
- manifest.json
- background.js
- content.js
- README.txt

Recommended installation:
1. Create a GitHub repository, for example: aster-webfuse-extension
2. Upload the FOUR files in this folder directly to the repository ROOT.
   manifest.json must be visible at the root; do not upload the ZIP itself.
3. In Webfuse Session Editor -> Extensions -> Install extension -> GitHub,
   install that repository.
4. Close/restart the Webfuse/Aster session so the new extension is loaded.
5. Play a YouTube video. In Aster DBG you should eventually see extension
   messages / YouTube checkpoints.

V2 detects:
- HTML video errors
- stalled/waiting playback
- playback that stops advancing
- visible YouTube player error UI
- YouTube SPA navigation
- periodic playback checkpoints

It DOES NOT simulate mouse/keyboard activity and does not bypass Webfuse
session or idle policies.

NOTE:
Aster V1.9 shell code is unchanged by this extension package.
