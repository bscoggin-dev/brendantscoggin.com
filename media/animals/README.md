Written by Claude Code (Opus 5.5), 2026-11-07.

# Contact-page thank-you photos

All images here are AI-generated. They are shown on `contact.html` after a message is sent,
with the caption "AI-generated photo · made with SD-Turbo".

- **Model:** `stabilityai/sd-turbo` (https://huggingface.co/stabilityai/sd-turbo), run locally on
  The Neo with `~/agentic/tools/cute-animals/generate.py` (diffusers, MPS, fp16, 1 step,
  guidance 0, 512x512). The generator is outside this repo on purpose; only the finished JPEGs ship.
- **Licence:** Stability AI Community License, last updated July 5, 2024
  (https://huggingface.co/stabilityai/sd-turbo/blob/main/LICENSE.md), read 2026-11-07. Outputs are
  owned by the user and are not "Derivative Works" under the licence. If the site ever counts as
  commercial use, the licence is still free under US $1M annual revenue but asks for registration at
  https://stability.ai/community-license.
- **Curation:** generated 2026-11-07, culled by eye for deformities (extra paws, extra ears, merged
  bodies); rejects are kept outside the repo in `cute-animals/out/rejected/`.
- **Files:** JPEG, quality 80, 512x512, 65 KB or less each. `manifest.json` lists every file per
  button group and is what the Worker picks from.

## Groups and prompts

The seed is the number in the generator's original filename (for example seed 105 made
`puppy-105.png`). Each prompt picked a setting and a light from fixed lists with `random.Random(seed)`.

| Group | Button | Count | Prompt shape |
|---|---|---|---|
| `dogs` | Submit for Dogs | 58 | `photo of a cute <breed> puppy <setting>, <light>, shallow depth of field, sharp focus, high detail, professional pet photography`; 25 breeds cycled by seed. dogs-01 to 04 come from the first smoke test, whose prompt had no breed. |
| `cats` | Submit for Cats | 57 | Same shape with `<coat or breed> kitten`; 25 coats and breeds cycled by seed. |
| `alien` | Submit for Alien! | 75 | `photo of a cute baby alien creature, <creature>, <alien setting>, <alien light>, surreal, bizarre, otherworldly, ...`; 25 creature descriptions cycled by seed. None culled. |

## File-to-seed map

- dogs: 01=0, 02=1, 03=3, 04=4, 05=100, 06=101, 07=102, 08=105, 09=106, 10=107, 11=108, 12=109, 13=111, 14=112, 15=113, 16=114, 17=117, 18=118, 19=119, 20=120, 21=122, 22=123, 23=125, 24=126, 25=127, 26=128, 27=129, 28=130, 29=131, 30=132, 31=135, 32=136, 33=137, 34=138, 35=139, 36=140, 37=142, 38=144, 39=145, 40=148, 41=149, 42=150, 43=151, 44=152, 45=153, 46=154, 47=155, 48=156, 49=160, 50=161, 51=162, 52=163, 53=164, 54=165, 55=166, 56=167, 57=168, 58=172
- cats: 01=100, 02=103, 03=104, 04=105, 05=106, 06=107, 07=108, 08=109, 09=110, 10=111, 11=112, 12=114, 13=116, 14=117, 15=118, 16=119, 17=120, 18=121, 19=123, 20=125, 21=127, 22=128, 23=130, 24=131, 25=132, 26=133, 27=135, 28=136, 29=140, 30=141, 31=142, 32=143, 33=144, 34=145, 35=146, 36=148, 37=149, 38=150, 39=151, 40=152, 41=153, 42=154, 43=157, 44=158, 45=159, 46=160, 47=161, 48=162, 49=163, 50=165, 51=166, 52=167, 53=170, 54=171, 55=172, 56=173, 57=174
- alien: alien-NN = seed 99+NN (01=100 through 75=174)
