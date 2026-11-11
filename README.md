# Runway Summer Christmas Party 🌺🎄

Invitation site for the Runway end-of-year celebration, Wednesday 2 December 2026.

```
docs/                  ← the website (this is the only folder you publish)
  index.html
  styles.css
  script.js
  config.js            ← organiser email + dates
  secret-santa-data.js ← placeholder until the draw runs
secret-santa/
  draw.js              ← the Secret Santa draw
  participants.txt     ← one name per line
  assignments-PRIVATE.csv  ← created by the draw; git-ignored, never publish
```

The site lives in `docs/` so the private CSV is never inside the folder you upload.

## How RSVPs and nominations work

Everything comes to Aleisha by email (address set in `docs/config.js`):

- **RSVP now** opens a pre-filled email: subject `RSVP: Yes! …`, with blanks for
  dietary requirements (the sender's address tells you who it's from). Everyone who
  RSVPs yes is in the Secret Santa.
- **Can't make it?** opens an `RSVP: Can't make it …` email.
- Each **Nominate** button on an award card opens a `2026 Runway Awards nomination: …`
  email with the award already filled in.

Tip: make Outlook rules that move emails with subjects starting `RSVP:` and
`2026 Runway Awards nomination` into their own folders.

If someone's computer has no email app set up, the button may do nothing. The RSVP
section shows the address with a **Copy address** button for them.

## 1. Deploy

The site is live at <https://langdalea.github.io/runway-xmas-party/>, published by
GitHub Pages from the `docs` folder on `main` in
[langdalea/runway-xmas-party](https://github.com/langdalea/runway-xmas-party).
Every push to `main` redeploys automatically. The repo is public, so never commit
anything private.

## 2. Run the Secret Santa draw (after RSVPs close on Wed 11 Nov)

1. Install Node.js (LTS) from <https://nodejs.org> if you don't have it.
2. Go through the `RSVP: Yes!` emails and copy the name of everyone who's coming into
   `secret-santa/participants.txt`, one per line. Everyone attending is in the draw.
3. In a terminal in this folder run:

   ```bash
   node secret-santa/draw.js
   ```

4. Commit and push **only** `docs/secret-santa-data.js` (it's encrypted, so it's safe).
   Don't commit `participants.txt`: the repo is public. The reveal box appears on the
   site a minute or two later.

The draw won't overwrite an existing draw by accident. To redraw (everyone gets new
matches and new codes), run `node secret-santa/draw.js --force`.

## 3. Send codes privately

Open `secret-santa/assignments-PRIVATE.csv` and send each person **only their own code**
(Teams DM or individual email), e.g.:

> Kia ora Sam! Your Secret Santa code is **JANDAL-4821**. Enter it in the "Reveal your
> Secret Santa" box at <site link> to see who you're buying for. Remember: second-hand
> only, no spending limit, and bring it to croquet! 🎁

Don't put the codes in a group chat or one email with everyone on it.

## 4. Before the night

- Send the dietary requirements from the RSVP emails to Azabu.
- Tally the award nominations. Winners get announced at dinner.
