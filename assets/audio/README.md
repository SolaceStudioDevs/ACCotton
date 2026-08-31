# Demo reels

Drop reel files here and point each `<source src>` in `index.html` at them.

Expected filenames (change freely — just keep markup and files in sync):

- `commercial.mp3`
- `narration.mp3`
- `character.mp3`

**Encoding:** MP3, 128–192 kbps, mono is fine for voice. Keep each reel
under ~3 MB so the page stays quick on mobile. The player reads duration from
metadata, so make sure the files aren't streamed-VBR without a header.
